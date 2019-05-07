import { ALSoundSimple } from "./ALSoundSimple";
import { $$hex, $$log } from "../utils/debug";

/**
 * T3 - Custom Sound Effects Format
 */

// struct T3Header {
//   u16 magic; "T3"
//   u16 soundfx_count;
//   T3SfxTableEntry[soundfx_count];
//   u32 zeroes;
//   u32 raw_count;
//   u32 unknown;
//   u32 tbl_offset; // Relative to T3RawTableEntry[] below
//   u32 unknown;
//   u32 tbl_length;
//   u32 unknown;
//   u32 * 4 unknown
//   T3RawTableEntry[raw_count];
//   TBL

// }

// struct T3SfxTableEntry {
//   u4 unknown;
//   u12 unknown; // Seems like this could almost be sound index too at times.
//   s16 unknown;
//   u4 unknown;
//   u12 raw_sound_index;
//   u16 sample_rate;
// }

// struct T3RawTableEntry {
//   u32 env_offset;
//   u32 zeroes;
//   u32 wave_offset
//   u8 sample_pan;
//   u8 sample_volume;
//   u8 flags;
//   u8 _zero;
// }


export class T3 {
  private __type: string = "T3";

  public tbl!: ArrayBuffer;
  public sounds: ALSoundSimple[] = [];

  constructor(dataView: DataView) {
    if (dataView.getUint16(0) !== 0x5433) // "T3"
      throw "T3 constructor encountered non-T3 structure";

    this._extract(dataView);
  }

  _extract(view: DataView) {
    const soundFxCount = view.getUint16(2);

    // Get metadata about each sound effect. Right now, we just need the sample rate really.
    const soundEffectMetadata: any[] = [];
    for (let i = 0; i < soundFxCount; i++) {
      soundEffectMetadata.push({
        rawSound: view.getUint16(4 + (i * 8) + 4) & 0x0FFF,
        //rawSound: view.getUint16(4 + (i * 8)) & 0x0FFF,
        sampleRate: view.getUint16(4 + (i * 8) + 6)
      });
    }

    // Extract raw sounds
    const rawSoundCount = view.getUint32(4 + (soundFxCount * 8) + 4);
    const tableEntriesOffset = 4 + (soundFxCount * 8) + 0x2C;
    const ctlView = new DataView(view.buffer, view.byteOffset + tableEntriesOffset);
    for (let i = 0; i < rawSoundCount; i++) {
      const sound = new ALSoundSimple(ctlView, i * 16);

      for (const sfxmetadata of soundEffectMetadata) {
        if (sfxmetadata.rawSound === i) {
          sound.sampleRate = sfxmetadata.sampleRate;
          break;
        }
      }
      if (!sound.sampleRate) {
        console.warn(`Unknown sample rate for raw sound ${i}, guessing...`);
        sound.sampleRate = 0x5622;
      }

      this.sounds.push(sound);
    }
    console.log(this.sounds);

    const tblOffsetStart = view.getUint32(4 + (soundFxCount * 8) + 0xC);
    const tblOffsetEnd = tblOffsetStart + view.getUint32(4 + (soundFxCount * 8) + 0x14);

    // Extract tbl buffer
    this.tbl = view.buffer.slice(view.byteOffset + tblOffsetStart, view.byteOffset + tblOffsetEnd);

    // Extract the sound effects list.
    // This list count is higher than the actual raw sound count,
    // presumably because some entries use the same raw data.
    // if ($$debug) {
    //   let details = ""; // This is just a temporary info extraction thing...
    //   const soundFxCount = view.getUint32(4);
    //   const soundFxListOffset = tblOffsetEnd;
    //   for (let i = 0; i < soundFxCount; i++) {
    //     const offset = view.getUint32(soundFxListOffset + (i * 4));

    //     const subcount = view.getUint8(soundFxListOffset + offset);
    //     const substructstart = soundFxListOffset + offset + 8;
    //     for (let s = 0; s < subcount; s++) {
    //       const soundFxInfoOffset = view.getUint32(substructstart + (s * 8) + 4);

    //       let rawSoundIndex: number;
    //       const soundFxInfoType = view.getUint8(soundFxListOffset + soundFxInfoOffset);
    //       switch (soundFxInfoType) {
    //         case 0x92:
    //         case 0x93:
    //           rawSoundIndex = view.getUint16(soundFxListOffset + soundFxInfoOffset + 1);
    //           break;
    //         case 0x12:
    //         case 0x13:
    //           rawSoundIndex = view.getUint16(soundFxListOffset + soundFxInfoOffset + 2);
    //           break;
    //         case 0x01:
    //         case 0xA0:
    //           continue;
    //           break;
    //         default:
    //           throw new Error("Unrecongized soundFxInfoType " + $$hex(soundFxInfoType)
    //             + " at " + $$hex(view.byteOffset + soundFxListOffset + soundFxInfoOffset));
    //       }
    //       details += `\n${$$hex(i)}: ${$$hex(rawSoundIndex)}`;
    //     }
    //   }
    //   $$log(details);
    // }
  }
}
