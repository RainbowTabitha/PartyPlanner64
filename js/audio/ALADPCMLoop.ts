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
    this.state = [];
    for (let i = 0; i < 0x10; i++) {
      this.state[i] = B1view.getUint16(loopOffset + 12 + (i * 2));
    }
  }
}

type ADPCM_STATE = number[]; // u16[16]