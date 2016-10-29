PP64.ns("utils.img");

PP64.utils.img.HVQ = class HVQ {
  static decode(hvqView) {
    let firstWord = hvqView.getUint32(0);
    let isHVQ = (firstWord & 0x48565100) === 0x48565100; // "HVQ"
    // $$log(`HVQ.decode, isHVQ: ${isHVQ}, len: ${$$hex(hvqView.byteLength)})`);
    if (firstWord === 0x00000003) { // MP2+ can have run-length instead
      let fileStartView = new DataView(hvqView.buffer, 8);
      let decompressedSize = hvqView.getUint32(4);
      return PP64.utils.compression.decompress(3, fileStartView, decompressedSize);
    }
    if (!isHVQ) {
      let buffer = hvqView.buffer;
      return buffer.slice(hvqView.byteOffset, hvqView.byteOffset + hvqView.byteLength);
    }

    if (!window.PP64.utils.img.HVQ._blackRGB16) {
      window.PP64.utils.img.HVQ._blackRGB16 = new ArrayBuffer(0x1800);
      var blackView = new DataView(window.PP64.utils.img.HVQ._blackRGB16);
      for (var i = 0; i < (0x1800 / 2); i++) {
        blackView.setUint16(i * 2, 0x0001);
      }
    }

    return window.PP64.utils.img.HVQ._blackRGB16; // FIXME LOL

    // Decode the huffman tree for the first chunk.
    let firstChunkOffset = HVQ._getChunkOffset(hvqView, 0);
    let firstChunkHuffmanResult = HVQ._recursiveHuffmanBuild(hvqView, (8 * (firstChunkOffset + 4)));
    console.log("HVQ Huff 1: ", firstChunkHuffmanResult.node);
    //console.log("remaining: ", ((firstChunkOffset + 4 + hvqView.getUint32(firstChunkOffset)) * 8) - firstChunkHuffmanResult.nextOffset);

    let thirdChunkOffset = HVQ._getChunkOffset(hvqView, 2);
    let thirdChunkHuffmanResult = HVQ._recursiveHuffmanBuild(hvqView, (8 * (thirdChunkOffset + 4)));
    console.log("HVQ Huff 3: ", thirdChunkHuffmanResult.node);

    let fifthChunkOffset = HVQ._getChunkOffset(hvqView, 4);
    let fifthChunkHuffmanResult = HVQ._recursiveHuffmanBuild(hvqView, (8 * (fifthChunkOffset + 4)));
    console.log("HVQ Huff 5: ", fifthChunkHuffmanResult.node);

    let eleventhChunkOffset = HVQ._getChunkOffset(hvqView, 10);
    let eleventhChunkHuffmanResult = HVQ._recursiveHuffmanBuild(hvqView, (8 * (eleventhChunkOffset + 4)));
    console.log("HVQ Huff 11: ", eleventhChunkHuffmanResult.node);

    return window.PP64.utils.img.HVQ._blackRGB16; // FIXME LOL
  }

  static _getChunkOffset(hvqView, chunkIndex) {
    // Chunk offsets start at 0x20
    return hvqView.getUint32(0x20 + (chunkIndex * 4));
  }

  static _recursiveHuffmanBuild(hvqView, bitOffset) {
    if (PP64.utils.arrays.readBitAtOffset(hvqView, bitOffset) === 1) {
      // Branch recursively.
      let leftResult = HVQ._recursiveHuffmanBuild(hvqView, bitOffset + 1);
      bitOffset = leftResult.nextOffset;
      let rightResult = HVQ._recursiveHuffmanBuild(hvqView, bitOffset);
      let node = Object.create(null); // Mainly to make browser debug cleaner without __proto__.
      node[1] = leftResult.node;
      node[0] = rightResult.node;
      return {
        nextOffset: rightResult.nextOffset,
        node: node
      };
    }
    else {
      // Read the next 8 bits as a leaf node value.
      let byte = PP64.utils.arrays.readByteAtBitOffset(hvqView, bitOffset + 1);
      return {
        nextOffset: bitOffset + 9,
        node: byte
      };
    }
  }

  static encode(buffer, width, height) {
    if (PP64.romhandler.getGameVersion() > 1) { // Hack for MP2
      let compressed = PP64.utils.compression.compress(3, new DataView(buffer));
      let result = new ArrayBuffer(compressed.byteLength + 8);
      let resultView = new DataView(result);
      resultView.setUint32(0, 3);
      resultView.setUint32(4, buffer.byteLength);
      PP64.utils.arrays.copyRange(resultView, compressed, 8, 0, compressed.byteLength);
      return result;
    }
    return buffer;

    // throw "HVQ encode not implemented";
  }
};
