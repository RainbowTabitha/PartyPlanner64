namespace PP64.fs {
  export const scenes = new class Scenes {
    private _sceneInfo: any[] | null;

    constructor() {
      this._sceneInfo = [];
    }

    clearCache() {
      this._sceneInfo = null;
    }

    count() {
      return this._sceneInfo!.length;
    }

    getInfo(index: number) {
      return this._sceneInfo![index] || null;
    }

    getDataView(index: number) {
      const info = this._sceneInfo![index];
      return PP64.romhandler.getDataView(info.rom_start, info.rom_end);
    }

    getCodeDataView(index: number) {
      const info = this._sceneInfo![index];
      const startAddr = info.code_start & 0x7FFFFFFF;
      const endAddr = info.code_end & 0x7FFFFFFF;
      return PP64.romhandler.getDataView(info.rom_start, info.rom_start + (endAddr - startAddr));
    }

    getRoDataView(index: number) {
      const info = this._sceneInfo![index];
      const startAddr = info.rodata_start & 0x7FFFFFFF;
      const endAddr = info.rodata_end & 0x7FFFFFFF;
      const ramStart = info.ram_start & 0x7FFFFFFF;
      return PP64.romhandler.getDataView(
        info.rom_start + (startAddr - ramStart),
        info.rom_start + (endAddr - ramStart)
      );
    }

    extractAsync() {
      return new Promise((resolve) => {
        this.extract();
        resolve();
      });
    }

    extract() {
      const adapter = (PP64 as any).adapters.getROMAdapter();
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

    replace(index: number, buffer: ArrayBuffer | null = null) {
      if (!buffer) {
        this._promptReplace(index);
        return;
      }

      const info = this._sceneInfo![index];
      const romBuffer = PP64.romhandler.getROMBuffer();
      PP64.utils.arrays.copyRange(romBuffer!, buffer, info.rom_start, 0, buffer.byteLength);
    }

    _promptReplace(index: number) {
      PP64.utils.input.openFile("", (event) => {
        const file = (event.target! as HTMLInputElement).files![0];
        if (!file)
          return;

        const reader = new FileReader();
        reader.onload = error => {
          this.replace(index, reader.result as ArrayBuffer);
        };
        reader.readAsArrayBuffer(file);
      });
    }
  }
}