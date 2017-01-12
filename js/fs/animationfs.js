PP64.ns("fs");

PP64.fs.animationfs = (function() {
  let _animFSOffsets = {};
  _animFSOffsets[$gameType.MP2_USA] = [
    // 0x16EC470
    { upper: 0x000546C6, lower: 0x000546CA },
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
    $$log(`AnimationFS.getROMOffset -> ${$$hex(offset)}`);
    return offset;
  }

  function setROMOffset(newOffset, buffer) {
    let romView = new DataView(buffer);
    let patchOffsets = getPatchOffsets();
    if (!patchOffsets)
      return;
    let upper = (newOffset & 0xFFFF0000) >>> 16;
    let lower = newOffset & 0x0000FFFF;
    if (lower & 0x8000)
      upper += 1; // ASM adjust for the signed addition.
    for (let i = 0; i < patchOffsets.length; i++) {
      romView.setUint16(patchOffsets[i].upper, upper);
      romView.setUint16(patchOffsets[i].lower, lower);
    }
    $$log(`AnimationFS.setROMOffset -> ${$$hex((upper << 16) | lower)}`);
  }

  function getPatchOffsets() {
    return _animFSOffsets[PP64.romhandler.getROMGame()];
  }

  function get(set, entry, index) {
    return _animfsCache[set][entry][index].decompressed;
  }

  function write(set, entry, tileBuffer, index) {
    let compressed = PP64.utils.compression.compress(3, new DataView(tileBuffer));

    if (!_animfsCache[set])
      _animfsCache[set] = [];
    if (!_animfsCache[set][entry])
      _animfsCache[set][entry] = {};
    _animfsCache[set][entry][index] = {
      compressionType: 3,
      decompressed: tileBuffer,
      compressed,
    };
  }

  function _createOrderedTiles(imgData, width, height) {
    let tileXCount = width / 64;
    let tileYCount = height / 48;

    let tiles32 = PP64.utils.img.tiler.toTiles(imgData.data, tileXCount, tileYCount, 64 * 4, 48);
    let tiles16 = tiles32.map(tile32 => {
      return PP64.utils.img.RGBA5551.fromRGBA32(tile32, 64, 48);
    });
    let orderedTiles = [];
    for (let y = tileYCount - 1; y >= 0; y--) {
      for (let x = 0; x < tileXCount; x++) {
        orderedTiles.push(tiles16[(y * tileXCount) + x]);
      }
    }
    return orderedTiles;
  }

  function writeAnimationBackground(set, entry, mainImgData, animImgData, width, height) {
    $$log(`AnimationFS.writeAnimationBackground, set: ${set}, entry: ${entry}, img is ${width}x${height}`);

    let orderedMainTiles = _createOrderedTiles(mainImgData, width, height);
    let orderedAnimTiles = _createOrderedTiles(animImgData, width, height);

    clearSetEntry(set, entry);

    // Write the tiles that are different to the sparse tree.
    for (let i = 0; i < orderedAnimTiles.length; i++) {
      if (!PP64.utils.arrays.arrayBuffersEqual(orderedMainTiles[i], orderedAnimTiles[i]))
        write(set, entry, orderedAnimTiles[i], i + 1);
    }
  }

  function _unorderTiles(tiles, tileXCount, tileYCount) {
    let unordered = [];
    for (let y = tileYCount - 1; y >= 0; y--) {
      for (let x = 0; x < tileXCount; x++) {
        unordered.push(tiles[(y * tileXCount) + x]);
      }
    }
    return unordered;
  }

  function _readAnimationBackground(set, entry, orderedMainTiles, width, height) {
    let orderedAnimBgTiles = [];
    for (let i = 0; i < orderedMainTiles.length; i++) {
      if (_animfsCache[set][entry].hasOwnProperty(i + 1))
        orderedAnimBgTiles.push(new DataView(_animfsCache[set][entry][i + 1].decompressed));
      else
        orderedAnimBgTiles.push(new DataView(orderedMainTiles[i]));
    }

    let tileWidth = 64;
    let tileHeight = 48;
    let tileXCount = width / 64;
    let tileYCount = height / 48;

    orderedAnimBgTiles = _unorderTiles(orderedAnimBgTiles, tileXCount, tileYCount);

    let bgBufferRGBA16 = PP64.utils.img.tiler.fromTiles(orderedAnimBgTiles, tileXCount, tileYCount, tileWidth * 2, tileHeight);
    let bgBufferRGBA32 = PP64.utils.img.RGBA5551.toRGBA32(bgBufferRGBA16, width, height);
    let bgArr = new Uint8Array(bgBufferRGBA32);

    let canvasCtx = PP64.utils.canvas.createContext(width, height);
    let bgImageData = canvasCtx.createImageData(width, height);

    for (let i = 0; i < bgArr.byteLength; i++) {
      bgImageData.data[i] = bgArr[i];
    }

    canvasCtx.putImageData(bgImageData, 0, 0);
    return canvasCtx.canvas.toDataURL();
  }

  function readAnimationBackgrounds(set, mainImgData, width, height) {
    let entries = getSetEntryCount(set);

    let orderedMainTiles = _createOrderedTiles(mainImgData, width, height);

    let bgs = [];
    for (let entry = 0; entry < entries; entry++) {
      bgs.push(_readAnimationBackground(set, entry, orderedMainTiles, width, height));
    }

    return bgs;
  }

  let _animfsCache;

  function clearCache() {
    _animfsCache = null;
  }

  function extract() {
    let startingOffset = getROMOffset();
    let view = PP64.romhandler.getDataView();
    _animfsCache = _extractSets(view, startingOffset, 1);
    return _animfsCache;
  }

  function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  function _extractSets(view, offset) {
    let sets = [];
    let count = view.getUint32(offset) - 1; // Extra offset
    for (let i = 0; i < count; i++) {
      let setOffset = view.getUint32(offset + 4 + (i * 4));
      sets.push(_extractSetEntries(view, offset + setOffset));
    }
    return sets;
  }

  function _extractSetEntries(view, offset) {
    let setEntries = [];
    let count = view.getUint32(offset);
    for (let i = 0; i < count; i++) {
      let setEntryOffset = view.getUint32(offset + 4 + (i * 4));
      setEntries.push(_extractTiles(view, offset + setEntryOffset));
    }
    return setEntries;
  }

  function _extractTiles(view, offset) {
    let tiles = {};
    let count = view.getUint32(offset) - 1; // Extra offset
    for (let i = 0; i < count; i++) {
      let tileOffset = view.getUint32(offset + 4 + (i * 4));
      let tile = _readTile(view, offset + tileOffset);
      tiles[tile.index] = {
        compressionType: tile.compressionType,
        compressed: tile.compressed,
        decompressed: tile.decompressed,
      };
    }
    return tiles;
  }

  function _readTile(view, offset) {
    let index = view.getUint32(offset);
    let compressionType = view.getUint32(offset + 4); // 3
    let decompressedSize = view.getUint32(offset + 8); // 0x1800
    let buffer = view.buffer;
    let fileStartOffset = offset + 12;
    let fileStartView = new DataView(buffer, fileStartOffset);
    let compressedSize = PP64.utils.compression.getCompressedSize(compressionType, fileStartView, decompressedSize); // TODO perf
    return {
      index,
      compressionType,
      compressed: buffer.slice(fileStartOffset, fileStartOffset + compressedSize),
      decompressed: PP64.utils.compression.decompress(compressionType, fileStartView, decompressedSize)
    };
  }

  function pack(buffer, offset = 0) {
    let view = new DataView(buffer, offset);

    let setCount = getSetCount();
    view.setUint32(0, setCount + 1); // Extra offset

    let curSetIndexOffset = 4;
    let curSetWriteOffset = 4 + ((setCount + 1) * 4);
    for (let s = 0; s < setCount; s++) {
      view.setUint32(curSetIndexOffset, curSetWriteOffset);
      curSetIndexOffset += 4;
      curSetWriteOffset = _writeSet(s, view, curSetWriteOffset);
      curSetWriteOffset = $$number.makeDivisibleBy(curSetWriteOffset, 4);
    }

    view.setUint32(curSetIndexOffset, curSetWriteOffset); // Extra offset

    return curSetWriteOffset;
  }

  function _writeSet(s, view, offset) {
    let setEntryCount = getSetEntryCount(s);
    view.setUint32(offset, setEntryCount); // No extra offsets at middle layer

    let curSetEntryIndexOffset = offset + 4;
    let curSetEntryWriteOffset = offset + 4 + (setEntryCount * 4);
    for (let e = 0; e < setEntryCount; e++) {
      view.setUint32(curSetEntryIndexOffset, curSetEntryWriteOffset - offset);
      curSetEntryIndexOffset += 4;
      curSetEntryWriteOffset = _writeTiles(s, e, view, curSetEntryWriteOffset);
      curSetEntryWriteOffset = $$number.makeDivisibleBy(curSetEntryWriteOffset, 4);
    }

    return curSetEntryWriteOffset;
  }

  function _writeTiles(s, e, view, offset) {
    let tileCount = getSetEntryTileCount(s, e);
    view.setUint32(offset, tileCount + 1); // Extra offset

    let curTileIndexOffset = offset + 4;
    let curTileWriteOffset = offset + 4 + ((tileCount + 1) * 4);
    for (let t in _animfsCache[s][e]) {
      if (!_animfsCache[s][e].hasOwnProperty(t))
        continue;

      view.setUint32(curTileIndexOffset, curTileWriteOffset - offset);
      curTileIndexOffset += 4;
      curTileWriteOffset = _writeTile(s, e, t, view, curTileWriteOffset);
      curTileWriteOffset = $$number.makeDivisibleBy(curTileWriteOffset, 4);
    }

    view.setUint32(curTileIndexOffset, curTileWriteOffset - offset);

    return curTileWriteOffset;
  }

  function _writeTile(s, e, t, view, offset) {
    let tile = _animfsCache[s][e][t];
    view.setUint32(offset, parseInt(t));
    view.setUint32(offset + 4, 3); // Compression type
    view.setUint32(offset + 8, tile.decompressed.byteLength); // Decompressed size
    PP64.utils.arrays.copyRange(view, tile.compressed, offset + 12, 0, tile.compressed.byteLength);
    return offset + 12 + tile.compressed.byteLength;
  }

  function getSetCount() {
    return _animfsCache.length;
  }

  function getSetEntryCount(set) {
    return _animfsCache[set].length;
  }

  // This is exposed so that we can blow away animations for a stock board (count = 0)
  function setSetEntryCount(set, count) {
    return _animfsCache[set].length = count;
  }

  function clearSetEntry(set, entry) {
    return _animfsCache[set][entry] = {};
  }

  function getSetEntryTileCount(set, entry) {
    return Object.keys(_animfsCache[set][entry]).length;
  }

  function getByteLength() {
    let byteLen = 0;

    let setCount = getSetCount();
    byteLen += 4; // Count of sets
    byteLen += 4 * (setCount + 1); // Set offsets + the extra offset

    for (let s = 0; s < setCount; s++) {
      let setEntryCount = getSetEntryCount(s);

      byteLen += 4; // Count of set entries
      byteLen += 4 * setEntryCount; // Set entry offsets (no extra offset)

      for (let e = 0; e < setEntryCount; e++) {
        let tileCount = getSetEntryTileCount(s, e);
        byteLen += 4; // Count of tiles
        byteLen += 4 * (tileCount + 1); // Tile offsets + the extra offset

        for (let t in _animfsCache[s][e]) {
          if (!_animfsCache[s][e].hasOwnProperty(t))
            continue;
          let tile = _animfsCache[s][e][t];
          byteLen += 4; // Index
          byteLen += 4; // Compression type
          byteLen += 4; // Decompressed size
          byteLen += tile.compressed.byteLength;
          byteLen = $$number.makeDivisibleBy(byteLen, 4);
        }
      }
    }

    return byteLen;
  }

  return {
    write,
    writeAnimationBackground,
    readAnimationBackgrounds,
    get,
    extract,
    extractAsync,
    pack,
    clearCache,
    getByteLength,
    getROMOffset,
    setROMOffset,
    getPatchOffsets,
    getSetCount,
    setSetEntryCount,
  };
})();
