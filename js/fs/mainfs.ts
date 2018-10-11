namespace PP64.fs.mainfs {
  interface IOffsetInfo {
    upper: number;
    lower: number;
  }

  let _mainFSOffsets: { [game: string]: IOffsetInfo[] } = {};

  _mainFSOffsets[$gameType.MP1_USA] = [ // Default 0x0031C7E0
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

  export function getROMOffset(): number | null {
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

  export function setROMOffset(newOffset: number, buffer: ArrayBuffer) {
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

  export function getPatchOffsets() {
    return _mainFSOffsets[PP64.romhandler.getROMGame()!];
  }

  export function get(dir: number, file: number) {
    return _mainfsCache![dir][file].decompressed;
  }

  export function has(dir: number, file: number) {
    return !!_mainfsCache![dir][file];
  }

  export interface IMainFsReadInfo {
    compressionType: number;
    decompressedSize: number;
    decompressed: ArrayBuffer;
    compressed?: ArrayBuffer;
  }

  export function read(dir: number, file: number, all: boolean): IMainFsReadInfo {
    let buffer = PP64.romhandler.getROMBuffer()!;

    let fs_offset = getROMOffset()!;
    let fsView = new DataView(buffer, fs_offset);

    let dir_offset = fs_offset + fsView.getUint32(4 * (1 + dir));
    let dirView = new DataView(buffer, dir_offset);

    let fileEntryOffset = dir_offset + dirView.getUint32(4 * (1 + file));
    let fileView = new DataView(buffer, fileEntryOffset);
    let decompressed_size = fileView.getUint32(0);
    let compression_type = fileView.getUint32(4);
    let fileStartOffset = fileEntryOffset + _getFileHeaderSize(compression_type);
    let fileStartView = new DataView(buffer, fileStartOffset);

    let result: IMainFsReadInfo = {
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
      let compressedSize = (result.decompressed as any).compressedSize;
      result.compressed = buffer.slice(fileStartOffset, fileStartOffset + compressedSize);
    }
    return result;
  }

  function _getFileHeaderSize(compressionType: number) {
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

  export function write(dir: number, file: number, content: ArrayBuffer) {
    let fileData = _mainfsCache![dir][file];
    if (!fileData) {
      $$log(`Adding new file to MainFS: ${dir}/${file}`);
      _mainfsCache![dir][file] = fileData = {
        compressionType: 0
      } as any;
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

  let _mainfsCache: IMainFsReadInfo[][] | null;

  export function clearCache() {
    _mainfsCache = null;
  }

  export function extract() {
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

  export function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  export function pack(buffer: ArrayBuffer, offset: number = 0) {
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

  function _writeDir(d: number, view: DataView, offset: number) {
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

  function _writeFile(d: number, f: number, view: DataView, offset: number) {
    let fileData = _mainfsCache![d][f];
    let writeDecompressed = PP64.settings.get($setting.writeDecompressed);

    view.setUint32(offset, fileData.decompressedSize || fileData.decompressed.byteLength);

    let compressionType = writeDecompressed ? 0 : fileData.compressionType;
    view.setUint32(offset + 4, compressionType);

    let fileStartOffset = offset + 8;
    if (_getFileHeaderSize(compressionType) === 12) { // Duplicate decompressed size
      view.setUint32(offset + 8, fileData.decompressedSize || fileData.decompressed.byteLength);
      fileStartOffset += 4;
    }

    let bytesToWrite;
    if (writeDecompressed)
      bytesToWrite = fileData.decompressed;
    else
      bytesToWrite = fileData.compressed || fileData.decompressed;
    PP64.utils.arrays.copyRange(view, bytesToWrite, fileStartOffset, 0, bytesToWrite.byteLength);

    return fileStartOffset + bytesToWrite.byteLength;
  }

  export function getDirectoryCount() {
    if (_mainfsCache)
      return _mainfsCache.length;

    const buffer = PP64.romhandler.getROMBuffer()!;
    const fsView = new DataView(buffer, getROMOffset()!);
    return fsView.getUint32(0);
  }

  export function getFileCount(dir: number) {
    if (_mainfsCache && _mainfsCache[dir])
      return _mainfsCache[dir].length;

    const buffer = PP64.romhandler.getROMBuffer()!;
    const fs_offset = getROMOffset()!;
    const fsView = new DataView(buffer, fs_offset);
    const dir_offset = fs_offset + fsView.getUint32(4 * (1 + dir));
    const dirView = new DataView(buffer, dir_offset);
    return dirView.getUint32(0);
  }

  export function getByteLength() {
    const dirCount = _mainfsCache!.length;
    const writeDecompressed = PP64.settings.get($setting.writeDecompressed);

    let byteLen = 0;
    byteLen += 4; // Count of directories
    byteLen += 4 * dirCount; // Directory offsets

    for (let d = 0; d < dirCount; d++) {
      const fileCount = _mainfsCache![d].length;

      byteLen += 4; // Count of files
      byteLen += 4 * fileCount; // File offsets

      for (let f = 0; f < fileCount; f++) {
        // Decompressed size, compression type, and perhaps duplicated decompressed size.
        byteLen += _getFileHeaderSize(writeDecompressed ? 0 : _mainfsCache![d][f].compressionType);

        if (_mainfsCache![d][f].compressed && !writeDecompressed) // We never touched it.
          byteLen += _mainfsCache![d][f].compressed!.byteLength;
        else
          byteLen += _mainfsCache![d][f].decompressed.byteLength;
        byteLen = $$number.makeDivisibleBy(byteLen, 2);
      }
    }

    return byteLen;
  }
}
