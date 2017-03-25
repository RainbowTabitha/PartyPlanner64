PP64.ns("fs");

PP64.fs.hvqfs = (function() {
  let _HVQFSOffsets = {};
  _HVQFSOffsets[$gameType.MP1_USA] = [ // Default at 0x00FE2310
    { upper: 0x00057626, lower: 2 }, // Too lazy, lower is space inbetween.
    { upper: 0x0005D012, lower: 2 },
    { upper: 0x000D5416, lower: 6 },
    { upper: 0x00259D76, lower: 6 },
    { upper: 0x0025F8AE, lower: 6 },
    { upper: 0x00260392, lower: 6 },
    { upper: 0x0027C76A, lower: 6 },
    { upper: 0x00280992, lower: 6 },
    { upper: 0x00281A96, lower: 6 },
    { upper: 0x002825CA, lower: 6 },
    { upper: 0x002850B6, lower: 6 },
    { upper: 0x00285AE6, lower: 6 },
    { upper: 0x0028660A, lower: 6 },
    { upper: 0x002871AA, lower: 6 },
    { upper: 0x00288742, lower: 6 },
    { upper: 0x00289A2E, lower: 6 },
    { upper: 0x0028AA5E, lower: 6 },
    { upper: 0x0028BB92, lower: 6 },
    { upper: 0x0028CE76, lower: 6 },
    { upper: 0x0028DEDE, lower: 6 },
    { upper: 0x0028E526, lower: 6 },
    { upper: 0x0028EC02, lower: 6 },
    { upper: 0x002906E6, lower: 6 },
    { upper: 0x00291232, lower: 6 },
    { upper: 0x00291EC2, lower: 6 },
    { upper: 0x0029311E, lower: 6 },
    { upper: 0x002939EA, lower: 6 },
    { upper: 0x00295306, lower: 6 },
    { upper: 0x00295CFA, lower: 6 },
    { upper: 0x002969FE, lower: 6 },
    { upper: 0x00297AD2, lower: 6 },
    { upper: 0x00297F42, lower: 6 },
    { upper: 0x002989E2, lower: 6 },
    { upper: 0x0029A27A, lower: 6 },
    { upper: 0x0029AA22, lower: 6 },
    { upper: 0x0029B15E, lower: 6 },
    { upper: 0x002A090A, lower: 6 },
    { upper: 0x002A51A2, lower: 6 },
    { upper: 0x002B70D6, lower: 6 },
    { upper: 0x002BA16E, lower: 6 },
    { upper: 0x002FD79A, lower: 6 },
    { upper: 0x003002B6, lower: 6 },
    { upper: 0x003013AE, lower: 6 },
    { upper: 0x00306322, lower: 2 },
    { upper: 0x00309F8E, lower: 6 },
    { upper: 0x0030D82A, lower: 6 },
    { upper: 0x003146EA, lower: 6 },
    { upper: 0x00317762, lower: 6 }
  ];
  _HVQFSOffsets[$gameType.MP1_JPN] = [
    { upper: 0x00057496, lower: 2 }, // Too lazy, lower is space inbetween.
    { upper: 0x0005CBD2, lower: 2 },
    { upper: 0x000D48C6, lower: 6 },
    { upper: 0x002592A6, lower: 6 },
    { upper: 0x0025EDE6, lower: 6 },
    { upper: 0x0025F8D2, lower: 6 },
    { upper: 0x0027BCAA, lower: 6 },
    { upper: 0x0027FEC2, lower: 6 },
    { upper: 0x00280FC6, lower: 6 },
    { upper: 0x00281AFA, lower: 6 },
    { upper: 0x002845E6, lower: 6 },
    { upper: 0x00285016, lower: 6 },
    { upper: 0x00285B3A, lower: 6 },
    { upper: 0x002866DA, lower: 6 },
    { upper: 0x00287C72, lower: 6 },
    { upper: 0x00288F5E, lower: 6 },
    { upper: 0x00289F8E, lower: 6 },
    { upper: 0x0028B0C2, lower: 6 },
    { upper: 0x0028C3A6, lower: 6 },
    { upper: 0x0028D40E, lower: 6 },
    { upper: 0x0028DA56, lower: 6 },
    { upper: 0x0028E132, lower: 6 },
    { upper: 0x0028FC16, lower: 6 },
    { upper: 0x00290762, lower: 6 },
    { upper: 0x002913F2, lower: 6 },
    { upper: 0x0029264E, lower: 6 },
    { upper: 0x00292F1A, lower: 6 },
    { upper: 0x00294836, lower: 6 },
    { upper: 0x0029522A, lower: 6 },
    { upper: 0x00295F2A, lower: 6 },
    { upper: 0x00296FFE, lower: 6 },
    { upper: 0x00297462, lower: 6 },
    { upper: 0x00297F02, lower: 6 },
    { upper: 0x0029979E, lower: 6 },
    { upper: 0x00299F42, lower: 6 },
    { upper: 0x0029A67E, lower: 6 },
    { upper: 0x0029FE06, lower: 6 },
    { upper: 0x002A46D6, lower: 6 },
    { upper: 0x002B6656, lower: 6 },
    { upper: 0x002B96EE, lower: 6 },
    { upper: 0x002FCAD2, lower: 6 },
    { upper: 0x002FF5F6, lower: 6 },
    { upper: 0x003006EE, lower: 6 },
    { upper: 0x00305662, lower: 2 },
    { upper: 0x003092CE, lower: 6 },
    { upper: 0x0030CB6A, lower: 6 },
    { upper: 0x00313A1A, lower: 6 },
    { upper: 0x00316A02, lower: 6 },
  ];
  _HVQFSOffsets[$gameType.MP2_USA] = [ // Default at 0x01164160
    { upper: 0x00054BD2, lower: 6 }, // Too lazy, lower is space inbetween.
    { upper: 0x00063A36, lower: 6 },
    { upper: 0x00074D6A, lower: 2 },
    { upper: 0x002A8A3A, lower: 6 },
    { upper: 0x002AEE46, lower: 6 },
    { upper: 0x002C081A, lower: 6 },
    { upper: 0x002DA94A, lower: 6 },
    { upper: 0x002F17CE, lower: 6 },
    { upper: 0x00306C42, lower: 6 },
    { upper: 0x0031EEDA, lower: 6 },
    { upper: 0x00329842, lower: 6 },
    { upper: 0x0032A26E, lower: 6 },
    { upper: 0x003354E6, lower: 6 },
    { upper: 0x00343106, lower: 6 },
    { upper: 0x0035860A, lower: 6 },
    { upper: 0x0035C1EE, lower: 6 },
    { upper: 0x0035D1AA, lower: 6 },
    { upper: 0x003615DE, lower: 6 },
    { upper: 0x0036178E, lower: 6 },
    { upper: 0x003D4DEE, lower: 6 },
    { upper: 0x0040A022, lower: 6 },
    { upper: 0x0040B8E6, lower: 6 },
    { upper: 0x004107BA, lower: 6 },
    { upper: 0x004157AE, lower: 6 },
  ];
  _HVQFSOffsets[$gameType.MP3_USA] = [ // Default at 0x128CC60
    { upper: 0x000D07A6, lower: 6 },
    { upper: 0x000E4056, lower: 6 },
    { upper: 0x000FD7DA, lower: 6 },
    { upper: 0x0010C616, lower: 6 },
    { upper: 0x003BF99A, lower: 6 },
    { upper: 0x003C6106, lower: 6 },
    { upper: 0x003C7D72, lower: 6 },
    { upper: 0x003CDB72, lower: 6 },
    { upper: 0x003CFA96, lower: 6 },
    { upper: 0x0045A696, lower: 6 },
    { upper: 0x00463F9A, lower: 6 },
    { upper: 0x004672AA, lower: 6 },
    { upper: 0x004CCF8A, lower: 2 },
    { upper: 0x004E83F2, lower: 6 },
    { upper: 0x004F031A, lower: 6 },
    { upper: 0x004F3CDE, lower: 6 },
    { upper: 0x0052671A, lower: 6 },
    { upper: 0x00549A9A, lower: 2 },
    { upper: 0x0054F5FE, lower: 6 },
    { upper: 0x005505C6, lower: 6 },
  ];

  function getROMOffset() {
    let romView = PP64.romhandler.getDataView();
    let patchOffsets = getPatchOffsets();
    if (!patchOffsets)
      return null;
    let romOffset = patchOffsets[0];
    if (!romOffset)
      return null;
    let upper = romView.getUint16(romOffset.upper) << 16;
    let lower = romView.getUint16(romOffset.lower);
    let offset = upper | lower;
    if (lower & 0x8000)
      offset = offset - 0x00010000; // Account for signed addition workaround.
    // $$log(`HVQFS.getROMOffset -> ${$$hex(offset)}`);

    if ($$debug) { // Assert that the rest of the patch offsets are valid.
      for (let i = 1; i < patchOffsets.length; i++) {
        let anotherUpper = romView.getUint16(patchOffsets[i].upper) << 16;
        let anotherLower = romView.getUint16(patchOffsets[i].lower);
        if (anotherUpper !== upper || anotherLower !== lower)
          throw `HVQFS.getROMOffset patch offset ${i} seems wrong`;
      }
    }

    return offset;
  }

  function setROMOffset(newOffset, buffer) {
    $$log(`HVQFS.setROMOffset(0x${Number(newOffset).toString(16)})`);
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
    $$log(`HVQFS.setROMOffset -> ${$$hex((upper << 16) | lower)}`);
  }

  function getPatchOffsets() {
    return _HVQFSOffsets[PP64.romhandler.getROMGame()].map(offset => {
      return {
        upper: offset.upper,
        lower: offset.upper + 2 + offset.lower
      };
    });
  }

  function get(dir, file) {
    return _hvqCache[dir][file];
  }

  function read(dir, file) {
    let buffer = PP64.romhandler.getROMBuffer();

    let fsOffset = getROMOffset();
    let fsView = new DataView(buffer, fsOffset);

    let bgOffset = fsOffset + fsView.getUint32(4 * (1 + dir));
    let bgView = new DataView(buffer, bgOffset);

    let fileOffset = bgOffset + bgView.getUint32(4 * (1 + file));
    let nextFileOffset = bgOffset + bgView.getUint32(4 * (1 + file + 1));

    return buffer.slice(fileOffset, nextFileOffset);
  }

  function write(dir, file, content) {
    _hvqCache[dir][file] = content.slice(0);
  }

  let _hvqCache;

  function clearCache() {
    _hvqCache = null;
  }

  function extract() {
    let t0, t1;
    if ($$debug && window.performance)
      t0 = performance.now();

    let bgCount = getDirectoryCount();
    _hvqCache = new Array(bgCount);
    for (let b = 0; b < bgCount; b++) {
      let fileCount = getHVQFileCount(b);
      _hvqCache[b] = new Array(fileCount);
      for (let f = 0; f < fileCount; f++) {
        _hvqCache[b][f] = read(b, f);
      }
    }

    if ($$debug && t0) {
      t1 = performance.now();
      $$log(`HVQFS.extract() -> ${t1 - t0}ms`);
    }

    return _hvqCache;
  }

  function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  function pack(buffer, offset = 0) {
    let view = new DataView(buffer, offset);

    let bgCount = getDirectoryCount();
    view.setUint32(0, bgCount + 1);

    let curBgIndexOffset = 4;
    let curBgWriteOffset = 4 + ((bgCount + 1) * 4);
    for (let b = 0; b < bgCount; b++) {
      view.setUint32(curBgIndexOffset, curBgWriteOffset);
      curBgIndexOffset += 4;
      curBgWriteOffset = _writeBg(b, view, curBgWriteOffset);
      curBgWriteOffset = $$number.makeDivisibleBy(curBgWriteOffset, 4);
    }

    view.setUint32(curBgIndexOffset, curBgWriteOffset);

    return curBgWriteOffset;
  }

  function _writeBg(b, view, offset) {
    let fileCount = getHVQFileCount(b);
    view.setUint32(offset, fileCount + 1);

    let curFileIndexOffset = offset + 4;
    let curFileWriteOffset = offset + 4 + ((fileCount + 1) * 4);
    for (let f = 0; f < fileCount; f++) {
      view.setUint32(curFileIndexOffset, curFileWriteOffset - offset);
      curFileIndexOffset += 4;
      curFileWriteOffset = _writeFile(b, f, view, curFileWriteOffset);
      curFileWriteOffset = $$number.makeDivisibleBy(curFileWriteOffset, 4);
    }

    view.setUint32(curFileIndexOffset, curFileWriteOffset - offset);

    return curFileWriteOffset;
  }

  function _writeFile(b, f, view, offset) {
    let fileBytes = _hvqCache[b][f];
    PP64.utils.arrays.copyRange(view, fileBytes, offset, 0, fileBytes.byteLength);
    return offset + fileBytes.byteLength;
  }

  function _getBgDimensions(dir) {
    let infoView = new DataView(_hvqCache[dir][0], 0);
    let tile_width = infoView.getUint32(0);
    let tile_height = infoView.getUint32(4);
    let tile_x_count = infoView.getUint32(8);
    let tile_y_count = infoView.getUint32(12);

    let width = tile_width * tile_x_count;
    let height = tile_height * tile_y_count;
    return [width, height];
  }

  function readBackgroundImgData(dir) {
    let tileCount = _hvqCache[dir].length - 1;

    let infoView = new DataView(_hvqCache[dir][0], 0);
    let tile_width = infoView.getUint32(0);
    let tile_height = infoView.getUint32(4);
    let tile_x_count = infoView.getUint32(8);
    let tile_y_count = infoView.getUint32(12);

    let width = tile_width * tile_x_count;
    let height = tile_height * tile_y_count;

    $$log(`HVQFS.readBackground, dir: ${dir}, tiles: ${tileCount}, board is ${width}x${height}`);

    if (dir === 39) { // _boardLocData[4].bgNum) { // FIXME: Save away the black tile until HVQ is ready.
      //var black_tile_offset = dir_offset + dirView.getUint32(4 + (211 * 4));
      let blackTileView = new DataView(_hvqCache[39][211]);
      PP64.utils.img.HVQ._black = blackTileView;
    }

    // Grab DataViews of all of the tiles.
    let hvqTiles = [];
    let game = PP64.romhandler.getGameVersion();
    let adjust = game === 1 ? 1 : 2; // Skip HVQ-MPS in newer games
    for (let i = adjust; i < _hvqCache[dir].length; i++) {
      hvqTiles.push(new DataView(_hvqCache[dir][i]));
    }
    let rgba16Tiles = hvqTiles.map(PP64.utils.img.HVQ.decode);
    let rgba16Views = rgba16Tiles.map(tile => {
      return new DataView(tile);
    });
    let orderedRGB16Tiles = [];
    for (let y = tile_y_count - 1; y >= 0; y--) {
      for (let x = 0; x < tile_x_count; x++) {
        orderedRGB16Tiles.push(rgba16Views[(y * tile_x_count) + x]);
      }
    }
    let bgBufferRGBA16 = PP64.utils.img.tiler.fromTiles(orderedRGB16Tiles, tile_x_count, tile_y_count, tile_width * 2, tile_height);
    let bgBufferRGBA32 = PP64.utils.img.RGBA5551.toRGBA32(bgBufferRGBA16, width, height);
    let bgArr = new Uint8Array(bgBufferRGBA32);

    let canvasCtx = PP64.utils.canvas.createContext(width, height);
    let bgImageData = canvasCtx.createImageData(width, height);

    for (let i = 0; i < bgArr.byteLength; i++) {
      bgImageData.data[i] = bgArr[i];
    }

    return bgImageData;
  }

  function readBackground(dir) {
    let [width, height] = _getBgDimensions(dir);
    let canvasCtx = PP64.utils.canvas.createContext(width, height);
    let bgImageData = readBackgroundImgData(dir);
    canvasCtx.putImageData(bgImageData, 0, 0);
    return {
      width,
      height,
      src: canvasCtx.canvas.toDataURL()
    };
  }

  function writeBackground(dir, imgData, width, height) {
    let tileXCount = width / 64;
    let tileYCount = height / 48;
    let tileCount = tileXCount * tileYCount;

    $$log(`HVQFS.writeBackground, dir: ${dir}, img is ${width}x${height}`);

    let rgba32tiles = PP64.utils.img.tiler.toTiles(imgData.data, tileXCount, tileYCount, 64 * 4, 48);
    let rgba16tiles = rgba32tiles.map(tile32 => {
      return PP64.utils.img.RGBA5551.fromRGBA32(tile32, 64, 48);
    });
    let hvqTiles = rgba16tiles.map(tile16 => {
      return PP64.utils.img.HVQ.encode(tile16, 64, 48);
    });

    let orderedHVQTiles = [];
    for (let y = tileYCount - 1; y >= 0; y--) {
      for (let x = 0; x < tileXCount; x++) {
        orderedHVQTiles.push(hvqTiles[(y * tileXCount) + x]);
      }
    }

    let game = PP64.romhandler.getGameVersion();
    if (game === 1) {
      for (let i = 1; i <= tileCount; i++) {
        _hvqCache[dir][i] = orderedHVQTiles[i - 1];
      }
    }
    else { // MP2/3 also has the HVQ-MPS to skip
      for (let i = 2; i <= tileCount + 1; i++) {
        _hvqCache[dir][i] = orderedHVQTiles[i - 2];
      }
    }
  }

  function getDirectoryCount() {
    if (_hvqCache)
      return _hvqCache.length;

    let buffer = PP64.romhandler.getROMBuffer();
    let hvqFsOffset = getROMOffset();
    if (hvqFsOffset === null)
      return 0;
    let hvqFsView = new DataView(buffer, hvqFsOffset);
    return hvqFsView.getUint32(0) - 1; // The last dir is a fake.
  }

  function getHVQFileCount(dir) {
    if (_hvqCache && _hvqCache[dir])
      return _hvqCache[dir].length;

    let buffer = PP64.romhandler.getROMBuffer();
    let hvqFsOffset = getROMOffset();
    if (hvqFsOffset === null)
      return 0;
    let hvqFsView = new DataView(buffer, hvqFsOffset);

    let hvqFileOffset = hvqFsOffset + hvqFsView.getUint32(4 * (1 + dir));
    let hvqFileView = new DataView(buffer, hvqFileOffset);
    return hvqFileView.getUint32(0) - 1; // The last file is a lie.
  }

  function getByteLength() {
    let byteLen = 0;

    let bgCount = _hvqCache.length;

    byteLen += 4; // Count of backgrounds
    byteLen += 4 * (bgCount + 1); // Background offsets + the extra offset

    for (let b = 0; b < bgCount; b++) {
      let fileCount = _hvqCache[b].length;

      byteLen += 4; // Count of files
      byteLen += 4 * (fileCount + 1); // File offsets + the extra offset

      for (let f = 0; f < fileCount; f++) {
        byteLen += _hvqCache[b][f].byteLength;
        byteLen = $$number.makeDivisibleBy(byteLen, 4);
      }
    }

    return byteLen;
  }

  return {
    read,
    write,
    get,
    extract,
    extractAsync,
    pack,
    clearCache,
    readBackground,
    readBackgroundImgData,
    writeBackground,
    getByteLength,
    getDirectoryCount,
    getHVQFileCount,
    getROMOffset,
    setROMOffset,
    getPatchOffsets,
  };
})();
