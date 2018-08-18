PP64.ns("fs");

// Parses the scenes, no writing yet.

PP64.fs.scenes = new class Scenes {
  constructor() {
    this._sceneInfo = [];
  }

  clearCache() {
    this._sceneInfo = null;
  }

  getInfo(index) {
    return this._sceneInfo[index] || null;
  }

  count() {
    return this._sceneInfo.length;
  }

  extractAsync() {
    return new Promise((resolve) => {
      this.extract();
      resolve();
    });
  }

  extract() {
    const adapter = PP64.adapters.getROMAdapter();
    const sceneTableOffset = adapter && adapter.SCENE_TABLE_ROM;
    if (!sceneTableOffset) {
      throw new Error("SCENE_TABLE_ROM undefined in current ROM adapter");
    }

    const SIZEOF_SCENE_TABLE_ENTRY = (9 * 4);

    this._sceneInfo = [];
    const romView = PP64.romhandler.getDataView();
    let curOffset = sceneTableOffset;
    while (romView.getUint32(curOffset) !== 0x44200000) {
      this._sceneInfo.push({
        rom_start: romView.getUint32(curOffset),
        rom_end: romView.getUint32(curOffset + 4),
        ram_start: romView.getUint32(curOffset + 8),
        code_start: romView.getUint32(curOffset + 12),
        code_end: romView.getUint32(curOffset + 16),
        rodata_start: romView.getUint32(curOffset + 20),
        rodata_end: romView.getUint32(curOffset + 24),
        bss_start: romView.getUint32(curOffset + 28),
        bss_end: romView.getUint32(curOffset + 32),
      });

      curOffset += SIZEOF_SCENE_TABLE_ENTRY;
    }
  }

  // replace(index, binary = null) {
  //   if (!binary) {
  //     this._promptReplace(index);
  //     return;
  //   }

  //   this._sceneCache[index] = binary;
  // }

  // _promptReplace(index) {
  //   PP64.utils.input.openFile("", (event) => {
  //     let file = event.target.files[0];
  //     if (!file)
  //       return;

  //     let reader = new FileReader();
  //     reader.onload = error => {
  //       this.replace(index, reader.result);
  //     };
  //     reader.readAsArrayBuffer(file);
  //   });
  // }
};
