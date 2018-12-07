import { createEvent, IEventParseInfo, IEvent, IEventWriteInfo } from "../events";
import { EventActivationType, EventExecutionType, Game } from "../../types";
import { hashEqual, copyRange } from "../../utils/arrays";
import { prepAsm } from "../prepAsm";
import { assemble } from "mips-assembler";

export const Boo1Event = createEvent("BOO1", "Visit Boo");
Boo1Event.activationType = EventActivationType.WALKOVER;
Boo1Event.executionType = EventExecutionType.DIRECT;
Boo1Event.fakeEvent = true;
Boo1Event.supportedGames = [
  Game.MP1_USA
];
Boo1Event.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // Single Boo hashes
    PLAYER_DIRECTION_CHANGE: "DAD5E635FE90ED982D02B3F1D5C0CE21", // +0x14
    METHOD_END: "FF104A680C0ECE615B5A24AD95A908CC", // [0x1C/0x54]+0x18

    // DK specific method
    DK_TWOBOO_METHOD_START: "94A87B51D2478E81AAC34F7D3C5C37F2", // +0x28
  };

  if (hashEqual([dataView.buffer, info.offset + 0x1C, 0x18], hashes.METHOD_END) &&
      hashEqual([dataView.buffer, info.offset, 0x14], hashes.PLAYER_DIRECTION_CHANGE)) {
    // Check whether this points to the Boo scene.
    let sceneNum = dataView.getUint16(info.offset + 0x1A);
    return sceneNum === 0x65;
  }
  else if (hashEqual([dataView.buffer, info.offset + 0x54, 0x18], hashes.METHOD_END) &&
      hashEqual([dataView.buffer, info.offset, 0x28], hashes.DK_TWOBOO_METHOD_START)) {
    return true; // We know this is stock DK board.
  }

  return false;
};
Boo1Event.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const asm = prepAsm(`
    addiu SP, SP, -0x18
    sw    RA, 0x10(SP)

    ; TODO: Face player towards Boo
    ;jal   GetCurrentSpaceIndex
    ;NOP
    ;sll   V0, V0, 0x10
    ;sra   V1, V0, 0x10
    ;addiu    V0, R0, 10 ; bottom left boo invisible space index
    ;beq   V1, V0, boo_space_event_passing_bottom_boo
    ;addiu    V0, R0, 129 ; upper middle boo invisible space index
    ;bne   V1, V0, boo_space_event_goto_boo_scene
    ;addiu    A0, R0, 101 ; Boo overlay index
    ;addiu    A0, R0, -1
    ;addiu    A1, R0, 8
    ;j     L800F97E0
    ;addiu    A2, R0, 111 ; upper middle boo standing space index
  ;boo_space_event_passing_bottom_boo:
    ;addiu    A0, R0, -1
    ;addiu    A1, R0, 8
    ;addiu    A2, R0, 98 ; bottom left boo standing space index
  ;L800F97E0:
    ;jal   0x8004D2A4
    ;NOP

    addiu A0, R0, 101 ; Boo overlay index
  boo_space_event_goto_boo_scene:
    addu  A1, R0, R0
    jal   0x800587EC  ; 0x800587BC wrapper, A3 = 0 default
    addiu A2, R0, 1
    lw    RA, 0x10(SP)
    jr    RA
    addiu SP, SP, 0x18
`, undefined, info);
  const bytes = assemble(asm) as ArrayBuffer;
  copyRange(dataView, bytes, 0, 0, bytes.byteLength);
  return [info.offset, bytes.byteLength];
};