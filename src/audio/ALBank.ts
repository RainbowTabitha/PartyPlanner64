import { ALInst } from "./ALInst";

export class ALBank {
  private __type: string = "ALBank";

  public flags!: number;
  public pad!: number;
  public sampleRate!: number;
  public instruments: ALInst[] = [];

  constructor(B1view: DataView, bankOffset: number) {
    this._extract(B1view, bankOffset);
  }

  _extract(B1view: DataView, bankOffset: number) {
    this.flags = B1view.getUint8(bankOffset + 2);
    this.pad = B1view.getUint8(bankOffset + 3);
    this.sampleRate = B1view.getInt32(bankOffset + 4);

    let percussionOffset = B1view.getUint32(bankOffset + 8);
    if (percussionOffset)
      throw new Error(
        `Need to parse percussion at bank offset 0x${(
          B1view.byteOffset + bankOffset
        ).toString(16)}`
      );

    let instrumentCount = B1view.getUint16(bankOffset);
    for (let i = 0; i < instrumentCount; i++) {
      let instrumentOffset = B1view.getUint32(bankOffset + 12 + i * 4);
      this.instruments.push(new ALInst(B1view, instrumentOffset));
    }
  }
}
