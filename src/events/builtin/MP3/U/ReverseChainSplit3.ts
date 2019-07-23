import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, EventExecutionType, Game } from "../../../../types";
import { hashEqual } from "../../../../utils/arrays";
import { ISpaceEvent } from "../../../../boards";
import { addEventToLibrary } from "../../../EventLibrary";

// When going in reverse, there can be splits where there otherwise was only
// chain merges going forward. The game basically wraps a chain split with a
// small function that checks if the player is going in reverse.
export const ReverseChainSplit: IEvent = {
  id: "REVERSECHAINSPLIT",
  name: "",
  fakeEvent: true,
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
    // It's all in ChainSplit3.
    throw new Error(`${ReverseChainSplit.id} not implemented`);
  }
};
addEventToLibrary(ReverseChainSplit);
