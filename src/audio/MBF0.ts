/**
 * MBF0 - Custom MIDI Bank Format
 */

// struct MBF0Header {
//   u32 magic; "MBF0"
//   u32 midi_count;
//   u32 zeroes;
//   u32 zeroes;
//   u16 mystery;
//   u16 mystery;
//   u16 mystery; // sample rate?
//   u16 mystery;
//   u16 mystery;
//   ... etc. total header size 0x40
//   MBF0TableEntry[midi_count];
//   u32 b1_offset;
//   u32 b1_length;
//   u32 tbl_offset;
//   u32 tbl_length;
//   // Followed by midi data
// }

// struct MBF0TableEntry {
//   u8 mystery; // boolean?
//   u8 mystery;
//   u8 soundbank_index;
//   u8 zero;
//   u32 0x07000000
//   u32 midi_offset; // from MBF0Header
//   u32 midi_length;
// }

import { B1 } from "./B1";

export class MBF0 {
  private __type: string = "MBF0";

  public midis: IMidiInfo[] = [];
  public tbl!: ArrayBuffer;
  public soundbanks!: B1;

  constructor(dataView: DataView) {
    if (dataView.getUint32(0) !== 0x4D424630) // "MBF0"
      throw new Error("MBF0 constructor encountered non-MBF0 structure");

    this._extract(dataView);
  }

  _extract(view: DataView) {
    const midiCount = view.getUint32(4);
    const tableEntriesOffset = 0x40;

    // Extract midi buffers
    for (let i = 0; i < midiCount; i++) {
      const midiOffset = view.getUint32(tableEntriesOffset + 8 + (i * 16));
      const midiSize = view.getUint32(tableEntriesOffset + 12 + (i * 16));

      this.midis.push({
        buffer: view.buffer.slice(
          view.byteOffset + midiOffset,
          view.byteOffset + midiOffset + midiSize
        ),
        soundbankIndex: view.getUint8(tableEntriesOffset + 2 + (i * 16))
      });
    }

    const extraOffsetsOffset = 0x40 + (16 * midiCount);
    const B1offset = view.getUint32(extraOffsetsOffset);
    const B1size = view.getUint32(extraOffsetsOffset + 4);
    const tblOffsetStart = view.getUint32(extraOffsetsOffset + 8);
    const tblOffsetEnd = tblOffsetStart + view.getUint32(extraOffsetsOffset + 12);

    // Extract tbl buffer
    this.tbl = view.buffer.slice(view.byteOffset + tblOffsetStart, view.byteOffset + tblOffsetEnd);

    // Extract B1 structure
    const B1view = new DataView(view.buffer, view.byteOffset + B1offset, B1size);
    this.soundbanks = new B1(B1view);
  }
}

interface IMidiInfo {
  buffer: ArrayBuffer;
  soundbankIndex: number;
}
