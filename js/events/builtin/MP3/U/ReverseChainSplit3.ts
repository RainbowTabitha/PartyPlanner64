import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, EventExecutionType, Game } from "../../../../types";
import { hashEqual, copyRange } from "../../../../utils/arrays";
import { getFunctionLength, makeInst } from "../../../../utils/MIPS";
import { ISpaceEvent } from "../../../../boards";
import { ChainSplit3 } from "./ChainSplit3";
import { EventCache } from "../../../EventCache";
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

    // Get the JAL to the Chain Split.
    // let jalChainSplit = dataView.getUint32(info.offset + 0x30);

    // Cache the wrapper function ASM so we can write this event later.
    let cacheEntry = EventCache.get(ReverseChainSplit.id) || {};
    if (!cacheEntry[info.game]) {
      cacheEntry[info.game] = {
        asm: dataView.buffer.slice(info.offset, info.offset + getFunctionLength(dataView, info.offset)!)
      };
      EventCache.set(ReverseChainSplit.id, cacheEntry);
    }

    // We don't need to do anything aside from caching the helper function.
    return true;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    let cacheEntry = EventCache.get(ReverseChainSplit.id);
    if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
      throw `Cannot write ${ReverseChainSplit.id}, missing cache entry values.`;

    // Basically, we want to just write a normal ChainSplit, but then write
    // the wrapper and point to that as the actual event.
    temp._reverse = true;
    let [splitOffset, splitLen] = ChainSplit3.write!(dataView, event, info, temp) as number[];
    delete temp._reverse;

    // Now write the wrapper.
    let asm = cacheEntry[info.game].asm;
    copyRange(dataView, asm, splitLen, 0, asm.byteLength);

    // Patch wrapper to JAL ChainSplit
    let jalAddr = info.addr! & 0x7FFFFFFF; // This is still pointing at the ChainSplit
    dataView.setUint32(splitLen + 0x30, makeInst("JAL", jalAddr));

    return [info.offset! + splitLen, splitLen + asm.byteLength];
  }
};
addEventToLibrary(ReverseChainSplit);
