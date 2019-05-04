import { ALADPCMLoop } from "./ALADPCMLoop";
import { ALADPCMBook } from "./ALADPCMBook";

export class ALADPCMWaveInfo {
  private __type: string = "ALADPCMWaveInfo";

  public loop: ALADPCMLoop | null = null;
  public book: ALADPCMBook | null = null;

  constructor(view: DataView, offset: number) {
    this._extract(view, offset);
  }

  _extract(view: DataView, offset: number) {
    const loopOffset = view.getUint32(offset);
    if (loopOffset !== 0) {
      this.loop = new ALADPCMLoop(view, loopOffset);
    }

    const bookOffset = view.getUint32(offset + 4);
    if (bookOffset !== 0) {
      this.book = new ALADPCMBook(view, bookOffset);
    }
  }
}