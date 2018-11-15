import { $$log, $$hex } from "../utils/debug";
import { makeDivisibleBy } from "../utils/number";
import { copyRange } from "../utils/arrays";
import { Game } from "../types";
import { romhandler } from "../romhandler";
import { getROMAdapter } from "../adapter/adapters";

interface IOffsetInfo {
  upper: number;
  lower: number;
}

let _stringOffsets: { [game: string]: IOffsetInfo[] } = {};
_stringOffsets[Game.MP1_USA] = [
  { upper: 0x0001AE6E, lower: 0x0001AE76 },
];
_stringOffsets[Game.MP1_JPN] = [
  { upper: 0x0001AD9E, lower: 0x0001ADA6 },
];
_stringOffsets[Game.MP2_USA] = [ // Default at 0x1142DD0
  { upper: 0x0001D22A, lower: 0x0001D232 },
  { upper: 0x00089356, lower: 0x0008935E },
  { upper: 0x0008936A, lower: 0x00089372 },
];

export namespace strings {
  export function getROMOffset() {
    let romView = romhandler.getDataView();
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
      offset = offset - 0x00010000; // Signed ASM addition workaround.
    $$log(`Strings.getROMOffset -> ${$$hex(offset)}`);

    if ($$debug) { // Assert that the rest of the patch offsets are valid.
      for (let i = 1; i < patchOffsets.length; i++) {
        let anotherUpper = romView.getUint16(patchOffsets[i].upper) << 16;
        let anotherLower = romView.getUint16(patchOffsets[i].lower);
        if (anotherUpper !== upper || anotherLower !== lower)
          throw `Strings.getROMOffset patch offset ${i} seems wrong`;
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
      upper += 1; // Adjust for signed addition in ASM.
    for (let i = 0; i < patchOffsets.length; i++) {
      romView.setUint16(patchOffsets[i].upper, upper);
      romView.setUint16(patchOffsets[i].lower, lower);
    }
    $$log(`Strings.setROMOffset -> ${$$hex((upper << 16) | lower)}`);
  }

  export function getPatchOffsets() {
    return _stringOffsets[romhandler.getROMGame()!];
  }

  export class StringTable {
    private strs: ArrayBuffer[];

    constructor(dataView: DataView) {
      this.strs = this._extract(dataView)
    }

    _extract(view: DataView) {
      let strCount = this._getStringCountFromView(view);
      let strs = new Array(strCount);
      for (let s = 0; s < strCount; s++) {
        strs[s] = this._readFromView(view, s);
      }
      return strs;
    }

    _getStringCountFromView(view: DataView) {
      return view.getUint32(0);
    }

    _readFromView(view: DataView, index: number) {
      let entryOffset = this._getStringOffsetFromView(view, index);
      let entryView = new DataView(view.buffer, view.byteOffset + entryOffset);
      let strSize = entryView.getUint16(0);
      return view.buffer.slice(view.byteOffset + entryOffset + 2, view.byteOffset + entryOffset + 2 + strSize);
    }

    _getStringOffsetFromView(view: DataView, index: number) {
      return view.getUint32(4 * (1 + index));
    }

    public read(index: number, raw: false): string;
    public read(index: number, raw: true): ArrayBuffer;
    public read(index: number, raw: boolean): ArrayBuffer | string;
    public read(index: number, raw: boolean = false): ArrayBuffer | string {
      if (index >= this.getStringCount())
        throw "Requesting non-existent string entry";

      let bytes = this.strs[index];
      if (raw)
        return bytes;
      let entryView = new DataView(bytes);
      let result = "";
      for (let i = 0; i < bytes.byteLength; i++)
        result += this._byteToStr(entryView.getUint8(i));
      return result;
    }

    _byteToStr(val: number) {
      let map = getROMAdapter()!.getCharacterMap();
      if (map.hasOwnProperty(val))
        return map[val];
      return String.fromCharCode(val);
    }

    write(index: number, content: ArrayBuffer) {
      this.strs[index] = content.slice(0);
    }

    getStringCount() {
      return this.strs.length;
    }

    getByteLength(applyCompression: boolean = false) {
      let byteLen = 0;
      let strCount = this.strs.length;

      byteLen += 4; // Count of strings
      byteLen += 4 * strCount; // String offsets

      for (let s = 0; s < strCount; s++) {
        byteLen += 2; // String length
        byteLen += this.strs[s].byteLength;
        byteLen = makeDivisibleBy(byteLen, 2);
      }

      if (applyCompression) { // Assuming dumb compress01
        byteLen += (byteLen / 8) + 16; // to be safe
      }

      return byteLen;
    }

    pack(buffer: ArrayBuffer, offset: number = 0) {
      let view = new DataView(buffer, offset);

      let strCount = this.getStringCount();
      view.setUint32(0, strCount);

      let curStrIndexOffset = 4;
      let curStrWriteOffset = 4 + (strCount * 4);
      for (let s = 0; s < strCount; s++) {
        view.setUint32(curStrIndexOffset, curStrWriteOffset);
        curStrIndexOffset += 4;
        curStrWriteOffset = this._packStr(s, view, curStrWriteOffset);
        curStrWriteOffset = makeDivisibleBy(curStrWriteOffset, 2);
      }

      return curStrWriteOffset;
    }

    _packStr(s: number, view: DataView, offset: number) {
      let strBytes = this.strs[s];
      view.setUint16(offset, strBytes.byteLength);
      copyRange(view, strBytes, offset + 2, 0, strBytes.byteLength);
      return offset + 2 + strBytes.byteLength;
    }
  }

  export function _strToBytes(str: string): number[] {
    let map = getROMAdapter()!.getCharacterMap();
    let result = [];
    let [curIdx, len] = [0, str.length];
    while (curIdx < len) {
      let lastMatchLen = 0;
      let lastMatch;
      for (let byte in map) {
        if (!map.hasOwnProperty(byte))
          continue;

        let chars = map[byte];
        if (str.substr(curIdx, chars.length) === chars) {
          if (chars.length > lastMatchLen) {
            lastMatchLen = chars.length;
            lastMatch = byte;
          }
        }
      }

      if (lastMatchLen === 0) {
        lastMatchLen = 1;
        lastMatch = str.charCodeAt(curIdx);
      }

      if (typeof lastMatch === "string")
        lastMatch = parseInt(lastMatch);

      result.push(lastMatch!);
      curIdx += lastMatchLen;
    }

    return result;
  }

  let _strFsInstance: StringTable | null;

  export function extract() {
    let view = romhandler.getDataView(getROMOffset()!);
    return _strFsInstance = new StringTable(view);
  }

  export function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  export function pack(buffer: ArrayBuffer, offset: number = 0) {
    return _strFsInstance!.pack(buffer, offset);
  }

  export function read(index: number, raw: true): ArrayBuffer;
  export function read(index: number, raw?: false): string;
  export function read(index: number, raw: boolean): ArrayBuffer | string;
  export function read(index: number, raw: boolean = false): ArrayBuffer | string {
    return _strFsInstance!.read(index, raw);
  }

  // Writes a pre-made buffer for now.
  export function write(index: number, content: ArrayBuffer) {
    _strFsInstance!.write(index, content);
  }

  export function clear() {
    _strFsInstance = null;
  }

  export function getStringCount() {
    return _strFsInstance!.getStringCount();
  }

  // Gets the required byte length of the string section of the ROM.
  export function getByteLength() {
    return _strFsInstance!.getByteLength();
  }
}
