import { $$log, $$hex } from "../utils/debug";
import { copyRange } from "../utils/arrays";
import { Game } from "../types";
import { romhandler } from "../romhandler";
import { scenes } from "./scenes";
import { getRegSetAddress, getRegSetUpperAndLower } from "../utils/MIPS";

interface IOffsetInfo {
  upper: number;
  lower: number;
  ovl?: number;
}

interface IOffsetObj {
  relative: number;
  offsets: IOffsetInfo[];
}

const _audioOffsets: { [game: string]: IOffsetObj[] } = {};

_audioOffsets[Game.MP1_USA] = [ // Length 0x7B3DF0
  // 15396A0
  {
    relative: 0,
    offsets: [
      { upper: 0x00061746, lower: 0x0006174A },
      { ovl: 0x6E, upper: 0xE62, lower: 0xE66 }, // ROM: 0x2DA3D2
    ]
  },

  // 1778BC0
  {
    relative: 0x23F520,
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
    relative: 0x2F9440,
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
    relative: 0x67EDC0,
    offsets: [
      { upper: 0x0001AF0E, lower: 0x0001AF12 },
      { upper: 0x00061762, lower: 0x00061766 },
      { ovl: 0x6E, upper: 0xE7A, lower: 0xE7E }, // ROM: 0x2DA3EA
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

_audioOffsets[Game.MP1_JPN] = [ // Length ?
];

_audioOffsets[Game.MP2_USA] = [ // Length 0x6DAB50
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
_audioOffsets[Game.MP3_USA] = [ // Length 0x67be40
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

export namespace audio {
  export function getROMOffset(subsection = 0) {
    let romView = romhandler.getDataView();
    let patchInfo = getPatchInfo()[subsection];
    if (!patchInfo)
      return null;
    let romPatchInfo = patchInfo.offsets[0];
    let upperReadOffset = romPatchInfo.upper;
    let lowerReadOffset = romPatchInfo.lower;
    if (typeof romPatchInfo.ovl === "number") {
      const sceneInfo = scenes.getInfo(romPatchInfo.ovl);
      upperReadOffset += sceneInfo.rom_start;
      lowerReadOffset += sceneInfo.rom_start;
    }
    let upper = romView.getUint16(upperReadOffset);
    let lower = romView.getUint16(lowerReadOffset);
    const offset = getRegSetAddress(upper, lower);
    $$log(`Audio.getROMOffset -> ${$$hex(offset)}`);

    if ($$debug) { // Assert that the rest of the patch offsets are valid.
      patchInfo.offsets.forEach((offsetInfo, oIndex) => {
        let anotherUpperReadOffset = offsetInfo.upper;
        let anotherLowerReadOffset = offsetInfo.lower;
        if (typeof offsetInfo.ovl === "number") {
          const sceneInfo = scenes.getInfo(offsetInfo.ovl);
          anotherUpperReadOffset += sceneInfo.rom_start;
          anotherLowerReadOffset += sceneInfo.rom_start;
        }
        let anotherUpper = romView.getUint16(anotherUpperReadOffset);
        let anotherLower = romView.getUint16(anotherLowerReadOffset);
        const anotherOffset = getRegSetAddress(anotherUpper, anotherLower);
        if (anotherOffset !== offset)
          throw `AudioFS.getROMOffset patch offset ${subsection}/${oIndex} seems wrong:
          offset: ${$$hex(offset)} vs ${$$hex(anotherOffset)}
          reading upper: ${$$hex(anotherUpperReadOffset)}, lower: ${$$hex(anotherLowerReadOffset)}
          `;
      });
    }

    return offset;
  }

  export function setROMOffset(newOffset: number, buffer: ArrayBuffer) {
    $$log(`Audio.setROMOffset(${$$hex(newOffset)})`);
    let romView = new DataView(buffer);
    let patchSubsections = getPatchInfo();
    for (let i = 0; i < patchSubsections.length; i++) {
      let subsection = patchSubsections[i];
      let subsectionaddr = newOffset + subsection.relative;
      const [upper, lower] = getRegSetUpperAndLower(subsectionaddr);
      for (let j = 0; j < subsection.offsets.length; j++) {
        const patchOffset = subsection.offsets[j];
        let patchROMUpper = patchOffset.upper;
        let patchROMLower = patchOffset.lower;
        if (typeof patchOffset.ovl === "number") {
          const sceneInfo = scenes.getInfo(patchOffset.ovl);
          patchROMUpper += sceneInfo.rom_start;
          patchROMLower += sceneInfo.rom_start;
        }
        romView.setUint16(patchROMUpper, upper);
        romView.setUint16(patchROMLower, lower);
      }
    }
  }

  export function getPatchInfo() {
    return _audioOffsets[romhandler.getROMGame()!];
  }

  export function read(index: number) {
    throw "audio.read not implemented";
  }

  export function write(index: number, value: any) {
    throw "audio.write not implemented";
  }

  let _audioCache: ArrayBuffer | null;

  export function clearCache() {
    _audioCache = null;
  }

  export function extract() {
    let buffer = romhandler.getROMBuffer()!;
    let offset = getROMOffset();
    if (offset === null)
      return;
    let len = getByteLength();
    _audioCache = buffer.slice(offset, offset + len);

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
  }

  export function extractAsync() {
    return new Promise((resolve, reject) => {
      extract();
      resolve();
    });
  }

  export function pack(buffer: ArrayBuffer, offset: number = 0) {
    copyRange(buffer, _audioCache!, offset, 0, _audioCache!.byteLength);
    return _audioCache!.byteLength;
  }

  // Gets the full byte length of the audio section of the ROM.
  export function getByteLength() {
    // Who knows how to interpret the audio section? Hard code for now.
    let gameID = romhandler.getROMGame();
    switch(gameID) {
      case Game.MP1_USA:
        return 0x7B3DF0; // 0x1CED490 - 0x15396A0
      case Game.MP1_JPN:
        return 0x10; // FIXME
      case Game.MP2_USA:
        return 0x6DAB50; // 0x1E2AFA0 - 0x1750450
      case Game.MP3_USA:
        return 0x67BE40; // 0x1EFDA80 - 0x1881C40
    }

    throw "Figure out the audio section length for " + gameID;
  }

  class S2 {
    private __type: string = "S2";

    public midis: any[] = [];
    public tbl!: ArrayBuffer;
    public soundbanks!: B1;

    constructor(dataView: DataView) {
      if (dataView.getUint16(0) !== 0x5332) // "S2"
        throw "S2 constructor encountered non-S2 structure";

      this._extract(dataView);
    }

    _extract(view: DataView) {
      let midiCount = view.getUint16(2);
      let extendedS2TableOffset = 4 + (midiCount * 8);

      // Extract midi buffers
      for (let i = 0; i < midiCount; i++) {
        let midiOffset = view.getUint32(4 + (i * 4 * 2));
        let midiSize = view.getUint32(8 + (i * 4 * 2));

        let midiStart = view.byteOffset + midiOffset;
        this.midis.push({
          buffer: view.buffer.slice(midiStart, midiStart + midiSize),
          soundbankIndex: view.getUint8(extendedS2TableOffset + (i * 16))
        });
      }

      // Extract tbl buffer
      // Assumption: we know where it begins, and will assume it ends at the first midi offset.
      let tblOffsetStart = view.getUint32(extendedS2TableOffset + 12);
      let tblOffsetEnd = view.getUint32(4); // First midi offset
      this.tbl = view.buffer.slice(view.byteOffset + tblOffsetStart, view.byteOffset + tblOffsetEnd);

      // Extract B1 structure
      // Assumption: extra S2 table entries all point to same B1
      let B1offset = view.getUint32(extendedS2TableOffset + 4);
      let B1view = new DataView(view.buffer, view.byteOffset + B1offset);
      this.soundbanks = new B1(B1view);
    }
  }

  class B1 {
    private __type: string = "B1";

    public banks: ALBank[] = [];

    constructor(dataView: DataView) {
      if (dataView.getUint16(0) !== 0x4231) // "B1"
        throw "B1 constructor encountered non-B1 structure";

      this._extract(dataView);
    }

    _extract(view: DataView) {
      let bankCount = view.getUint16(2);
      for (let i = 0; i < bankCount; i++) {
        let bankOffset = view.getUint32(4 + (i * 4));
        this.banks.push(new ALBank(view, bankOffset));
      }
    }
  }

  class ALBank {
    private __type: string = "ALBank";

    public flags!: number;
    public pad!: number;
    public sampleRate!: number;
    public instruments: ALInst[] = [];

    constructor(B1view: DataView, bankOffset: number) {
      this._extract(B1view, bankOffset);
    }

    _extract(B1view: DataView, bankOffset: number) {
      this.flags = B1view.getUint16(bankOffset + 2);
      this.pad = B1view.getUint16(bankOffset + 4);
      this.sampleRate = B1view.getUint16(bankOffset + 6);

      let percussionOffset = B1view.getUint32(bankOffset + 8);
      if (percussionOffset)
        throw `Need to parse percussion at bank offset ${$$hex(B1view.byteOffset + bankOffset)}`;

      let instrumentCount = B1view.getUint16(bankOffset);
      for (let i = 0; i < instrumentCount; i++) {
        let instrumentOffset = B1view.getUint32(bankOffset + 12 + (i * 4));
        this.instruments.push(new ALInst(B1view, instrumentOffset));
      }
    }
  }

  class ALInst {
    private __type: string = "ALInst";

    public volume!: number;
    public pan!: number;
    public priority!: number;
    public flags!: number;
    public tremType!: number;
    public tremRate!: number;
    public tremDepth!: number;
    public tremDelay!: number;
    public vibType!: number;
    public vibRate!: number;
    public vibDepth!: number;
    public vibDelay!: number;
    public bendRange!: number;
    public sounds: ALSound[] = [];

    constructor(B1view: DataView, instOffset: number) {
      this._extract(B1view, instOffset);
    }

    _extract(B1view: DataView, instOffset: number) {
      this.volume = B1view.getUint8(instOffset);
      this.pan = B1view.getUint8(instOffset + 1);
      this.priority = B1view.getUint8(instOffset + 2);
      this.flags = B1view.getUint8(instOffset + 3);
      this.tremType = B1view.getUint8(instOffset + 4);
      this.tremRate = B1view.getUint8(instOffset + 5);
      this.tremDepth = B1view.getUint8(instOffset + 6);
      this.tremDelay = B1view.getUint8(instOffset + 7);
      this.vibType = B1view.getUint8(instOffset + 8);
      this.vibRate = B1view.getUint8(instOffset + 9);
      this.vibDepth = B1view.getUint8(instOffset + 10);
      this.vibDelay = B1view.getUint8(instOffset + 11);
      this.bendRange = B1view.getUint16(instOffset + 12);

      let soundCount = B1view.getUint16(instOffset + 14);
      for (let i = 0; i < soundCount; i++) {
        let soundOffset = B1view.getUint32(instOffset + 16 + (i * 4));
        this.sounds.push(new ALSound(B1view, soundOffset));
      }
    }
  }

  class ALSound {
    private __type: string = "ALSound";

    public env!: ALEnv;
    public keymap!: ALKey;
    public wave!: ALWave;
    public samplePan!: number;
    public sampleVolume!: number;
    public flags!: number;

    constructor(B1view: DataView, soundOffset: number) {
      this._extract(B1view, soundOffset);
    }

    _extract(B1view: DataView, soundOffset: number) {
      let envOffset = B1view.getUint32(soundOffset);
      this.env = new ALEnv(B1view, envOffset);

      let keymapOffset = B1view.getUint32(soundOffset + 4);
      this.keymap = new ALKey(B1view, keymapOffset);

      let waveOffset = B1view.getUint32(soundOffset + 8);
      this.wave = new ALWave(B1view, waveOffset);

      this.samplePan = B1view.getUint8(soundOffset + 12);
      this.sampleVolume = B1view.getUint8(soundOffset + 13);
      this.flags = B1view.getUint8(soundOffset + 14);
    }
  }

  class ALEnv {
    private __type: string = "ALEnv";

    public attackTime!: number;
    public decayTime!: number;
    public releaseTime!: number;
    public attackVolume!: number;
    public decayVolume!: number;
    public zeroPad!: number;

    constructor(B1view: DataView, envOffset: number) {
      this._extract(B1view, envOffset);
    }

    _extract(B1view: DataView, envOffset: number) {
      this.attackTime = B1view.getUint32(envOffset);
      this.decayTime = B1view.getUint32(envOffset + 4);
      this.releaseTime = B1view.getUint32(envOffset + 8);
      this.attackVolume = B1view.getUint8(envOffset + 12);
      this.decayVolume = B1view.getUint8(envOffset + 13);
      this.zeroPad = B1view.getUint16(envOffset + 14);
    }
  }

  class ALKey {
    private __type: string = "ALKey";

    public velocityMin!: number;
    public velocityMax!: number;
    public keyMin!: number;
    public keyMax!: number;
    public keyBase!: number;
    public detune!: number;

    constructor(B1view: DataView, keymapOffset: number) {
      this._extract(B1view, keymapOffset);
    }

    _extract(B1view: DataView, keymapOffset: number) {
      this.velocityMin = B1view.getUint8(keymapOffset);
      this.velocityMax = B1view.getUint8(keymapOffset + 1);
      this.keyMin = B1view.getUint8(keymapOffset + 2);
      this.keyMax = B1view.getUint8(keymapOffset + 3);
      this.keyBase = B1view.getUint8(keymapOffset + 4);
      this.detune = B1view.getUint8(keymapOffset + 5);
    }
  }

  class ALWave {
    private __type: string = "ALWave";

    public waveBase!: number;
    public waveLen!: number;
    public type!: number;
    public flags!: number;
    public zeroes!: number;
    public loopOffset!: number;
    public predictorOffset!: number;

    constructor(B1view: DataView, waveOffset: number) {
      this._extract(B1view, waveOffset);
    }

    _extract(B1view: DataView, waveOffset: number) {
      this.waveBase = B1view.getUint32(waveOffset); // Offset into TBL
      this.waveLen = B1view.getUint32(waveOffset + 4);
      this.type = B1view.getUint8(waveOffset + 8); // ALWaveType
      this.flags = B1view.getUint8(waveOffset + 9);
      this.zeroes = B1view.getUint16(waveOffset + 10);
      this.loopOffset = B1view.getUint32(waveOffset + 12);
      this.predictorOffset = B1view.getUint32(waveOffset + 16);
    }
  }

  const ALWaveType = {
    AL_ADPCM_WAVE: 0,
    AL_RAW16_WAVE: 1,
    AL_VOX_WAVE: 2,
    AL_MUSYX_WAVE: 3,
    // AL_SIGNED_RAW8,
    // AL_SIGNED_RAW16
  };

  class ALADPCMLoop {
    private __type: string = "ALADPCMLoop";

    constructor(B1view: DataView, loopOffset: number) {
      this._extract(B1view, loopOffset);
    }

    _extract(B1view: DataView, loopOffset: number) {
      // TODO
    }
  }

  class ALADPCMBook {
    private __type: string = "ALADPCMBook";

    constructor(B1view: DataView, loopOffset: number) {
      this._extract(B1view, loopOffset);
    }

    _extract(B1view: DataView, loopOffset: number) {
      // TODO
    }
  }
}
