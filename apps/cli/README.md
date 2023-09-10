# ![PartyPlanner64](http://i.imgur.com/ygEasfG.png)

> Mario Party N64 board editor - command line interface

PartyPlanner64 allows players to create and import customized boards into a Mario Party N64 ROM for playback in emulators or on real hardware.

This is the **command line interface** provided for advanced use cases.

## Commands

### `overwrite`

Writes a custom board file onto a ROM, overwriting an existing board on the ROM.

Options:

- `--rom-file <path>`: Path to a stock Mario Party ROM. Often a `.z64` file.
- `--target-board-index <int>`: The index of the board to overwrite (0-based). For example, pass `0` to overwrite DK Jungle Adventure in Mario Party 1 (the first board in that game).
- `--board-file <path>`: Path to a custom board JSON file.
- `--output-file <path>`: ROM file path to be created by the operation. The input ROM file is not modified; instead, a new ROM is written to this path.

Example:

```
partyplanner64-cli-win.exe overwrite --rom-file "C:\MarioParty.z64" --target-board-index 0 --board-file "C:\board.json" --output-file "C:\MyMarioPartyCLI.z64"
```
