export class ALADPCMLoop {
  private __type: string = "ALADPCMLoop";

  public start!: number;
  public end!: number;
  public count!: number;
  public state!: ADPCM_STATE;

  constructor(B1view: DataView, loopOffset: number) {
    this._extract(B1view, loopOffset);
  }

  _extract(B1view: DataView, loopOffset: number) {
    this.start = B1view.getUint32(loopOffset);
    this.end = B1view.getUint32(loopOffset + 4);
    this.count = B1view.getUint32(loopOffset + 8);
    this.state = B1view.getUint32(loopOffset + 12);
    // TODO: How big is state?
  }
}

export enum ADPCM_STATE {

}