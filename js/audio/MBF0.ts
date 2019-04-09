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