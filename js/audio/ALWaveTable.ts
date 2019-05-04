import { ALADPCMWaveInfo } from "./ALADPCMWaveInfo";
import { ALRAWWaveInfo } from "./ALRAWWaveInfo";

export class ALWaveTable {
  private __type: string = "ALWave";

  public waveBase!: number;
  public waveLen!: number;
  public type!: ALWaveType;
  public flags!: number;
  public zeroes!: number;
  public loopOffset!: number;
  public predictorOffset!: number;

  // Union
  public adpcmWave!: ALADPCMWaveInfo;
  public rawWave!: ALRAWWaveInfo;

  constructor(view: DataView, waveOffset: number) {
    this._extract(view, waveOffset);
  }

  _extract(view: DataView, waveOffset: number) {
    this.waveBase = view.getUint32(waveOffset); // Offset into TBL
    this.waveLen = view.getUint32(waveOffset + 4);
    this.type = view.getUint8(waveOffset + 8); // ALWaveType
    this.flags = view.getUint8(waveOffset + 9);

    if (this.type === ALWaveType.AL_ADPCM_WAVE) {
      this.adpcmWave = new ALADPCMWaveInfo(view, waveOffset + 12); // not 10?
    }
    else if (this.type === ALWaveType.AL_RAW16_WAVE) {
      this.rawWave = new ALRAWWaveInfo(view, waveOffset + 12);
    }
    else {
      throw new Error(`Unrecognized ALWaveTable type ${this.type}`);
    }
  }
}

export enum ALWaveType {
  AL_ADPCM_WAVE = 0,
  AL_RAW16_WAVE = 1,
  AL_VOX_WAVE = 2,
  AL_MUSYX_WAVE = 3,
  // AL_SIGNED_RAW8,
  // AL_SIGNED_RAW16
};
