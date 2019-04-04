export class ALADPCMBook {
  private __type: string = "ALADPCMBook";

  public order!: number;
  public npredictors!: number;
  public book!: number[];

  constructor(B1view: DataView, offset: number) {
    this._extract(B1view, offset);
  }

  _extract(B1view: DataView, offset: number) {
    this.order = B1view.getInt32(offset);
    this.npredictors = B1view.getInt32(offset + 4);

    // TODO: How big is book? npredictors?
  }
}