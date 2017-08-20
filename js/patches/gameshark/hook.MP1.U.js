PP64.ns("patches.gameshark.hook");

// Installs a Gameshark hook for MP1 (U)
PP64.patches.gameshark.hook.MP1U = class MP1UHook {
  static apply(romBuffer) {
    const MAINFS_CHEAT_FILE = [0, 137]; // File to store the cheat routine.

    const romView = new DataView(romBuffer);

    // Jump out from the controller routine to a small fixed position hook.
    // This hook will read the cheat buffer (if not already read) and jump to it.
    let hookRomStartOffset = 0xCB500;
    let hookRamStartOffset = 0xCA900;

    // Use controller routine 0x80013E74 (ROM 0x14A74) to reach the hook
    const hookJumpRomOffset = 0x14A74; // 0x80013E74

    let hookJ = MIPSInst.parse(`J ${hookRamStartOffset + 4}`);

    // Remember the stack adjustment, and NOP it out here.
    const endInsts = [
      romView.getUint32(hookJumpRomOffset),
      romView.getUint32(hookJumpRomOffset + 4),
      romView.getUint32(hookJumpRomOffset + 8),
      romView.getUint32(hookJumpRomOffset + 12),
    ];
    romView.setUint32(hookJumpRomOffset, hookJ);
    romView.setUint32(hookJumpRomOffset + 4, 0);
    romView.setUint32(hookJumpRomOffset + 8, 0);
    romView.setUint32(hookJumpRomOffset + 12, 0);

    const cheatRoutine = PP64.patches.gameshark.getCheatRoutineBuffer({ endInsts });
    PP64.fs.mainfs.write(MAINFS_CHEAT_FILE[0], MAINFS_CHEAT_FILE[1], cheatRoutine);

    // The first 4 bytes will be reserved to store the pointer to the cheat routine,
    // so we can remember where it is for subsequent frames.
    // The hook will immediately follow.
    let offset = hookRomStartOffset + 4;

    // T9 = saved off V0 value
    // A1 = address of cheat routine (either due to reading from cached location, or from the heap call)
    // A2 = "ver!" constant that is initially in RAM

    // Read the cached cheat routine address
    const cachedReadLocs = $MIPS.getRegSetUpperAndLower(hookRamStartOffset);
    romView.setUint32(offset, MIPSInst.parse(`LUI A1 ${0x8000 | cachedReadLocs[0]}`)); // A1 = 0x800C
    romView.setUint32(offset += 4, MIPSInst.parse(`ADDIU A1 A1 ${cachedReadLocs[1]}`)); // A1 = 0x800CA900
    romView.setUint32(offset += 4, MIPSInst.parse("LW A1 0(A1)"));

    // Check if the cached cheat routine address is legit. If not, this is the first execution and we need to get it
    romView.setUint32(offset += 4, MIPSInst.parse("LUI A2 0x7665")); // A2 = 0x76650000 "ve"
    romView.setUint32(offset += 4, MIPSInst.parse("ADDIU A2 A2 0x7221")); // A2 = 0x76657221 "ver!"
    romView.setUint32(offset += 4, MIPSInst.parse(`BNE A1 A2 9`)); // Jump to the JR A1

    // Prep to call mainfs read
    // Should save off V0, because it has the return for the controller routine.
    romView.setUint32(offset += 4, MIPSInst.parse("ADDU T9 V0 R0")); // T9 <= V0

    // Read from MainFS if we don't have cheat buffer (only happens once)
    romView.setUint32(offset += 4, MIPSInst.parse(`LUI A0 ${MAINFS_CHEAT_FILE[0]}`)); // A0 <= [The dir index]xxxx
    romView.setUint32(offset += 4, MIPSInst.parse(`JAL ${PP64.adapters.MP1.MAINFS_READ_ADDR}`)); // JAL MainFSRead
    romView.setUint32(offset += 4, MIPSInst.parse(`ADDIU A0 A0 ${MAINFS_CHEAT_FILE[1]}`)); // A0 = [dir index][file index]

    // Cache off the cheat location
    romView.setUint32(offset += 4, MIPSInst.parse(`LUI A1 ${0x8000 | cachedReadLocs[0]}`)); // A1 = 0x800C
    romView.setUint32(offset += 4, MIPSInst.parse(`ADDIU A1 A1 ${cachedReadLocs[1]}`)); // A1 = 0x800CA900
    romView.setUint32(offset += 4, MIPSInst.parse("SW V0 0(A1)"));
    romView.setUint32(offset += 4, MIPSInst.parse("ADDU A1 V0 R0")); // A1 <= V0

    // Post-JAL cleanup, restore V0
    romView.setUint32(offset += 4, MIPSInst.parse("ADDU V0 T9 R0")); // V0 <= T9

    // A1 has the location of the cheat routine... jump to it!
    romView.setUint32(offset += 4, MIPSInst.parse("JR A1"));
    romView.setUint32(offset += 4, 0); // NOP
  }
}
