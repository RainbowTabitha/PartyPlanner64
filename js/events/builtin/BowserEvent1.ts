import { createEvent, IEventParseInfo, IEvent, IEventWriteInfo } from "../events";
import { EventActivationType, EventExecutionType, Game } from "../../types";
import { hashEqual, copyRange } from "../../utils/arrays";
import { prepAsm } from "../prepAsm";
import { assemble } from "mips-assembler";

const Bowser = createEvent("BOWSER", "Visit Bowser");
Bowser.activationType = EventActivationType.WALKOVER;
Bowser.executionType = EventExecutionType.DIRECT;
Bowser.supportedGames = [
  Game.MP1_USA
];
Bowser.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    PLAYER_DIRECTION_CHANGE: "DAD5E635FE90ED982D02B3F1D5C0CE21", // +0x14
    METHOD_END: "8A835D982BE35F1804E9ABD65C5699F4" // [0x1C]+0x1C
  };

  if (hashEqual([dataView.buffer, info.offset, 0x14], hashes.PLAYER_DIRECTION_CHANGE) &&
      hashEqual([dataView.buffer, info.offset + 0x1C, 0x1C], hashes.METHOD_END)) {
    // Check whether this points to any of the Bowser scenes.
    let sceneNum = dataView.getUint16(info.offset + 0x1A);
    let isBowserScene = [0x48, 0x49, 0x4F, 0x53, 0x54, 0x5B, 0x5D].indexOf(sceneNum) !== -1;
    return isBowserScene;
  }

  return false;
};
Bowser.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  // Any of these "work" but only the corresponding one has the right background.
  let bowserSceneNum = [0x48, 0x49, 0x4F, 0x53, 0x54, 0x5B, 0x5D][info.boardIndex];

  const asm = prepAsm(`
    addiu SP, SP, -0x18
    sw    RA, 0x10(SP)

    ; TODO: Turn player towards bowser
    ;addiu A0, R0, -1 ; current player
    ;addiu A1, R0, 8
    ;jal   0x8004D2A4
    ;addiu A2, R0, BOWSER_STANDING_SPACE_INDEX

    addiu A0, R0, ${bowserSceneNum}
    addu  A1, R0, R0
    addiu A2, R0, 3
    jal   0x800587BC
    addiu A3, R0, 1

    lw    RA, 0x10(SP)
    jr    RA
    addiu SP, SP, 0x18
`, undefined, info);
  const bytes = assemble(asm) as ArrayBuffer;
  copyRange(dataView, bytes, 0, 0, bytes.byteLength);
  return [info.offset, bytes.byteLength];
};