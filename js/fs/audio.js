PP64.ns("fs");

PP64.fs.audio = (function() {
  const _audioOffsets = {};
  _audioOffsets[$gameType.MP1_USA] = [ // Length 0x7B3DF0
    // 15396A0
    {
      relative: 0,
      offsets: [
        { upper: 0x00061746, lower: 0x0006174A },
        { upper: 0x002DA3D2, lower: 0x002DA3D6 },
      ]
    },

    // 1778BC0
    {
      relative: 0x23F520,
      offsets: [
        { upper: 0x0001AF2A, lower: 0x0001AF2E },
        { upper: 0x0006174E, lower: 0x00061752 },
        { upper: 0x0006177E, lower: 0x00061782 },
        { upper: 0x002DA3DA, lower: 0x002DA3DE },
        { upper: 0x002DA402, lower: 0x002DA406 },
      ]
    },

    // 1832AE0
    {
      relative: 0x2F9440,
      offsets: [
        { upper: 0x0001AF32, lower: 0x0001AF36 },
        { upper: 0x0006172E, lower: 0x00061732 },
        { upper: 0x00061786, lower: 0x0006178A },
        { upper: 0x002DA3BE, lower: 0x002DA3C2 },
        { upper: 0x002DA40A, lower: 0x002DA40E },
      ]
    },

    // 1BB8460
    {
      relative: 0x67EDC0,
      offsets: [
        { upper: 0x0001AF0E, lower: 0x0001AF12 },
        { upper: 0x00061762, lower: 0x00061766 },
        { upper: 0x002DA3EA, lower: 0x002DA3EE },
      ]
    },

    // 1CECC60, FXD0
    {
      relative: 0x7B35C0,
      offsets: [
        { upper: 0x0001AF5A, lower: 0x0001AF5E },
      ]
    },

    // 1CED490, 0xffffffffs EOF
    {
      relative: 0x7B3DF0,
      offsets: [
        { upper: 0x0001AF66, lower: 0x0001AF6A },
      ]
    },
  ];

  _audioOffsets[$gameType.MP1_JPN] = [ // Length ?
  ];

  _audioOffsets[$gameType.MP2_USA] = [ // Length 0x6DAB50
    // 0x1750450
    {
      relative: 0, // MBF0
      offsets: [
        { upper: 0x0001D342, lower: 0x0001D346 },
        { upper: 0x0007A9EE, lower: 0x0007A9F2 },
        { upper: 0x0007AA12, lower: 0x0007AA16 },
      ]
    },
    // 0x190A090
    {
      relative: 0x1B9C40, // SBF0
      offsets: [
        { upper: 0x0007A9FA, lower: 0x0007A9FE },
      ]
    },
    // 0x1CBF410
    {
      relative: 0x56EFC0, // SBF0
      offsets: [
        { upper: 0x0001D34E, lower: 0x0001D352 },
        { upper: 0x0007AA1E, lower: 0x0007AA22 },
      ]
    },
    // 0x1E2A560
    {
      relative: 0x6DA110, // FXD0
      offsets: [
        { upper: 0x0001D382, lower: 0x0001D386 },
      ]
    },
  ];
  _audioOffsets[$gameType.MP3_USA] = [ // Length 0x67be40
    // 0x1881C40
    {
      relative: 0, // MBF0
      offsets: [
        { upper: 0x0000F26A, lower: 0x0000F26E },
        { upper: 0x0004BEF2, lower: 0x0004BEF6 },
      ]
    },
    // 0x1A56870
    {
      relative: 0x1D4C30, // SBF0
      offsets: [
        { upper: 0x0000F276, lower: 0x0000F27A },
        { upper: 0x0004BEFE, lower: 0x0004BF02 },
      ]
    },
    // 0x1EFD040
    {
      relative: 0x67B400, // FXD0
      offsets: [
        { upper: 0x0000F29E, lower: 0x0000F2A2 },
      ]
    },
    // E0F 0x1EFDA80
  ];

  function getROMOffset(subsection = 0) {
    let romView = PP64.romhandler.getDataView();
    let patchInfo = getPatchInfo()[subsection];
    if (!patchInfo)
      return null;
    let romOffset = patchInfo.offsets[0];
    let upper = romView.getUint16(romOffset.upper) << 16;
    let lower = romView.getUint16(romOffset.lower);
    let offset = upper | lower;
    if (offset & 0x00008000)
      offset = offset - 0x00010000; // Need adjustment because of the signed addition workaround.
    $$log(`Audio.getROMOffset -> ${$$hex(offset)}`);
    return offset;
  }

  function setROMOffset(newOffset, buffer) {
    $$log(`Audio.setROMOffset(${$$hex(newOffset)})`);
    let romView = new DataView(buffer);
    let patchSubsections = getPatchInfo();
    for (let i = 0; i < patchSubsections.length; i++) {
      let subsection = patchSubsections[i];
      let subsectionaddr = newOffset + subsection.relative;
      let upper = (subsectionaddr & 0xFFFF0000) >>> 16;
      let lower = subsectionaddr & 0x0000FFFF;
      if (lower & 0x8000)
        upper += 1; // Need adjustment because of the signed addition workaround.
      for (let j = 0; j < subsection.offsets.length; j++) {
        romView.setUint16(subsection.offsets[j].upper, upper);
        romView.setUint16(subsection.offsets[j].lower, lower);
      }
    }
  }

  function getPatchInfo() {
    return _audioOffsets[PP64.romhandler.getROMGame()];
  }

  function read(index) {
    throw "audio.read not implemented";
  }

  function write(index, value) {
    throw "audio.write not implemented";
  }

  let _audioCache;

  function clearCache() {
    _audioCache = null;
  }

  function extract() {
    let buffer = PP64.romhandler.getROMBuffer();
    let offset = getROMOffset();
    if (offset === null)
      return;
    let len = getByteLength();
    _audioCache = buffer.slice(offset, offset + len);
  }

  function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  function pack(buffer, offset = 0) {
    PP64.utils.arrays.copyRange(buffer, _audioCache, offset, 0, _audioCache.byteLength);
    return _audioCache.byteLength;
  }

  // Gets the full byte length of the audio section of the ROM.
  function getByteLength() {
    // Who knows how to interpret the audio section? Hard code for now.
    let gameID = PP64.romhandler.getROMGame();
    switch(gameID) {
      case $gameType.MP1_USA:
        return 0x7B3DF0; // 0x1CED490 - 0x15396A0
      case $gameType.MP1_JPN:
        return 0x10; // FIXME
      case $gameType.MP2_USA:
        return 0x6DAB50; // 0x1E2AFA0 - 0x1750450
      case $gameType.MP3_USA:
        return 0x67BE40; // 0x1EFDA80 - 0x1881C40
    }

    throw "Figure out the audio section length for " + gameID;
  }

  return {
    read,
    write,
    extract,
    extractAsync,
    pack,
    clearCache,
    getByteLength,
    getROMOffset,
    setROMOffset,
    getPatchInfo,
  };
})();
