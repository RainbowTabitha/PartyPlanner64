PP64.ns("adapters");

PP64.adapters.strings3 = (function() {
  let _stringOffsets = {};
  _stringOffsets[$gameType.MP3_USA] = {
    "jp": [
      { upper: 0x0000F142, lower: 0x0000F14A }, // 0x1209850, len 0x13250
      { upper: 0x0005B3CA, lower: 0x0005B3D2 },
    ],
    "en": [
      { upper: 0x0005B412, lower: 0x0005B41A }, // 0x121CAA0
    ],
    "de": [
      { upper: 0x0005B42A, lower: 0x0005B432 }, // 0x12355C0
    ],
    "es": [
      { upper: 0x0005B436, lower: 0x0005B43E }, // 0x12765F0
    ],
    "it": [
      { upper: 0x0005B442, lower: 0x0005B446 }, // 0x1261F90
    ],
    "fr": [
      { upper: 0x0005B41E, lower: 0x0005B426 }, // 0x124D440
    ],
  };

  function getROMOffset(locale = "en") {
    let romView = PP64.romhandler.getDataView();
    let romOffset = getPatchOffsets(locale)[0];
    if (!romOffset)
      return null;
    let upper = romView.getUint16(romOffset.upper) << 16;
    let lower = romView.getUint16(romOffset.lower);
    let offset = upper | lower;
    if (lower & 0x8000)
      offset = offset - 0x00010000; // Signed ASM addition workaround.
    $$log(`Strings3.getROMOffset[${locale}] -> ${$$hex(offset)}`);
    return offset;
  }

  function setROMOffset(newOffset, buffer) {
    let romView = new DataView(buffer);
    let curOffset = newOffset;
    let locales = getLocales(PP64.romhandler.getROMGame());
    for (let l = 0; l < locales.length; l++) {
      let locale = locales[l];
      let patchOffsets = getPatchOffsets(locale);
      let upper = (curOffset & 0xFFFF0000) >>> 16;
      let lower = curOffset & 0x0000FFFF;
      if (lower & 0x8000)
        upper += 1; // Adjust for signed addition in ASM.
      for (let i = 0; i < patchOffsets.length; i++) {
        romView.setUint16(patchOffsets[i].upper, upper);
        romView.setUint16(patchOffsets[i].lower, lower);
      }
      $$log(`Strings3.setROMOffset[${locale}] -> ${$$hex((upper << 16) | lower)}`);
      curOffset += $$number.makeDivisibleBy(_strFsInstances[locale].getByteLength(), 16);
    }
  }

  function getPatchOffsets(locale = "en") {
    return _stringOffsets[PP64.romhandler.getROMGame()][locale];
  }

  class StringTableSet {
    constructor(dataView) {
      this.dirs = this._extract(dataView)
    }

    _extract(view) {
      let dirCount = this._getDirectoryCountFromView(view);
      let dirs = new Array(dirCount);
      for (let d = 0; d < dirCount; d++) {
        dirs[d] = this._readDirFromView(view, d);
      }
      return dirs;
    }

    _getDirectoryCountFromView(view) {
      return view.getUint32(0);
    }

    _readDirFromView(view, dir) {
      let entryOffset = this._getDirOffsetFromView(view, dir);
      let entryView = new DataView(view.buffer, view.byteOffset + entryOffset);
      let decompressedDir = this._decompressDir(entryView);
      return new PP64.adapters.strings.StringTable(new DataView(decompressedDir));
    }

    _decompressDir(view) {
      let decompressedSize = view.getUint32(0);
      let compressionType = view.getUint32(4);
      let dirStartView = new DataView(view.buffer, view.byteOffset + 8);
      return PP64.utils.compression.decompress(compressionType, dirStartView, decompressedSize)
    }

    _getDirOffsetFromView(view, dir) {
      return view.getUint32(4 * (1 + dir));
    }

    read(dir, index, raw = false) {
      if (dir < 0 || dir >= this.getDirectoryCount())
        throw "Requesting non-existent string directory";
      return this.dirs[dir].read(index, raw);
    }

    write(dir, index, content) {
      this.dirs[dir].write(index, content);
    }

    getDirectoryCount() {
      return this.dirs.length;
    }

    getStringCount(dir) {
      return this.dirs[dir].getStringCount();
    }

    getByteLength() {
      let byteLen = 0;
      let dirCount = this.dirs.length;

      byteLen += 4; // Count of directories
      byteLen += 4 * dirCount; // Directory offsets

      for (let d = 0; d < dirCount; d++) {
        byteLen += 4; // Decompressed size
        byteLen += 4; // Compression type
        byteLen += this.dirs[d].getByteLength(true);
        byteLen = $$number.makeDivisibleBy(byteLen, 2);
      }

      return byteLen;
    }

    pack(buffer, offset = 0) {
      let view = new DataView(buffer, offset);

      let dirCount = this.getDirectoryCount();
      view.setUint32(0, dirCount);

      let curDirIndexOffset = 4;
      let curDirWriteOffset = 4 + (dirCount * 4);
      for (let d = 0; d < dirCount; d++) {
        view.setUint32(curDirIndexOffset, curDirWriteOffset);
        curDirIndexOffset += 4;
        view.setUint32(curDirWriteOffset, this.dirs[d].getByteLength()); // Decompressed size
        curDirWriteOffset += 4;
        view.setUint32(curDirWriteOffset, 1); // Compression type
        curDirWriteOffset += 4;
        curDirWriteOffset = this._packDir(d, view, curDirWriteOffset);
        curDirWriteOffset = $$number.makeDivisibleBy(curDirWriteOffset, 2);
      }

      return curDirWriteOffset;
    }

    _packDir(d, view, offset) {
      let decompressedBuffer = new ArrayBuffer(this.dirs[d].getByteLength());
      this.dirs[d].pack(decompressedBuffer, 0);
      let compressedBuffer = PP64.utils.compression.compress(1, new DataView(decompressedBuffer));
      PP64.utils.arrays.copyRange(view, compressedBuffer, offset, 0, compressedBuffer.byteLength);
      let compressedSize = this.dirs[d].getByteLength(true);
      if ($$debug) {
        if (compressedBuffer.byteLength > compressedSize)
          throw `Upper bound guess is wrong _packDir`;
      }
      return offset + compressedSize;
    }
  }

  var _strFsInstances;

  function clear() {
    _strFsInstances = null;
  }

  function extract() {
    _strFsInstances = {};
    let locales = getLocales(PP64.romhandler.getROMGame());
    for (let l = 0; l < locales.length; l++) {
      let locale = locales[l];
      let localeView = PP64.romhandler.getDataView(getROMOffset(locale));
      _strFsInstances[locale] = new StringTableSet(localeView);
    }
    return _strFsInstances;
  }

  function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  function pack(buffer, offset = 0) {
    let nextOffset = offset;
    let locales = getLocales(PP64.romhandler.getROMGame());
    for (let l = 0; l < locales.length; l++) {
      let locale = locales[l];
      let instance = _strFsInstances[locale];
      nextOffset = nextOffset + instance.pack(buffer, nextOffset);
      nextOffset = $$number.makeDivisibleBy(nextOffset, 16);
    }
    return nextOffset;
  }

  function read(locale, dir, index, raw = false) {
    return _strFsInstances[locale].read(dir, index, raw);
  }

  // Writes a pre-made buffer for now.
  function write(locale, dir, index, content) {
    _strFsInstances[locale].write(dir, index, content);
  }

  function getLocales(game) {
    return Object.keys(_stringOffsets[game]);
  }

  function getDirectoryCount(locale) {
    return _strFsInstances[locale].getDirectoryCount();
  }

  function getStringCount(locale, dir) {
    return _strFsInstances[locale].getStringCount(dir);
  }

  // Gets the required byte length of the string section of the ROM.
  function getByteLength() {
    let byteLen = 0;
    let locales = getLocales(PP64.romhandler.getROMGame());
    for (let l = 0; l < locales.length; l++) {
      let locale = locales[l];
      byteLen += $$number.makeDivisibleBy(_strFsInstances[locale].getByteLength(), 16);
    }
    return byteLen;
  }

  return {
    read,
    write,
    extract,
    extractAsync,
    pack,
    clear,
    getByteLength,
    getStringCount,
    getDirectoryCount,
    getROMOffset,
    setROMOffset,
    getPatchOffsets,
  };
})();
