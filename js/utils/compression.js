PP64.ns("utils");

PP64.utils.compression = (function() {
  var WINDOW_START = 0x3BE;
  var WINDOW_SIZE = 1024;

  var MIN_MATCH_LEN = 3;
  // var MAX_MATCH_LEN = 0x42;

  /* Mario Party N64 compression type 01
   *
   * This type of compression was used in all three titles, though was the
   * exclusive type available in the original title. It is similar to LZSS, and
   * uses a 1KB circular buffer when referencing offsets. Like yaz0 compression,
   * there are code bytes for every 8 "chunks," though they are read from right
   * to left (0x01 to 0x80).
   *
   * When a '0' code bit is encountered, the next two bytes in the input are
   * read as offset and length pairs into the sliding window.
   *
   *       Byte 1    Byte 2
   *     [oooooooo][oollllll]
   *
   * The two offset bits within Byte 2 are masked and shifted such that they
   * become the most significant bits. The length is found by adding the value
   * of MIN_MATCH_LEN, in this case, 3.
   *
   * Notably, the circular buffer begins filling not at zero, but at a position
   * roughly 90% of the way through, WINDOW_START.
   */
  function decompress01(src, dst, decompressedSize) {
    // Current positions in src/dst buffers and sliding window.
    var srcPlace = 0;
    var dstPlace = 0;
    var winPlace = WINDOW_START;

    // Create the sliding window buffer. Must be initialized to zero as some
    // files look into the window right away for starting zeros.
    var winBuffer = new ArrayBuffer(WINDOW_SIZE);
    var windowArray = new DataView(winBuffer);

    // The code byte's bits are interpreted to mean straight copy (1) or read
    // from sliding window (0).
    var curCodeByte = 0;
    while (dstPlace < decompressedSize) {
      // Read a new "code" byte if the current one has expired. By placing an
      // 0xFF prior to the code bits, we can tell when we have consumed the
      // code byte by observing that the value will be become 0 only when we
      // have shifted away all of the code bits.
      if ((curCodeByte & 0x100) === 0) {
        curCodeByte = src.getUint8(srcPlace);
        curCodeByte |= 0xFF00;
        ++srcPlace;
      }

      if ((curCodeByte & 0x01) === 1) {
        // Copy the next byte from the source to the destination.
        dst.setUint8(dstPlace, src.getUint8(srcPlace));
        windowArray.setUint8(winPlace, src.getUint8(srcPlace));
        ++dstPlace;
        ++srcPlace;
        winPlace = (winPlace + 1) % WINDOW_SIZE;
      }
      else {
        // Interpret the next two bytes as an offset into the sliding window and
        // a length to read.
        var byte1 = src.getUint8(srcPlace);
        var byte2 = src.getUint8(srcPlace + 1);
        srcPlace += 2;

        var offset = ((byte2 & 0xC0) << 2) | byte1;
        var count = (byte2 & 0x3F) + MIN_MATCH_LEN;

        // Within the sliding window, locate the offset and copy count bytes.
        var val;
        for (var i = 0; i < count; ++i) {
          val = windowArray.getUint8(offset % WINDOW_SIZE);
          windowArray.setUint8(winPlace, val);
          winPlace = (winPlace + 1) % WINDOW_SIZE;
          dst.setUint8(dstPlace, val);
          ++dstPlace;
          ++offset;
        }
      }

      // Consider the code bit consumed.
      curCodeByte >>= 1;
    }

    return srcPlace; // Return the size of the compressed data.
  }

  /* This is a hack for MP3 Strings3 at the moment. Just "wraps" with dummy code
   * words, so file size will just grow.
   */
  function compress01(src) {
    let codeWordCount = Math.ceil(src.byteLength / 8);
    let compressedSize = src.byteLength + codeWordCount;
    let compressedBuffer = new ArrayBuffer(compressedSize);
    let dst = new DataView(compressedBuffer);

    let dstPlace = 0;
    let srcPlace = 0;
    while (dstPlace < compressedSize) {
      if (!dstPlace || !(dstPlace % 9)) {
        dst.setUint8(dstPlace, 0xFF);
      }
      else {
        dst.setUint8(dstPlace, src.getUint8(srcPlace));
        srcPlace++;
      }
      dstPlace++;
    }

    return compressedBuffer;
  }

  /* Mario Party N64 compression type 02
   *
   * This compression algorithm was introduced in Mario Party 2, and is very
   * similar to yaz0. It uses word sized groups of code bits rather than a
   * single byte, and reads them in the same left to right order as yaz0. The
   * interpretation of the bytes when a code bit is 0 is also the same as yaz0.
   *
   *       Byte 1    Byte 2     [Byte 3 when l = 0]
   *     [lllldddd][dddddddd]   [llllllll]
   *
   * The values of length and lookback distance are simply split apart and used.
   * The special case when length == 0 in yaz0 also applies, where a third byte
   * is read as the value of length and 0x12 is added. When the lookback
   * distance is farther than the start (out of bounds), 0s are inserted.
   *
   * It is noted as type "3" when used for non-HVQ images, but there is no known
   * difference between types 2 and 3.
   */
  function decompress02(src, dst, decompressedSize) {
    // Current positions in src/dst buffers.
    var srcPlace = 0;
    var dstPlace = 0;

    // The code word's bits are interpreted to mean straight copy (1)
    // or lookback and read (0).
    var curCodeWord = 0;
    var codeWordBitsRemaining = 0;
    while (dstPlace < decompressedSize) {
      // Read a new code word if the current one has expired.
      if (codeWordBitsRemaining === 0) {
        curCodeWord = src.getUint32(srcPlace);
        codeWordBitsRemaining = 32;
        srcPlace += 4;
      }

      if ((curCodeWord & 0x80000000) !== 0) {
        // Copy the next byte from the source to the destination.
        dst.setUint8(dstPlace, src.getUint8(srcPlace));
        ++dstPlace;
        ++srcPlace;
      }
      else {
        // Interpret the next two bytes as a distance to travel backwards and a
        // a length to read.
        var byte1 = src.getUint8(srcPlace);
        var byte2 = src.getUint8(srcPlace + 1);
        srcPlace += 2;

        var back = (((byte1 & 0x0F) << 8) | byte2) + 1;
        var count = ((byte1 & 0xF0) >> 4) + 2;

        if (count === 2) {
          // Special case where 0xF0 masked byte 1 is zero.
          count = src.getUint8(srcPlace) + 0x12;
          ++srcPlace;
        }

        // Step back and copy count bytes into the dst.
        var i, val;
        for (i = 0; i < count && dstPlace < decompressedSize; ++i) {
          if (back > dstPlace)
            val = 0;
          else
            val = dst.getUint8(dstPlace - back);

          dst.setUint8(dstPlace, val);
          ++dstPlace;
        }
      }

      // Consider the code bit consumed.
      curCodeWord <<= 1;
      --codeWordBitsRemaining;
    }

    return srcPlace; // Return the size of the compressed data.
  }

  /* This is a hack for MP2 HVQ at the moment. Just "wraps" with dummy code
   * words, so file size just grows.
   */
  function compress02(src) {
    let codeWordCount = src.byteLength / 32;
    let compressedSize = src.byteLength + (codeWordCount * 4);
    let compressedBuffer = new ArrayBuffer(compressedSize);
    let dst = new DataView(compressedBuffer);

    let srcPlace = 0;
    for (let i = 0; i < compressedSize; i += 36, srcPlace += 32) {
      dst.setUint32(i, 0xFFFFFFFF);
      dst.setUint32(i + 4, src.getUint32(srcPlace));
      dst.setUint32(i + 8, src.getUint32(srcPlace + 4));
      dst.setUint32(i + 12, src.getUint32(srcPlace + 8));
      dst.setUint32(i + 16, src.getUint32(srcPlace + 12));
      dst.setUint32(i + 20, src.getUint32(srcPlace + 16));
      dst.setUint32(i + 24, src.getUint32(srcPlace + 20));
      dst.setUint32(i + 28, src.getUint32(srcPlace + 24));
      dst.setUint32(i + 32, src.getUint32(srcPlace + 28));
    }

    return compressedBuffer;
  }

  /* Mario Party N64 compression type 05
   *
   * This is mostly a run-length encoding. The algorithm can be pretty simply
   * described:
   * 1. Read a byte
   * 2. If the byte has the sign bit (byte & 0x80), then get rid of the sign
   *    bit and use that to count and copy in that many bytes.
   * 3. If there is no sign bit, use the byte to count and repeat the next byte
   *    for that many times.
   * 4. Repeat until decompressed size reached.
   *
   * Typically this is used when there are a lot of zeroes or repeated single
   * values, like in some images.
   */
  function decompress05(src, dst, decompressedSize) {
    // Current positions in src/dst buffers.
    let srcPlace = 0;
    let dstPlace = 0;

    while (dstPlace < decompressedSize) {
      let curCodeByte = src.getUint8(srcPlace);
      srcPlace++;

      let count = curCodeByte & 0x7F;
      if (curCodeByte & 0x80) {
        // Having the sign bit means we read the next n bytes from the input.
        for (let i = 0; i < count; i++) {
          let nextByte = src.getUint8(srcPlace);
          srcPlace++;
          dst.setUint8(dstPlace, nextByte);
          dstPlace++;
        }
      }
      else {
        // No sign bit means we repeat the next byte n times.
        let repeatedByte = src.getUint8(srcPlace);
        srcPlace++;

        for (let i = 0; i < count; i++) {
          dst.setUint8(dstPlace, repeatedByte);
          dstPlace++;
        }
      }
    }

    return srcPlace; // Return the size of the compressed data.
  }

  return {
    // Returns a new buffer with the decompressed data.
    // The compressed size is attached as a property to the buffer object.
    decompress: function(type, srcDataView, decompressedSize) {
      let dstBuffer = new ArrayBuffer(decompressedSize);
      let dstView = new DataView(dstBuffer);
      let compressedSize;
      switch (type) {
        case 1:
          compressedSize = decompress01(srcDataView, dstView, decompressedSize);
          break;
        case 2:
        case 3:
        case 4:
          compressedSize = decompress02(srcDataView, dstView, decompressedSize);
          break;
        case 5:
          compressedSize = decompress05(srcDataView, dstView, decompressedSize);
          break;
        case 0:
          // Just directly copy uncompressed data.
          compressedSize = decompressedSize;
          for (let i = 0; i < decompressedSize; i++)
            dstView.setUint8(i, srcDataView.getUint8(i));
          break;
        default:
          $$log(`decompression ${type} not implemented.`);
          break;
      }

      dstBuffer.compressedSize = compressedSize;
      return dstBuffer;
    },

    compress: function(type, srcDataView) {
      switch (type) {
        case 1:
          return compress01(srcDataView);
        case 2:
        case 3:
          return compress02(srcDataView);
        case 4:
        case 5:
          console.log(`compress ${type} not implemented.`);
          break;
        case 0:
          /* falls through */
        default:
          // Just directly copy uncompressed data.
          return srcDataView.buffer.slice(0);
      }
    },

    getCompressedSize: function(type, srcDataView, decompressedSize) {
      let dstBuffer = new ArrayBuffer(decompressedSize);
      let dstView = new DataView(dstBuffer);

      switch (type) {
        case 1:
          return decompress01(srcDataView, dstView, decompressedSize);
        case 2:
        case 3:
        case 4:
          return decompress02(srcDataView, dstView, decompressedSize);
        case 5:
          return decompress05(srcDataView, dstView, decompressedSize);
        case 0:
          return decompressedSize;
        default:
          $$log(`getCompressedSize ${type} not implemented.`);
      }
    }
  };
})();
