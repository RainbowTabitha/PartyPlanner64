import { ALADPCMLoop } from "./ALADPCMLoop";
import { ALADPCMBook } from "./ALADPCMBook";

export class ALADPCMWaveInfo {
  private __type: string = "ALADPCMWaveInfo";

  public loop!: ALADPCMLoop;
  public book!: ALADPCMBook;

  constructor(B1view: DataView, offset: number) {
    this._extract(B1view, offset);
  }

  _extract(B1view: DataView, offset: number) {
    const loopOffset = B1view.getUint32(offset);
    this.loop = new ALADPCMLoop(B1view, loopOffset);

    const bookOffset = B1view.getUint32(offset + 4);
    this.book = new ALADPCMBook(B1view, bookOffset);
  }
}