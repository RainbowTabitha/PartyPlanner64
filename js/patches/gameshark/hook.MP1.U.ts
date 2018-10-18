namespace PP64.patches.gameshark.hook {

  // Installs a Gameshark hook for MP1 (U)
  export const MP1U = new class MP1U extends PP64.patches.gameshark.HookBase {
    // File to store the cheat routine.
    protected MAINFS_CHEAT_FILE = [0, 137];

    // Location safe to write a small set of hooking code
    protected HOOK_ROM_START_OFFSET = 0xCB500;
    protected HOOK_RAM_START_OFFSET = 0xCA900;

    // Use controller routine 0x80013E74 (ROM 0x14A74) to reach the hook
    protected HOOK_JUMP_ROM_OFFSET = 0x14A74; // 0x80013E74

    // Value initially in the spot we cache the hook routine.
    protected HOOK_CACHE_DEFAULT_VALUE = 0x76657221;

    apply(romBuffer: ArrayBuffer) {
      const romView = new DataView(romBuffer);

      this.applyHook(romView);
      this.writeHookCode(romView);
    }

    applyHook(romView: DataView) {
      // Jump out from the controller routine to a small fixed position hook.
      // This hook will read the cheat buffer (if not already read) and jump to it.

      const hookJ = (window as any).MIPSInst.parse(`J ${this.HOOK_RAM_START_OFFSET + 4}`);

      // Remember the stack adjustment, and NOP it out here.
      const endInsts = [
        romView.getUint32(this.HOOK_JUMP_ROM_OFFSET),
        romView.getUint32(this.HOOK_JUMP_ROM_OFFSET + 4),
        romView.getUint32(this.HOOK_JUMP_ROM_OFFSET + 8),
        romView.getUint32(this.HOOK_JUMP_ROM_OFFSET + 12),
      ];
      romView.setUint32(this.HOOK_JUMP_ROM_OFFSET, hookJ);
      romView.setUint32(this.HOOK_JUMP_ROM_OFFSET + 4, 0);
      romView.setUint32(this.HOOK_JUMP_ROM_OFFSET + 8, 0);
      romView.setUint32(this.HOOK_JUMP_ROM_OFFSET + 12, 0);

      const cheatRoutine = PP64.patches.gameshark.getCheatRoutineBuffer({ endInsts });
      PP64.fs.mainfs.write(this.MAINFS_CHEAT_FILE[0], this.MAINFS_CHEAT_FILE[1], cheatRoutine);
    }
  }
}