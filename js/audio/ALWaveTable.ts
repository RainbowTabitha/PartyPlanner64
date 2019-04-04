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

  constructor(B1view: DataView, waveOffset: number) {
    this._extract(B1view, waveOffset);
  }

  _extract(B1view: DataView, waveOffset: number) {
    this.waveBase = B1view.getUint32(waveOffset); // Offset into TBL
    this.waveLen = B1view.getUint32(waveOffset + 4);
    this.type = B1view.getUint8(waveOffset + 8); // ALWaveType
    this.flags = B1view.getUint8(waveOffset + 9);

    if (this.type === ALWaveType.AL_ADPCM_WAVE) {
      this.adpcmWave = new ALADPCMWaveInfo(B1view, waveOffset + 10)
    }
    else if (this.type === ALWaveType.AL_RAW16_WAVE) {
      this.rawWave = new ALRAWWaveInfo(B1view, waveOffset + 10)
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
