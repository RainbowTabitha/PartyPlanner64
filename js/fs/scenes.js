PP64.ns("fs");

// Parses the scenes, no writing yet.

PP64.fs.scenes = new class Scenes {
  constructor() {
    this._sceneCache = [];
  }

  clearCache() {
    this._sceneCache = null;
  }

  get(index) {
    return this._sceneCache[index] || null;
  }

  count() {
    return this._sceneCache.length;
  }

  extractAsync() {
    return new Promise((resolve, reject) => {
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

    this._sceneCache = [];
    const romView = PP64.romhandler.getDataView();
    let curOffset = sceneTableOffset;
    while (romView.getUint32(curOffset) !== 0x44200000) {
      const romStart = romView.getUint32(curOffset);
      const romEnd = romView.getUint32(curOffset + 4);

      this._sceneCache.push(romView.buffer.slice(romStart, romEnd));

      curOffset += SIZEOF_SCENE_TABLE_ENTRY;
    }
  }

  replace(index, binary = null) {
    if (!binary) {
      this._promptReplace(index);
      return;
    }

    this._sceneCache[index] = binary;
  }

  _promptReplace(index) {
    PP64.utils.input.openFile("", (event) => {
      let file = event.target.files[0];
      if (!file)
        return;

      let reader = new FileReader();
      reader.onload = error => {
        this.replace(index, reader.result);
      };
      reader.readAsArrayBuffer(file);
    });
  }
};
