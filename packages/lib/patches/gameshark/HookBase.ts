import { getRegSetUpperAndLower } from "../../utils/MIPS";
import { parse } from "mips-inst";
import { getROMAdapter } from "../../adapter/adapters";

export abstract class HookBase {
  protected abstract HOOK_RAM_START_OFFSET: number;
  protected abstract HOOK_ROM_START_OFFSET: number;
  protected abstract HOOK_CACHE_DEFAULT_VALUE: number;
  protected abstract MAINFS_CHEAT_FILE: number[];
  protected abstract HOOK_JUMP_ROM_OFFSET: number;

  apply(romBuffer: ArrayBuffer) {
    throw new Error("apply not implemented, is that OK?");
  }

  writeHookCode(romView: DataView) {
    const adapter = getROMAdapter({});
    const MAINFS_READ_ADDR = adapter && adapter.MAINFS_READ_ADDR;
    if (!MAINFS_READ_ADDR) {
      throw new Error(
        "Cheats were being applied, but the ROM adapter had no MAINFS_READ_ADDR"
      );
    }

    // The first 4 bytes will be reserved to store the pointer to the cheat routine,
    // so we can remember where it is for subsequent frames.
    // The hook will immediately follow.
    let offset = this.HOOK_ROM_START_OFFSET + 4;

    // T9 = saved off V0 value
    // S7 = saved off RA value
    // A1 = address of cheat routine (either due to reading from cached location, or from the heap call)
    // A2 = "ver!" constant that is initially in RAM

    // Read the cached cheat routine address
    const cachedReadLocs = getRegSetUpperAndLower(this.HOOK_RAM_START_OFFSET);
    romView.setUint32(offset, parse(`LUI A1 ${0x8000 | cachedReadLocs[0]}`)); // A1 = 0x800C
    romView.setUint32((offset += 4), parse(`ADDIU A1 A1 ${cachedReadLocs[1]}`)); // A1 = 0x800CA900
    romView.setUint32((offset += 4), parse("LW A1 0(A1)"));

    // Check if the cached cheat routine address is legit. If not, this is the first execution and we need to get it
    romView.setUint32(
      (offset += 4),
      parse(`LUI A2 ${this.HOOK_CACHE_DEFAULT_VALUE >>> 16}`)
    ); // A2 = 0x76650000 "ve"
    romView.setUint32(
      (offset += 4),
      parse(`ADDIU A2 A2 ${this.HOOK_CACHE_DEFAULT_VALUE & 0xffff}`)
    ); // A2 = 0x76657221 "ver!"
    romView.setUint32((offset += 4), parse(`BNE A1 A2 11`)); // Jump to the JR A1

    // Prep to call mainfs read
    // Should save off V0 and RA, because they are needed to leave the controller routine properly.
    romView.setUint32((offset += 4), parse("ADDU T9 V0 R0")); // T9 <= V0
    romView.setUint32((offset += 4), parse("ADDU S7 RA R0")); // S7 <= RA

    // Read from MainFS if we don't have cheat buffer (only happens once)
    romView.setUint32(
      (offset += 4),
      parse(`LUI A0 ${this.MAINFS_CHEAT_FILE[0]}`)
    ); // A0 <= [The dir index]xxxx
    romView.setUint32((offset += 4), parse(`JAL ${MAINFS_READ_ADDR}`));
    romView.setUint32(
      (offset += 4),
      parse(`ADDIU A0 A0 ${this.MAINFS_CHEAT_FILE[1]}`)
    ); // A0 = [dir index][file index]

    // Cache off the cheat location
    romView.setUint32(
      (offset += 4),
      parse(`LUI A1 ${0x8000 | cachedReadLocs[0]}`)
    ); // A1 = 0x800C
    romView.setUint32((offset += 4), parse(`ADDIU A1 A1 ${cachedReadLocs[1]}`)); // A1 = 0x800CA900
    romView.setUint32((offset += 4), parse("SW V0 0(A1)"));
    romView.setUint32((offset += 4), parse("ADDU A1 V0 R0")); // A1 <= V0

    // Post-JAL cleanup, restore cached regs
    romView.setUint32((offset += 4), parse("ADDU V0 T9 R0")); // V0 <= T9
    romView.setUint32((offset += 4), parse("ADDU RA S7 R0")); // RA <= S7

    // A1 has the location of the cheat routine... jump to it!
    romView.setUint32((offset += 4), parse("JR A1"));
    romView.setUint32((offset += 4), 0); // NOP
  }
}
