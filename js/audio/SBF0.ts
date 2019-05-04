import { ALSoundSimple } from "./ALSoundSimple";

/**
 * SBF0 - Custom Sound Effects Format
 */

// struct SBF0Header {
//   u32 magic; "SBF0"
//   u32 midi_count;
//   u32 zeroes;
//   u32 zeroes;
//   u16 mystery;
//   u16 mystery;
//   u16 mystery; // sample rate?
//   u16 mystery;
//   u16 mystery;
//   ... more fields
//   0x44: u32 sound_count;
//   0x54: u32 tbl_offset;
//   0x58: u32 tbl_length;
//   ... more fields
//   0x70: u32 ?;
//   SBF0TableEntry[sound_count];
//   TBL

// TODO: There is more, for example at 0x1EEA64C another table starts.
// }

// struct SBF0TableEntry {
//   u32 env_offset;
//   u32 sample_rate;
//   u32 wave_offset
//   u8 sample_pan;
//   u8 sample_volume;
//   u8 flags;
//   u8 _zero;
// }

export class SBF0 {
  private __type: string = "SBF0";

  public tbl!: ArrayBuffer;
  public sounds: ALSoundSimple[] = [];

  constructor(dataView: DataView) {
    if (dataView.getUint32(0) !== 0x53424630) // "SBF0"
      throw "SBF0 constructor encountered non-SBF0 structure";

    this._extract(dataView);
  }

  _extract(view: DataView) {
    const soundCount = view.getUint32(0x44);
    const tableEntriesOffset = 0x74;

    if (soundCount === 0) {
      throw new Error("Does soundCount === 0?");
    }

    // Extract sounds
    const ctlView = new DataView(view.buffer, view.byteOffset + tableEntriesOffset);
    for (let i = 0; i < soundCount; i++) {
      this.sounds.push(new ALSoundSimple(ctlView, i * 16));
    }

    const tblOffsetStart = view.getUint32(0x54);
    const tblOffsetEnd = tblOffsetStart + view.getUint32(0x58);

    // Extract tbl buffer
    this.tbl = view.buffer.slice(view.byteOffset + tblOffsetStart, view.byteOffset + tblOffsetEnd);
  }
}
