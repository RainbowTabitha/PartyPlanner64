// The ROM Handler handles the ROM... it holds the ROM buffer reference and
// orchestrates ROM loading and saving via adapter code.
PP64.romhandler = new class RomHandler {
  _rom = null
  _u8array = null
  _gameId = null
  _gameVersion = null

  getROMGame() {
    if (!this._rom)
      return null;

    if (this._gameId)
      return this._gameId;

    if (this._rom.byteLength < 0x40)
      return null;

    this._gameId = String.fromCharCode(this._u8array[0x3B], this._u8array[0x3C], this._u8array[0x3D], this._u8array[0x3E]);
    return this._gameId;
  }

  getROMBuffer() {
    return this._rom;
  }

  clear() {
    this._rom = null;
    this._u8array = null;
    this._gameId = null;
    this._gameVersion = null;

    PP64.fs.scenes.clearCache();
    PP64.fs.mainfs.clearCache();
    PP64.fs.strings.clear();
    PP64.fs.strings3.clear();
    PP64.fs.hvqfs.clearCache();
    PP64.fs.audio.clearCache();
    PP64.fs.animationfs.clearCache();
  }

  setROMBuffer(buffer) {
    if (!buffer) {
      this.clear();
      return false;
    }

    this._rom = buffer;
    this._u8array = new Uint8Array(this._rom);

    this.byteSwapIfNeeded();

    if (!this.romRecognized()) {
      PP64.app.showMessage("File is not recognized as any valid ROM.");
      this.clear();
      return false;
    }

    if (!this.romSupported()) {
      PP64.app.showMessage("This ROM is not supported right now.");
      this.clear();
      return false;
    }

    PP64.patches.gameshark.reset();

    let gameVersion = this.getGameVersion();

    // A crude async attempt to hopefully free the UI thread a bit.
    let promises = [];
    promises.push(PP64.fs.scenes.extractAsync());
    promises.push(PP64.fs.mainfs.extractAsync());
    if (gameVersion === 3)
      promises.push(PP64.fs.strings3.extractAsync());
    else
      promises.push(PP64.fs.strings.extractAsync());
    promises.push(PP64.fs.hvqfs.extractAsync());
    promises.push(PP64.fs.audio.extractAsync());
    if (gameVersion === 2)
      promises.push(PP64.fs.animationfs.extractAsync());

    return Promise.all(promises);
  }

  saveROM() {
    let gameVersion = this.getGameVersion();

    // We never move main FS, so this represents the first part of the ROM.
    let initialLen = PP64.fs.mainfs.getROMOffset();

    // Grab all the sizes of the different sections.
    let mainLen = $$number.makeDivisibleBy(PP64.fs.mainfs.getByteLength(), 16);
    let strsLen;
    if (gameVersion === 3)
      strsLen = $$number.makeDivisibleBy(PP64.fs.strings3.getByteLength(), 16);
    else
      strsLen = $$number.makeDivisibleBy(PP64.fs.strings.getByteLength(), 16);
    let hvqLen = $$number.makeDivisibleBy(PP64.fs.hvqfs.getByteLength(), 16);
    let audioLen = $$number.makeDivisibleBy(PP64.fs.audio.getByteLength(), 16);
    let animationLen = 0;
    if (gameVersion === 2)
      animationLen = $$number.makeDivisibleBy(PP64.fs.animationfs.getByteLength(), 16);

    // Seems to crash unless HVQ is aligned so that the +1 ADDIU trick is not needed. Just fudge strsLen to push it up.
    while ((initialLen + mainLen + strsLen) & 0x8000) {
      strsLen += 0x1000;
    }

    let newROMBuffer = new ArrayBuffer(initialLen + mainLen + strsLen + hvqLen + animationLen + audioLen);

    PP64.utils.arrays.copyRange(newROMBuffer, this._rom, 0, 0, initialLen);

    PP64.patches.gameshark.hook.apply(newROMBuffer); // Before main fs is packed

    PP64.fs.mainfs.pack(newROMBuffer, initialLen);
    PP64.fs.mainfs.setROMOffset(initialLen, newROMBuffer);

    if (gameVersion === 3) {
      PP64.fs.strings3.pack(newROMBuffer, initialLen + mainLen);
      PP64.fs.strings3.setROMOffset(initialLen + mainLen, newROMBuffer);
    }
    else {
      PP64.fs.strings.pack(newROMBuffer, initialLen + mainLen);
      PP64.fs.strings.setROMOffset(initialLen + mainLen, newROMBuffer);
    }

    PP64.fs.hvqfs.pack(newROMBuffer, initialLen + mainLen + strsLen);
    PP64.fs.hvqfs.setROMOffset(initialLen + mainLen + strsLen, newROMBuffer);

    if (gameVersion === 2) {
      PP64.fs.animationfs.pack(newROMBuffer, initialLen + mainLen + strsLen + hvqLen);
      PP64.fs.animationfs.setROMOffset(initialLen + mainLen + strsLen + hvqLen, newROMBuffer);
    }

    PP64.fs.audio.pack(newROMBuffer, initialLen + mainLen + strsLen + hvqLen + animationLen);
    PP64.fs.audio.setROMOffset(initialLen + mainLen + strsLen + hvqLen + animationLen, newROMBuffer);

    let adapter = PP64.adapters.getROMAdapter();
    if (adapter.onAfterSave)
      adapter.onAfterSave(new DataView(newROMBuffer));

    PP64.utils.CIC.fixChecksum(newROMBuffer);

    this._rom = newROMBuffer;
    this._u8array = new Uint8Array(this._rom);

    let romBlob = new Blob([newROMBuffer]);
    saveAs(romBlob, `MyMarioParty${gameVersion}.z64`);
  }

  romIsLoaded() {
    return !!this._rom;
  }

  getByteArray() {
    return this._u8array;
  }

  getDataView(startingOffset = 0, endOffset = 0) {
    if (!this._rom)
      throw "ROM not loaded, cannot get DataView.";
    if (endOffset) {
      return new DataView(this._rom, startingOffset, endOffset - startingOffset);
    }
    return new DataView(this._rom, startingOffset);
  }

  getGameVersion() {
    if (this._gameVersion !== null)
      return this._gameVersion;

    let gameID = this.getROMGame();
    if (!gameID)
      return null;

    switch(gameID) {
      case $gameType.MP1_USA:
      case $gameType.MP1_JPN:
        this._gameVersion = 1;
        return 1;
      case $gameType.MP2_USA:
        this._gameVersion = 2;
        return 2;
      case $gameType.MP3_USA:
        this._gameVersion = 3;
        return 3;
    }

    return null;
  }

  romRecognized() {
    return this.getGameVersion() !== null;
  }

  romSupported() {
    let supported = false;
    switch (this.getROMGame()) {
      case $gameType.MP1_USA:
      case $gameType.MP2_USA:
      case $gameType.MP3_USA:
        supported = true;
    };
    return supported || PP64.settings.get($setting.uiAllowAllRoms);
  }

  byteSwapIfNeeded() {
    if (!this._rom || this._rom.byteLength < 4)
      return;
    let romView = this.getDataView();
    let magic = romView.getUint32(0);
    if (magic === 0x80371240)
      return; // Normal, big endian ROM.

    $$log("Byteswapping ROM...");
    let evenLen = this._rom.byteLength - (this._rom.byteLength % 2);
    let fourLen = this._rom.byteLength - (this._rom.byteLength % 4);
    if (magic === 0x37804012) { // BADC, .v64 format
      for (let i = 0; i < evenLen; i += 2) {
        [this._u8array[i], this._u8array[i + 1]] = [this._u8array[i + 1], this._u8array[i]];
      }
    }
    else if (magic === 0x40123780) { // DCBA, little endian
      for (let i = 0; i < fourLen; i += 4) {
        [this._u8array[i], this._u8array[i + 1], this._u8array[i + 2], this._u8array[i + 3]]
          = [this._u8array[i + 3], this._u8array[i + 2], this._u8array[i + 1], this._u8array[i]];
      }
    }
    else if (magic === 0x12408037) { // CDAB, wordswapped
      for (let i = 0; i < fourLen; i += 4) {
        let last = romView.getUint16(i + 2);
        romView.setUint16(i + 2, romView.getUint16(i));
        romView.setUint16(i, last);
      }
    }
  }
}();
