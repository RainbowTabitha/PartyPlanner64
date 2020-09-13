import { $$log, $$hex, assert } from "../utils/debug";
import { copyRange } from "../utils/arrays";
import { Game } from "../types";
import { romhandler } from "../romhandler";
import { scenes } from "./scenes";
import { getRegSetAddress, getRegSetUpperAndLower } from "../utils/MIPS";
import { S2 } from "../audio/S2";
import { MBF0 } from "../audio/MBF0";
import { SBF0 } from "../audio/SBF0";
import { T3 } from "../audio/T3";
import { FXD0 } from "../audio/FXD0";
import { isDebug } from "../debug";
import { makeDivisibleBy } from "../utils/number";

interface IOffsetInfo {
  upper: number;
  lower: number;
  ovl?: number;
}

interface IOffsetObj {
  type: "S2" | "T3" | "MBF0" | "SBF0" | "FXD0" | "Pointer";
  byteLength?: number;
  offsets: IOffsetInfo[];
}

let _bufferCache: (ArrayBuffer | null)[] | null;
let _parsedCache: (S2 | T3 | MBF0 | SBF0 | FXD0 | null)[] | null;

type AudioOffsetInfo = { [game in Game]: readonly IOffsetObj[] };
const _audioOffsets: AudioOffsetInfo = {
  [Game.MP1_USA]: [ // Length 0x7B3DF0
    // 15396A0
    {
      type: "S2",
      // byteLength: 0x23F520,
      offsets: [
        { upper: 0x00061746, lower: 0x0006174A },
        { ovl: 0x6E, upper: 0xE62, lower: 0xE66 }, // ROM: 0x2DA3D2
      ]
    },

    // 1778BC0
    {
      type: "S2",
      // byteLength: 0xB9F20,
      offsets: [
        { upper: 0x0001AF2A, lower: 0x0001AF2E },
        { upper: 0x0006174E, lower: 0x00061752 },
        { upper: 0x0006177E, lower: 0x00061782 },
        { ovl: 0x6E, upper: 0xE6A, lower: 0xE6E }, // ROM: 0x2DA3DA
        { ovl: 0x6E, upper: 0xE92, lower: 0xE96 }, // ROM: 0x2DA402
      ]
    },

    // 1832AE0
    {
      type: "T3",
      byteLength: 0x385980,
      offsets: [
        { upper: 0x0001AF32, lower: 0x0001AF36 },
        { upper: 0x0006172E, lower: 0x00061732 },
        { upper: 0x00061786, lower: 0x0006178A },
        { ovl: 0x6E, upper: 0xE4E, lower: 0xE52 }, // ROM: 0x2DA3BE
        { ovl: 0x6E, upper: 0xE9A, lower: 0xE9E }, // ROM: 0x2DA40A
      ]
    },

    // 1BB8460
    {
      type: "T3",
      byteLength: 0x134800,
      offsets: [
        { upper: 0x0001AF0E, lower: 0x0001AF12 },
        { upper: 0x00061762, lower: 0x00061766 },
        { ovl: 0x6E, upper: 0xE7A, lower: 0xE7E }, // ROM: 0x2DA3EA
      ]
    },

    // 1CECC60
    {
      type: "FXD0",
      byteLength: 0x830,
      offsets: [
        { upper: 0x0001AF5A, lower: 0x0001AF5E },
      ]
    },

    // 1CED490, 0xffffffffs EOF
    {
      type: "Pointer",
      byteLength: 0,
      offsets: [
        { upper: 0x0001AF66, lower: 0x0001AF6A },
      ]
    },
  ],

  [Game.MP1_JPN]: [ // Length ?
  ],
  [Game.MP1_PAL]: [ // Length ?
  ],

  [Game.MP2_USA]: [ // Length 0x6DAB50
    // 0x1750450
    {
      type: "MBF0",
      // byteLength: 0x1B9C40,
      offsets: [
        { upper: 0x0001D342, lower: 0x0001D346 },
        { upper: 0x0007A9EE, lower: 0x0007A9F2 },
        { upper: 0x0007AA12, lower: 0x0007AA16 },
      ]
    },
    // 0x190A090
    {
      type: "SBF0",
      byteLength: 0x3B5380,
      offsets: [
        { upper: 0x0007A9FA, lower: 0x0007A9FE },
      ]
    },
    // 0x1CBF410
    {
      type: "SBF0",
      byteLength: 0x16B150,
      offsets: [
        { upper: 0x0001D34E, lower: 0x0001D352 },
        { upper: 0x0007AA1E, lower: 0x0007AA22 },
      ]
    },
    // 0x1E2A560
    {
      type: "FXD0",
      byteLength: 0xA40,
      offsets: [
        { upper: 0x0001D382, lower: 0x0001D386 },
      ]
    },
  ],

  [Game.MP2_JPN]: [ // Length ?
  ],
  [Game.MP2_PAL]: [ // Length ?
  ],

  [Game.MP3_USA]: [ // Length 0x67be40
    // 0x1881C40
    {
      type: "MBF0",
      // byteLength: 0x1D4C30,
      offsets: [
        { upper: 0x0000F26A, lower: 0x0000F26E },
        { upper: 0x0004BEF2, lower: 0x0004BEF6 },
      ]
    },
    // 0x1A56870
    {
      type: "SBF0",
      byteLength: 0x4A67D0,
      offsets: [
        { upper: 0x0000F276, lower: 0x0000F27A },
        { upper: 0x0004BEFE, lower: 0x0004BF02 },
      ]
    },
    // 0x1EFD040
    {
      type: "FXD0",
      byteLength: 0xA40,
      offsets: [
        { upper: 0x0000F29E, lower: 0x0000F2A2 },
      ]
    },
    // E0F 0x1EFDA80
  ],

  [Game.MP3_JPN]: [ // Length ?
  ],
  [Game.MP3_PAL]: [ // Length ?
  ],
}

export const audio = {
  getROMOffset(subsection = 0) {
    const infos = this.getPatchInfo();
    if (!infos || !infos.length)
      return null;
    let patchInfo = infos[subsection];
    if (!patchInfo)
      return null;
    let romPatchInfo = patchInfo.offsets[0];
    let upperReadOffset = romPatchInfo.upper;
    let lowerReadOffset = romPatchInfo.lower;
    let upper, lower;
    if (typeof romPatchInfo.ovl === "number") {
      const sceneView = scenes.getDataView(romPatchInfo.ovl);
      upper = sceneView.getUint16(upperReadOffset);
      lower = sceneView.getUint16(lowerReadOffset);
    }
    else {
      const romView = romhandler.getDataView();
      upper = romView.getUint16(upperReadOffset);
      lower = romView.getUint16(lowerReadOffset);
    }

    const offset = getRegSetAddress(upper, lower);
    $$log(`Audio.getROMOffset -> ${$$hex(offset)}`);

    if (isDebug()) { // Assert that the rest of the patch offsets are valid.
      patchInfo.offsets.forEach((offsetInfo, oIndex) => {
        let anotherUpperReadOffset = offsetInfo.upper;
        let anotherLowerReadOffset = offsetInfo.lower;
        let anotherUpper, anotherLower;
        if (typeof offsetInfo.ovl === "number") {
          const sceneView = scenes.getDataView(offsetInfo.ovl);
          anotherUpper = sceneView.getUint16(anotherUpperReadOffset);
          anotherLower = sceneView.getUint16(anotherLowerReadOffset);
        }
        else {
          const romView = romhandler.getDataView();
          anotherUpper = romView.getUint16(anotherUpperReadOffset);
          anotherLower = romView.getUint16(anotherLowerReadOffset);
        }

        const anotherOffset = getRegSetAddress(anotherUpper, anotherLower);
        if (anotherOffset !== offset)
          throw new Error(`AudioFS.getROMOffset patch offset ${subsection}/${oIndex} seems wrong:
          offset: ${$$hex(offset)} vs ${$$hex(anotherOffset)}
          reading upper: ${$$hex(anotherUpperReadOffset)}, lower: ${$$hex(anotherLowerReadOffset)}`);
      });
    }

    return offset;
  },

  setROMOffset(newOffset: number, outBuffer: ArrayBuffer) {
    $$log(`Audio.setROMOffset(${$$hex(newOffset)})`);
    let infos = this.getPatchInfo();
    let currentOffset = newOffset;
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      const [upper, lower] = getRegSetUpperAndLower(currentOffset);
      for (let j = 0; j < info.offsets.length; j++) {
        const patchOffset = info.offsets[j];
        let patchROMUpper = patchOffset.upper;
        let patchROMLower = patchOffset.lower;
        if (typeof patchOffset.ovl === "number") {
          const sceneView = scenes.getDataView(patchOffset.ovl);
          sceneView.setUint16(patchROMUpper, upper);
          sceneView.setUint16(patchROMLower, lower);
        }
        else {
          const romView = new DataView(outBuffer);
          romView.setUint16(patchROMUpper, upper);
          romView.setUint16(patchROMLower, lower);
        }
      }

      switch (info.type) {
        case "T3":
        case "SBF0":
        case "FXD0":
          assert(typeof info.byteLength === "number");
          assert(info.byteLength % 16 === 0);
          currentOffset += info.byteLength;
          break;

        case "S2":
          assert(!!_parsedCache![i]);
          const s2 = _parsedCache![i] as S2;
          currentOffset += s2.getByteLength();
          break;

        case "MBF0":
          assert(!!_parsedCache![i]);
          const mbf0 = _parsedCache![i] as MBF0;
          currentOffset += mbf0.getByteLength();
          break;

        case "Pointer":
          break;

        default:
          throw new Error("Unhandled audio subsection type: " + info.type);
      }
    }
  },

  getPatchInfo() {
    return _audioOffsets[romhandler.getROMGame()!];
  },

  read(index: number) {
    throw new Error("audio.read not implemented");
  },

  write(index: number, value: any) {
    throw new Error("audio.write not implemented");
  },

  getSequenceTableCount(): number {
    let count = 0;
    for (let i = 0; i < _parsedCache!.length; i++) {
      const cacheEntry = _parsedCache![i];
      if (cacheEntry && "midis" in cacheEntry)
        count++;
    }
    return count;
  },

  getSequenceTable(index: number): S2 | MBF0 | null {
    if (!_parsedCache)
      return null;

    let curIndex = -1;
    for (let i = 0; i < _parsedCache.length; i++) {
      const cacheEntry = _parsedCache[i];
      if (cacheEntry && "midis" in cacheEntry) {
        curIndex++;

        if (curIndex === index) {
          return cacheEntry;
        }
      }
    }
    return null;
  },

  getSoundTableCount(): number {
    let count = 0;
    for (let i = 0; i < _parsedCache!.length; i++) {
      const cacheEntry = _parsedCache![i];
      if (cacheEntry && "sounds" in cacheEntry)
        count++;
    }
    return count;
  },

  getSoundTable(index: number): T3 | SBF0 | null {
    if (!_parsedCache)
      return null;

    let curIndex = -1;
    for (let i = 0; i < _parsedCache.length; i++) {
      const cacheEntry = _parsedCache[i];
      if (cacheEntry && "sounds" in cacheEntry) {
        curIndex++;

        if (curIndex === index) {
          return cacheEntry;
        }
      }
    }
    return null;
  },

  clearCache(): void {
    _bufferCache = null;
    _parsedCache = null;
  },

  extract(): void {
    const buffer = romhandler.getROMBuffer()!;
    let offset = this.getROMOffset();
    if (offset === null)
      return;

    const infos = this.getPatchInfo();
    _bufferCache = new Array(infos.length);
    _parsedCache = new Array(infos.length);
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      switch (info.type) {
        case "S2":
          const s2Offset = this.getROMOffset(i)!;
          const s2 = _parsedCache[i] = new S2(romhandler.getDataView(s2Offset));
          _bufferCache[i] = buffer.slice(s2Offset, s2Offset + s2.getByteLength());
          break;

        case "T3":
          assert(typeof info.byteLength === "number");
          const t3Offset = this.getROMOffset(i)!;
          _bufferCache[i] = buffer.slice(t3Offset, t3Offset + info.byteLength);
          _parsedCache[i] = new T3(romhandler.getDataView(t3Offset));
          break;

        case "MBF0":
          const mbf0Offset = this.getROMOffset(i)!;
          const mbf0 = _parsedCache[i] = new MBF0(romhandler.getDataView(mbf0Offset));
          _bufferCache[i] = buffer.slice(mbf0Offset, mbf0Offset + mbf0.getByteLength());
          break;

        case "SBF0":
          assert(typeof info.byteLength === "number");
          const sbf0Offset = this.getROMOffset(i)!;
          _bufferCache[i] = buffer.slice(sbf0Offset, sbf0Offset + info.byteLength);
          _parsedCache[i] = new SBF0(romhandler.getDataView(sbf0Offset));
          break;

        case "FXD0":
          assert(typeof info.byteLength === "number");
          const fxd0Offset = this.getROMOffset(i)!;
          _bufferCache[i] = buffer.slice(fxd0Offset, fxd0Offset + info.byteLength);
          _parsedCache[i] = new FXD0(romhandler.getDataView(fxd0Offset));
          break;

        case "Pointer":
          _bufferCache[i] = _parsedCache[i] = null;
          break;

        default:
          throw new Error("Unhandled audio subsection type: " + info.type);
      }
    }

    // Finds audio offsets relative to overlay binaries
  //   const infos = getPatchInfo();
  //   const sceneCount = scenes.count();
  //   for (let i = 0; i < infos.length; i++) {
  //     const info = infos[i];
  //     info.offsets.forEach((oft) => {
  //       let found = false;
  //       for (let j = 0; j < sceneCount; j++) {
  //         const info = scenes.getInfo(j);
  //         if (oft.upper > info.rom_start && oft.upper < info.rom_end) {
  // console.log(`Found: { ovl: ${$$hex(j)}, upper: ${$$hex(oft.upper - info.rom_start)}, lower: ${$$hex(oft.lower - info.rom_start)} }, // ROM: ${$$hex(oft.upper)}`)
  //           found = true;
  //         }
  //       }

  //       if (!found) {
  //         console.log(`Didn't find: { upper: ${$$hex(oft.upper)}, lower: ${$$hex(oft.lower)} }`);
  //       }
  //     });
  //   }
  },

  extractAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.extract();
      resolve();
    });
  },

  pack(buffer: ArrayBuffer, offset: number = 0): number {
    const infos = this.getPatchInfo();
    if (!infos || !infos.length || !_bufferCache) {
      throw new Error("Unable to write audio section.");
    }

    let currentOffset = offset;
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      switch (info.type) {
        case "T3":
        case "SBF0":
        case "FXD0":
          assert(typeof info.byteLength === "number");
          copyRange(buffer, _bufferCache[i]!, currentOffset, 0, _bufferCache[i]!.byteLength);
          currentOffset += info.byteLength;
          break;

        case "S2":
          const s2 = _parsedCache![i] as S2;
          currentOffset += s2.pack(buffer, currentOffset);
          currentOffset = makeDivisibleBy(currentOffset, 16);
          break;

        case "MBF0":
          const mbf0 = _parsedCache![i] as MBF0;
          currentOffset += mbf0.pack(buffer, currentOffset);
          currentOffset = makeDivisibleBy(currentOffset, 16);
          break;

        case "Pointer":
          break;

        default:
          throw new Error("Unhandled audio subsection type: " + info.type);
      }
    }

    const byteLengthWritten = currentOffset - offset;
    assert(byteLengthWritten % 16 === 0);
    return byteLengthWritten;
  },

  // Gets the full byte length of the audio section of the ROM.
  getByteLength() {
    const infos = this.getPatchInfo();
    if (!infos || !infos.length) {
      throw new Error("Unable to determine audio section length.");
    }

    let byteLength = 0;
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      switch (info.type) {
        case "T3":
        case "SBF0":
        case "FXD0":
          assert(typeof info.byteLength === "number");
          byteLength += info.byteLength;
          break;

        case "S2":
          const s2 = _parsedCache![i] as S2;
          byteLength += s2.getByteLength();
          break;

        case "MBF0":
          const mbf0 = _parsedCache![i] as MBF0;
          byteLength += mbf0.getByteLength();
          break;

        case "Pointer":
          break;

        default:
          throw new Error("Unhandled audio subsection type: " + info.type);
      }
    }

    return byteLength;
  }
};
