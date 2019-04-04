export class ALWave {
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

export const ALWaveType = {
  AL_ADPCM_WAVE: 0,
  AL_RAW16_WAVE: 1,
  AL_VOX_WAVE: 2,
  AL_MUSYX_WAVE: 3,
  // AL_SIGNED_RAW8,
  // AL_SIGNED_RAW16
};
