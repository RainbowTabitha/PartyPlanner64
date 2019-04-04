import { B1 } from "./B1";

export class S2 {
  private __type: string = "S2";

  public midis: any[] = [];
  public tbl!: ArrayBuffer;
  public soundbanks!: B1;

  constructor(dataView: DataView) {
    if (dataView.getUint16(0) !== 0x5332) // "S2"
      throw "S2 constructor encountered non-S2 structure";

    this._extract(dataView);
  }

  _extract(view: DataView) {
    let midiCount = view.getUint16(2);
    let extendedS2TableOffset = 4 + (midiCount * 8);

    // Extract midi buffers
    for (let i = 0; i < midiCount; i++) {
      let midiOffset = view.getUint32(4 + (i * 4 * 2));
      let midiSize = view.getUint32(8 + (i * 4 * 2));

      let midiStart = view.byteOffset + midiOffset;
      this.midis.push({
        buffer: view.buffer.slice(midiStart, midiStart + midiSize),
        soundbankIndex: view.getUint8(extendedS2TableOffset + (i * 16))
      });
    }

    // Extract tbl buffer
    // Assumption: we know where it begins, and will assume it ends at the first midi offset.
    let tblOffsetStart = view.getUint32(extendedS2TableOffset + 12);
    let tblOffsetEnd = view.getUint32(4); // First midi offset
    this.tbl = view.buffer.slice(view.byteOffset + tblOffsetStart, view.byteOffset + tblOffsetEnd);

    // Extract B1 structure
    // Assumption: extra S2 table entries all point to same B1
    let B1offset = view.getUint32(extendedS2TableOffset + 4);
    let B1view = new DataView(view.buffer, view.byteOffset + B1offset);
    this.soundbanks = new B1(B1view);
  }
}
