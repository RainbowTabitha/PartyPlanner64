import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, EventExecutionType, Game, EventParameterType } from "../../../../types";
import { hashEqual, copyRange } from "../../../../utils/arrays";
import { ISpaceEvent } from "../../../../boards";
import { ChainSplit3 } from "./ChainSplit3";
import { addEventToLibrary } from "../../../EventLibrary";

// When going in reverse, there can be splits where there otherwise was only
// chain merges going forward. The game basically wraps a chain split with a
// small function that checks if the player is going in reverse.
export const ReverseChainSplit: IEvent = {
  id: "REVERSECHAINSPLIT",
  name: "",
  fakeEvent: true,
  parameters: [
    { name: "spaceIndexArgs", type: EventParameterType.NumberArray, },
    { name: "chainArgs", type: EventParameterType.NumberArray, }
  ],
  activationType: EventActivationType.WALKOVER,
  executionType: EventExecutionType.DIRECT, // Notable difference
  supportedGames: [
    Game.MP3_USA,
  ],
  parse(dataView: DataView, info: IEventParseInfo) {
    let hashes = {
      REVERSE_FILTER: "0909C95D982B8A9B1F096AC54FFFB816"
    };

    if (!hashEqual([dataView.buffer, info.offset, 0x30], hashes.REVERSE_FILTER))
      return false;

    return true;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    // Basically, we want to just write a normal ChainSplit, but then write
    // the wrapper and point to that as the actual event.
    temp._reverse = true;
    let chainSplitAsm = ChainSplit3.write!(dataView, event, info, temp) as string;
    delete temp._reverse;

    return `
      addiu SP, SP, -0x18
      sw    RA, 0x10(SP)
      jal   GetPlayerStruct
       li    A0, -1
      lbu   V0, 0x17(V0)
      andi  V0, V0, 0x80
      beq   V0, R0, revSplitExit
       NOP
      lui   V0, hi(cur_player_spaces_remaining)
      lw    V0, lo(cur_player_spaces_remaining)(V0)
      beq   V0, R0, revSplitExit
       NOP
      jal   chainSplit3Main
       NOP
    revSplitExit:
      lw    RA, 0x10(SP)
      jr    RA
       addiu SP, SP, 0x18

    ${chainSplitAsm}
    `;
  }
};
addEventToLibrary(ReverseChainSplit);
