export class ALKeyMap {
  private __type = "ALKey";

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
    this.detune = B1view.getInt8(keymapOffset + 5);
  }
}
