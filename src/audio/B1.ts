import { ALBank } from "./ALBank";

/** ALBankFile */
export class B1 {
  private __type: string = "B1";

  public banks: ALBank[] = [];

  constructor(dataView: DataView) {
    if (dataView.getUint16(0) !== 0x4231) // "B1"
      throw new Error("B1 constructor encountered non-B1 structure");

    this._extract(dataView);
  }

  _extract(view: DataView) {
    let bankCount = view.getUint16(2);
    for (let i = 0; i < bankCount; i++) {
      let bankOffset = view.getUint32(4 + (i * 4));
      this.banks.push(new ALBank(view, bankOffset));
    }
  }
}
