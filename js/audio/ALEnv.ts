export class ALEnv {
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