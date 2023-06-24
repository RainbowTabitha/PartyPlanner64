export class ALRawLoop {
  private __type = "ALRAWWaveInfo";

  public start!: number;
  public end!: number;
  public count!: number;

  constructor(B1view: DataView, offset: number) {
    this._extract(B1view, offset);
  }

  _extract(B1view: DataView, offset: number) {
    this.start = B1view.getUint32(offset);
    this.end = B1view.getUint32(offset + 4);
    this.count = B1view.getUint32(offset + 8);
  }
}
