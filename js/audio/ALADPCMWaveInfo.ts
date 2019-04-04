import { ALADPCMLoop } from "./ALADPCMLoop";
import { ALADPCMBook } from "./ALADPCMBook";

export class ALADPCMWaveInfo {
  private __type: string = "ALADPCMWaveInfo";

  public loop: ALADPCMLoop | null = null;
  public book: ALADPCMBook | null = null;

  constructor(B1view: DataView, offset: number) {
    this._extract(B1view, offset);
  }

  _extract(B1view: DataView, offset: number) {
    const loopOffset = B1view.getUint32(offset);
    if (loopOffset !== 0) {
      this.loop = new ALADPCMLoop(B1view, loopOffset);
    }

    const bookOffset = B1view.getUint32(offset + 4);
    if (bookOffset !== 0) {
      this.book = new ALADPCMBook(B1view, bookOffset);
    }
  }
}