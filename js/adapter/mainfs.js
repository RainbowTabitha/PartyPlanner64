PP64.ns("adapters");

PP64.adapters.mainfs = (function() {
  let _mainFSOffsets = {};
  _mainFSOffsets[$gameType.MP1_USA] = [
    { upper: 0x157A6, lower: 0x157AA },
    { upper: 0x3C016, lower: 0x3C01E }
  ];
  _mainFSOffsets[$gameType.MP1_JPN] = [
    { upper: 0x156D6, lower: 0x156DA },
    { upper: 0x3BF32, lower: 0x3BF3A }
  ];
  _mainFSOffsets[$gameType.MP2_USA] = [ // Default 0x0041DD30
    { upper: 0x416E6, lower: 0x416EE },
  ];
  _mainFSOffsets[$gameType.MP3_USA] = [
    { upper: 0x3619E, lower: 0x361A6 },
  ];

  function getROMOffset() {
    let romView = PP64.romhandler.getDataView();
    let patchOffsets = getPatchOffsets();
    if (!patchOffsets)
      return null;
    let romOffset = patchOffsets[0];
    let upper = romView.getUint16(romOffset.upper) << 16;
    let lower = romView.getUint16(romOffset.lower);
    let offset = upper | lower;
    if (lower & 0x8000)
      offset = offset - 0x00010000; // Account for signed addition workaround.
    $$log(`MainFS.getROMOffset -> ${$$hex(offset)}`);

    if ($$debug) { // Assert that the rest of the patch offsets are valid.
      for (let i = 1; i < patchOffsets.length; i++) {
        let anotherUpper = romView.getUint16(patchOffsets[i].upper) << 16;
        let anotherLower = romView.getUint16(patchOffsets[i].lower);
        if (anotherUpper !== upper || anotherLower !== lower)
          throw `MainFS.getROMOffset patch offset ${i} seems wrong`;
      }
    }

    return offset;
  }

  function setROMOffset(newOffset, buffer) {
    let romView = new DataView(buffer);
    let patchOffsets = getPatchOffsets();
    let upper = (newOffset & 0xFFFF0000) >>> 16;
    let lower = newOffset & 0x0000FFFF;
    if (lower & 0x8000)
      upper += 1; // ASM adjust for the signed addition.
    for (let i = 0; i < patchOffsets.length; i++) {
      romView.setUint16(patchOffsets[i].upper, upper);
      romView.setUint16(patchOffsets[i].lower, lower);
    }
    $$log(`MainFS.setROMOffset -> ${$$hex((upper << 16) | lower)}`);
  }

  function getPatchOffsets() {
    return _mainFSOffsets[PP64.romhandler.getROMGame()];
  }

  function get(dir, file) {
    return _mainfsCache[dir][file].decompressed;
  }

  function has(dir, file) {
    return !!_mainfsCache[dir][file];
  }

  function read(dir, file, all) {
    let buffer = PP64.romhandler.getROMBuffer();

    let fs_offset = getROMOffset();
    let fsView = new DataView(buffer, fs_offset);

    let dir_offset = fs_offset + fsView.getUint32(4 * (1 + dir));
    let dirView = new DataView(buffer, dir_offset);

    let fileEntryOffset = dir_offset + dirView.getUint32(4 * (1 + file));
    let fileView = new DataView(buffer, fileEntryOffset);
    let decompressed_size = fileView.getUint32(0);
    let compression_type = fileView.getUint32(4);
    let fileStartOffset = fileEntryOffset + _getFileHeaderSize(compression_type);
    let fileStartView = new DataView(buffer, fileStartOffset);

    let result = {
      compressionType: compression_type,
      decompressedSize: decompressed_size,
      decompressed: PP64.utils.compression.decompress(compression_type, fileStartView, decompressed_size)
    };
    if ($$debug) { // Assert decompressedSize matches
      if (decompressed_size !== result.decompressed.byteLength)
        throw `MainFS Dir: ${dir}, File: ${file} decompressed size mismatch`;
    }
    if (all) {
      //let compressedSize = PP64.utils.compression.getCompressedSize(compression_type, fileStartView, decompressed_size);
      let compressedSize = result.decompressed.compressedSize;
      result.compressed = buffer.slice(fileStartOffset, fileStartOffset + compressedSize);
    }
    return result;
  }

  function _getFileHeaderSize(compressionType) {
    switch (compressionType) {
      case 0:
      case 1:
      case 5:
        return 8; // Don't duplicate decompressed size.
      case 2:
      case 3: // Never occurs
      case 4:
        return 12;
    }
    throw `_getFileHeaderSize(${compressionType}) not handled`;
  }

  function write(dir, file, content) {
    let fileData = _mainfsCache[dir][file];
    if (!fileData) {
      $$log(`Adding new file to MainFS: ${dir}/${file}`);
      _mainfsCache[dir][file] = fileData = {
        compressionType: 0
      };
    }
    else if (content !== fileData.decompressed &&
      PP64.utils.arrays.arrayBuffersEqual(content, fileData.decompressed))
      return; // Don't bother, because we would just end up losing the compressed data.

    if (fileData.compressed) {
      delete fileData.decompressedSize;
      delete fileData.compressed;
      fileData.compressionType = 0;
    }

    fileData.decompressed = content.slice(0);
  }

  let _mainfsCache;

  function clearCache() {
    _mainfsCache = null;
  }

  function extract() {
    let t0, t1;
    if ($$debug && window.performance)
      t0 = performance.now();

    let dirCount = getDirectoryCount();
    _mainfsCache = new Array(dirCount);
    for (let d = 0; d < dirCount; d++) {
      let fileCount = getFileCount(d);
      _mainfsCache[d] = new Array(fileCount);
      for (let f = 0; f < fileCount; f++) {
        _mainfsCache[d][f] = read(d, f, true);
      }
    }

    if ($$debug && t0) {
      t1 = performance.now();
      $$log(`MainFS.extract() -> ${t1 - t0}ms`);
    }

    return _mainfsCache;
  }

  function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  function pack(buffer, offset = 0) {
    let view = new DataView(buffer, offset);

    let dirCount = getDirectoryCount();
    view.setUint32(0, dirCount);

    let curDirIndexOffset = 4;
    let curDirWriteOffset = 4 + (dirCount * 4);
    for (let d = 0; d < dirCount; d++) {
      view.setUint32(curDirIndexOffset, curDirWriteOffset);
      curDirIndexOffset += 4;
      curDirWriteOffset = _writeDir(d, view, curDirWriteOffset);
      curDirWriteOffset = $$number.makeDivisibleBy(curDirWriteOffset, 2);
    }

    return curDirWriteOffset;
  }

  function _writeDir(d, view, offset) {
    let fileCount = getFileCount(d);
    view.setUint32(offset, fileCount);

    let curFileIndexOffset = offset + 4;
    let curFileWriteOffset = offset + 4 + (fileCount * 4);
    for (let f = 0; f < fileCount; f++) {
      view.setUint32(curFileIndexOffset, curFileWriteOffset - offset);
      curFileIndexOffset += 4;
      curFileWriteOffset = _writeFile(d, f, view, curFileWriteOffset);
      curFileWriteOffset = $$number.makeDivisibleBy(curFileWriteOffset, 2);
    }

    return curFileWriteOffset;
  }

  function _writeFile(d, f, view, offset) {
    let fileData = _mainfsCache[d][f];

    view.setUint32(offset, fileData.decompressedSize || fileData.decompressed.byteLength);
    view.setUint32(offset + 4, fileData.compressionType);

    let fileStartOffset = offset + 8;
    if (_getFileHeaderSize(fileData.compressionType) === 12) { // Duplicate decompressed size
      view.setUint32(offset + 8, fileData.decompressedSize || fileData.decompressed.byteLength);
      fileStartOffset += 4;
    }

    let bytesToWrite;
    if (PP64.settings.get($setting.writeDecompressed))
      bytesToWrite = fileData.decompressed;
    else
      bytesToWrite = fileData.compressed || fileData.decompressed;
    PP64.utils.arrays.copyRange(view, bytesToWrite, fileStartOffset, 0, bytesToWrite.byteLength);

    return fileStartOffset + bytesToWrite.byteLength;
  }

  function getDirectoryCount() {
    if (_mainfsCache)
      return _mainfsCache.length;

    let buffer = PP64.romhandler.getROMBuffer();
    let fsView = new DataView(buffer, getROMOffset());
    return fsView.getUint32(0);
  }

  function getFileCount(dir) {
    if (_mainfsCache && _mainfsCache[dir])
      return _mainfsCache[dir].length;

    let buffer = PP64.romhandler.getROMBuffer();
    let fs_offset = getROMOffset();
    let fsView = new DataView(buffer, fs_offset);
    let dir_offset = fs_offset + fsView.getUint32(4 * (1 + dir));
    let dirView = new DataView(buffer, dir_offset);
    return dirView.getUint32(0);
  }

  function getByteLength() {
    let byteLen = 0;

    let dirCount = _mainfsCache.length;

    byteLen += 4; // Count of directories
    byteLen += 4 * dirCount; // Directory offsets

    for (let d = 0; d < dirCount; d++) {
      let fileCount = _mainfsCache[d].length;

      byteLen += 4; // Count of files
      byteLen += 4 * fileCount; // File offsets

      for (let f = 0; f < fileCount; f++) {
        // Decompressed size, compression type, and perhaps duplicated decompressed size.
        byteLen += _getFileHeaderSize(_mainfsCache[d][f].compressionType);

        if (_mainfsCache[d][f].compressed && !PP64.settings.get($setting.writeDecompressed)) // We never touched it.
          byteLen += _mainfsCache[d][f].compressed.byteLength;
        else
          byteLen += _mainfsCache[d][f].decompressed.byteLength;
        byteLen = $$number.makeDivisibleBy(byteLen, 2);
      }
    }

    return byteLen;
  }

  return {
    read,
    write,
    get,
    has,
    extract,
    extractAsync,
    pack,
    clearCache,
    getByteLength,
    getDirectoryCount,
    getFileCount,
    getROMOffset,
    setROMOffset,
    getPatchOffsets,
  };
})();
