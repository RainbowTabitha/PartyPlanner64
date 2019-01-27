import { hashEqual } from "../utils/arrays";
import { IEventParseInfo, createEvent, getEvents } from "./events";
import { Game, EventActivationType, EventExecutionType } from "../types";
import { copyObject } from "../utils/obj";


// Right now, we don't even parse this event onto the board, but we need
// it to grab some helper functions for plain ChainMerge (not usually present in DK)
const ThwompChainSplit = createEvent("THWOMPCHAINSPLIT", "");
ThwompChainSplit.fakeEvent = true;
ThwompChainSplit.supportedGames = [
  Game.MP1_USA,
];
ThwompChainSplit.parse = function(dataView: DataView, info: IEventParseInfo) {
  var hashes = {
    // One particular thwomp event from DK:
    METHOD_START: "A45C16B1E285427C790C6FAD1EC78394", // +0x40
  };
  if (hashEqual([dataView.buffer, info.offset, 0x40], hashes.METHOD_START)) {
    return true;
  }
  return false;
};

const Boulder = createEvent("BOULDER", "Boulder chase");
Boulder.activationType = EventActivationType.LANDON;
Boulder.executionType = EventExecutionType.DIRECT;
Boulder.fakeEvent = true;
Boulder.supportedGames = [
  Game.MP1_USA,
];
Boulder.parse = function(dataView: DataView, info: IEventParseInfo) {
  const hashes = {
    METHOD_START: "6E26BAB74BC8411901472C0A40E2FC1D", // +0x74
  };

  if (hashEqual([dataView.buffer, info.offset, 0x74], hashes.METHOD_START)) {
    // TODO: Parse the boulder path arguments.
    return true;
  }

  return false;
};

export function getAvailableEvents() {
  let events = [];
  let _events = getEvents();
  for (let id in _events) {
    let event = _events[id];
    if (!(event as any).unsupported && !event.fakeEvent) // TODO: unsupported prop?
      events.push(copyObject(event));
  }
  return events;
}
