import { openFile } from "../utils/input";
import { copyRange } from "../utils/arrays";
import { romhandler } from "../romhandler";
import { getROMAdapter } from "../adapter/adapters";

interface ISceneInfo {
  rom_start: number;
  rom_end: number;
  ram_start: number;
  code_start: number;
  code_end: number;
  rodata_start: number;
  rodata_end: number;
  bss_start: number;
  bss_end: number;
}

const SIZEOF_SCENE_TABLE_ENTRY = (9 * 4);

/** Handles the overlays used in the game. */
export const scenes = new class Scenes {
  private _overlays: ArrayBuffer[] | null;
  private _sceneInfo: ISceneInfo[] | null;

  constructor() {
    this._overlays = [];
    this._sceneInfo = [];
  }

  clearCache() {
    this._overlays = null;
    this._sceneInfo = null;
  }

  count() {
    return this._sceneInfo!.length;
  }

  getInfo(index: number) {
    return this._sceneInfo![index] || null;
  }

  getDataView(index: number) {
    return new DataView(this._overlays![index]);
  }

  getCodeDataView(index: number) {
    const info = this._sceneInfo![index];
    const startAddr = info.code_start & 0x7FFFFFFF;
    const endAddr = info.code_end & 0x7FFFFFFF;
    return new DataView(this._overlays![index], 0, endAddr - startAddr);
  }

  getRoDataView(index: number) {
    const info = this._sceneInfo![index];
    const startAddr = info.rodata_start & 0x7FFFFFFF;
    const endAddr = info.rodata_end & 0x7FFFFFFF;
    const ramStart = info.ram_start & 0x7FFFFFFF;
    return new DataView(
      this._overlays![index],
      startAddr - ramStart,
      endAddr - ramStart
    );
  }

  public getByteLength(): number {
    return this._sceneInfo!.reduce((sum: number, currentInfo: ISceneInfo) => {
      return sum + currentInfo.rom_end - currentInfo.rom_start;
    }, 0);
  }

  extractAsync() {
    return new Promise((resolve) => {
      this.extract();
      resolve();
    });
  }

  extract() {
    const adapter = getROMAdapter();
    const sceneTableOffset = adapter && adapter.SCENE_TABLE_ROM;
    if (!sceneTableOffset) {
      throw new Error("SCENE_TABLE_ROM undefined in current ROM adapter");
    }

    this._overlays = [];
    this._sceneInfo = [];
    const romBuffer = romhandler.getROMBuffer()!;
    const romView = romhandler.getDataView();
    let curOffset = sceneTableOffset;
    while (romView.getUint32(curOffset) !== 0x44200000) {
      const info: ISceneInfo = {
        rom_start: romView.getUint32(curOffset),
        rom_end: romView.getUint32(curOffset + 4),
        ram_start: romView.getUint32(curOffset + 8),
        code_start: romView.getUint32(curOffset + 12),
        code_end: romView.getUint32(curOffset + 16),
        rodata_start: romView.getUint32(curOffset + 20),
        rodata_end: romView.getUint32(curOffset + 24),
        bss_start: romView.getUint32(curOffset + 28),
        bss_end: romView.getUint32(curOffset + 32),
      };
      this._sceneInfo.push(info);

      this._overlays.push(romBuffer.slice(info.rom_start, info.rom_end));

      curOffset += SIZEOF_SCENE_TABLE_ENTRY;
    }
  }

  public pack(buffer: ArrayBuffer, offset: number = 0): void {
    const adapter = getROMAdapter();
    const sceneTableOffset = adapter && adapter.SCENE_TABLE_ROM;
    if (!sceneTableOffset) {
      throw new Error("SCENE_TABLE_ROM undefined in current ROM adapter");
    }

    const romView = new DataView(buffer);
    let curOffset = sceneTableOffset;
    let i = 0;
    while (romView.getUint32(curOffset) !== 0x44200000) {
      // Write all values, some may not have changed.
      const info = this._sceneInfo![i];
      romView.setUint32(curOffset, info.rom_start);
      romView.setUint32(curOffset + 4, info.rom_end);
      romView.setUint32(curOffset + 8, info.ram_start);
      romView.setUint32(curOffset + 12, info.code_start);
      romView.setUint32(curOffset + 16, info.code_end);
      romView.setUint32(curOffset + 20, info.rodata_start);
      romView.setUint32(curOffset + 24, info.rodata_end);
      romView.setUint32(curOffset + 28, info.bss_start);
      romView.setUint32(curOffset + 32, info.bss_end);

      const ovlBuffer = this._overlays![i];
      copyRange(buffer, ovlBuffer, info.rom_start, 0, ovlBuffer.byteLength);

      curOffset += SIZEOF_SCENE_TABLE_ENTRY;
      i++;
    }
  }

  replace(index: number, buffer: ArrayBuffer | null = null) {
    if (!buffer) {
      this._promptReplace(index);
      return;
    }

    if (buffer.byteLength % 16) {
      throw new Error("Cannot have overlay byte length that is not divisible by 16");
    }

    this._overlays![index] = buffer;

    const info = this._sceneInfo![index];
    const oldSize = info.rom_end - info.rom_start;
    const diff = buffer.byteLength - oldSize;
    info.rom_end = info.rom_start + buffer.byteLength;
    for (let i = index + 1; i < this._sceneInfo!.length; i++) {
      const info = this._sceneInfo![i];
      info.rom_start -= diff;
      info.rom_end -= diff;
    }
  }

  _promptReplace(index: number) {
    openFile("", (event) => {
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
