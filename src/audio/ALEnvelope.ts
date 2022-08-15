export class ALEnvelope {
  private __type: string = "ALEnv";

  private __smallVolumes?: boolean;
  public attackTime!: number;
  public decayTime!: number;
  public releaseTime!: number;
  public attackVolume!: number;
  public decayVolume!: number;
  public zeroPad!: number;

  constructor(B1view: DataView, envOffset: number, smallVolumes?: boolean) {
    this.__smallVolumes = smallVolumes;
    this._extract(B1view, envOffset);
  }

  _extract(B1view: DataView, envOffset: number) {
    this.attackTime = B1view.getInt32(envOffset);
    this.decayTime = B1view.getInt32(envOffset + 4);
    this.releaseTime = B1view.getInt32(envOffset + 8);
    if (this.__smallVolumes) {
      // MP2/3
      this.attackVolume = B1view.getUint8(envOffset + 12);
      this.decayVolume = B1view.getUint8(envOffset + 13);
    } else {
      this.attackVolume = B1view.getInt16(envOffset + 12);
      this.decayVolume = B1view.getInt16(envOffset + 14);
    }
  }
}
