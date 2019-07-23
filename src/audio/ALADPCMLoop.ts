export class ALADPCMLoop {
  private __type: string = "ALADPCMLoop";

  public start!: number;
  public end!: number;
  public count!: number;
  public state!: ADPCM_STATE;

  constructor(view: DataView, loopOffset: number) {
    this._extract(view, loopOffset);
  }

  _extract(view: DataView, loopOffset: number) {
    this.start = view.getUint32(loopOffset);
    this.end = view.getUint32(loopOffset + 4);
    this.count = view.getUint32(loopOffset + 8);
    this.state = [];
    for (let i = 0; i < 0x10; i++) {
      this.state[i] = view.getUint16(loopOffset + 12 + (i * 2));
    }
  }
}

type ADPCM_STATE = number[]; // u16[16]