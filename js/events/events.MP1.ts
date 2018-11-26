import { hashEqual, copyRange } from "../utils/arrays";
import { IEventParseInfo, EventCache, createEvent, IEventWriteInfo, IEvent, getEvents } from "./events";
import { addConnection } from "../boards";
import { Game, EventActivationType, EventExecutionType } from "../types";
import { getJALAddr, makeInst } from "../utils/MIPS";
import { copyObject } from "../utils/obj";
import { ChainSplit, StarEvent } from "./events.common";

(ChainSplit as any)._parse1 = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // From Mario Rainbow Castle / Luigi Engine Room:
    METHOD_START: "597324F65BC9A4D0BCA9527477258625", // +0x2C
    METHOD_MID1: "E276F5BAE352AC662ADCA86793409B62", // [0x30]+0x18
    METHOD_MID2: "24FBEBD7FA3B256016D536690EF70AD8", // [0x4C]+0x1C
    METHOD_END: "F153076BBD19ECBB4967EFC92CD738DF" // [0xE0]+0x28
  };

  // Match a few sections to see if we match.
  if (hashEqual([dataView.buffer, info.offset, 0x2C], hashes.METHOD_START) &&
      //hashEqual([dataView.buffer, info.offset + 0x30, 0x18], hashes.METHOD_MID1) &&
      hashEqual([dataView.buffer, info.offset + 0x4C, 0x1C], hashes.METHOD_MID2) &&
      hashEqual([dataView.buffer, info.offset + 0xE0, 0x28], hashes.METHOD_END)) {
    // Read the chain indices.
    let leftChain = dataView.getUint16(info.offset + 0xDA);
    let rightChain = dataView.getUint16(info.offset + 0xDE);

    let leftSpace = info.chains[leftChain][0]; // Technically, we should check if A2 is really R0.
    let rightSpace = info.chains[rightChain][0];

    addConnection(info.curSpace, leftSpace, info.board);
    addConnection(info.curSpace, rightSpace, info.board);

    let cacheEntry = EventCache.get(ChainSplit.id);
    if (!cacheEntry)
      cacheEntry = {};
    if (!cacheEntry[info.game])
      cacheEntry[info.game] = {};
    if (!cacheEntry[info.game].asm) {
      cacheEntry[info.game].asm = dataView.buffer.slice(info.offset, info.offset + 0x108);
      let cacheView = new DataView(cacheEntry[info.game].asm);
      cacheView.setUint32(0x2C, 0); // Blank the helper1 call.
      cacheView.setUint32(0xC4, 0); // Blank the helper2 call.
      cacheView.setUint32(0x40, 0); // Blank the space args LUI.
      cacheView.setUint32(0x48, 0); // Blank the space args ADDIU.
      cacheView.setUint16(0xD4, 0); // Blank the +3 jump.
      cacheView.setUint16(0xDA, 0); // Blank the left chain index.
      cacheView.setUint16(0xDE, 0); // Blank the right chain index.
    }

    EventCache.set(ChainSplit.id, cacheEntry);

    return true;
  }

  return false;
};

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
    let cacheEntry = EventCache.get(ChainSplit.id); // Give it to ChainSplit.
    if (!cacheEntry)
      cacheEntry = {};
    if (!cacheEntry[info.game])
      cacheEntry[info.game] = {};
    if (!cacheEntry[info.game].helper1) {
      cacheEntry[info.game].helper1 = [];
      let helper1JAL = dataView.getUint32(info.offset + 0x40);
      let helper1Addr = getJALAddr(helper1JAL);
      //console.log(helper1Addr.toString(16));
      let helper1Offset = info.offset - (info.addr - helper1Addr); // Assumes helper comes before.
      //console.log(helper1Offset.toString(16));
      cacheEntry[info.game].helper1[info.boardIndex] = dataView.buffer.slice(helper1Offset, helper1Offset + 0xB0);

      cacheEntry[info.game].helper2 = [];
      let helper2JAL = dataView.getUint32(info.offset + 0xD0);
      let helper2Addr = getJALAddr(helper2JAL);
      //console.log(helper1Addr.toString(16));
      let helper2Offset = info.offset - (info.addr - helper2Addr); // Assumes helper comes before.
      //console.log(helper1Offset.toString(16));
      cacheEntry[info.game].helper2[info.boardIndex] = dataView.buffer.slice(helper2Offset, helper2Offset + 0x4C);
    }

    EventCache.set(ChainSplit.id, cacheEntry);

    return true;
  }

  return false;
};

(StarEvent as any)._parse1 = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // DK, Wario, Luigi
    METHOD_START: "14A3FD0F13B034F8C90659FF589A17DB", // +0x14
    // Skip a method call (two possibilities [DK, Wario, Luigi], [Bowser, Eternal])
    METHOD_MID: "B48ABB1B1FDBF7B5EF9765FD61C3940E", // [0x18]+0x10
    // Skip a relative branch
    // Skip A0, R0, Event# (44, 5E)
    METHOD_END: "5FEE3364FDCA8B0E9247BFB37A391358" //[0x30]+0x34
  };

  if (hashEqual([dataView.buffer, info.offset, 0x14], hashes.METHOD_START) &&
      hashEqual([dataView.buffer, info.offset + 0x18, 0x10], hashes.METHOD_MID) &&
      hashEqual([dataView.buffer, info.offset + 0x30, 0x34], hashes.METHOD_END)) {
    let cacheEntry = EventCache.get(StarEvent.id);
    if (!cacheEntry) {
      // Save the whole function, but clear variable values.
      cacheEntry = {
        asm: dataView.buffer.slice(info.offset, info.offset + 0x64)
      };
      let cacheView = new DataView(cacheEntry.asm);
      cacheView.setUint32(0x14, 0); // Board specific JAL
      //cacheView.setUint32(0x28, 0); // Relative branch
      //cacheView.setUint16(0x2E, 0); // Specific event we are visiting (Toad or Cohort)
    }
    cacheEntry.methodCallsByBoard = cacheEntry.methodCallsByBoard || {};
    if (!cacheEntry.methodCallsByBoard[info.boardIndex])
      cacheEntry.methodCallsByBoard[info.boardIndex] = dataView.getUint32(info.offset + 0x14);

    EventCache.set(StarEvent.id, cacheEntry);

    return true;
    // var args = {
    //   "type": dataView.getUint16(info.offset + 0x2E)
    // };
    //
    // return args;
  }

  return false;
};
(StarEvent as any)._write1 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(StarEvent.id);
  if (!cacheEntry)
    throw `Cannot write ${StarEvent.id}, no cache entry present.`;

  // Re-use a single star event.
  if (temp.writtenOffset)
    return [temp.writtenOffset, 0];

  let asm = cacheEntry.asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);
  if (!cacheEntry.methodCallsByBoard[info.boardIndex])
    throw `StarEvent cache.methodCallsByBoard[${info.boardIndex}] is not defined`;
  dataView.setUint32(0x14, cacheEntry.methodCallsByBoard[info.boardIndex]);
  //dataView.setUint32(0x28, makeInst("BNE", V0, V1, 12 * 4));
  //dataView.setUint16(0x2E, event.args.type);

  temp.writtenOffset = info.offset;
  return [info.offset, 0x64];
};

const PassStart = createEvent("PASSSTART", "Pass start");
PassStart.activationType = EventActivationType.WALKOVER;
PassStart.executionType = EventExecutionType.PROCESS;
PassStart.supportedGames = [
  Game.MP1_USA,
];
PassStart.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // DK hash:
    METHOD_START: "D87057256E3E3CA9A6878AA03EF4C486", // +0x16
    METHOD_END: "9AB28DCC38CFBE9AE8FEA4515E86D7B2" //[0x1C]+0x18
  };

  if (hashEqual([dataView.buffer, info.offset, 0x16], hashes.METHOD_START) &&
      hashEqual([dataView.buffer, info.offset + 0x1C, 0x18], hashes.METHOD_END)) {
    let cacheEntry = EventCache.get(PassStart.id);
    if (!cacheEntry) {
      cacheEntry = {
        asm: dataView.buffer.slice(info.offset, info.offset + 0x34)
      };
      let cacheView = new DataView(cacheEntry.asm);
      cacheView.setUint32(0x8, 0); // Blank facing towards space.
      cacheView.setUint32(0xC, 0);
      cacheView.setUint32(0x10, 0);
      cacheView.setUint32(0x14, 0);
      cacheView.setUint32(0x18, 0); // Board specific JAL
    }
    cacheEntry.helpersByBoard = cacheEntry.helpersByBoard || {};
    if (!cacheEntry.helpersByBoard[info.boardIndex]) {
      cacheEntry.helpersByBoard[info.boardIndex] = {};

      let helper1JAL = dataView.getUint32(info.offset + 0x18);
      let helper1Addr = getJALAddr(helper1JAL);
      let helper1Offset = info.offset - (info.addr - helper1Addr); // Assumes helper comes before.
      cacheEntry.helpersByBoard[info.boardIndex].helper1 = dataView.buffer.slice(helper1Offset, helper1Offset + 0xD0);

      // Helper1 calls out to Helper2
      let helper2JAL = dataView.getUint32(helper1Offset + 0xB8);
      let helper2Addr = getJALAddr(helper2JAL);
      let helper2Offset = info.offset - (info.addr - helper2Addr); // Assumes helper comes before.
      cacheEntry.helpersByBoard[info.boardIndex].helper2 = dataView.buffer.slice(helper2Offset, helper2Offset + 0x134);
    }

    EventCache.set(PassStart.id, cacheEntry);

    return true;
  }

  return false;
};
PassStart.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(PassStart.id);
  if (!cacheEntry || !cacheEntry.asm || !cacheEntry.helpersByBoard || !cacheEntry.helpersByBoard[info.boardIndex])
    throw `Cannot write ${PassStart.id}, missing cache entry values.`;

  let lenWritten = 0;
  let curAddr = info.addr & 0x7FFFFFFF; // No 0x8... in JALs

  let asm = cacheEntry.asm;
  copyRange(dataView, asm, lenWritten, 0, asm.byteLength);
  lenWritten += asm.byteLength;

  // We need to write the helpers once, then we can reuse them later (but should not have to since this is "Pass Start"...)
  if (!temp.helper2addr) {
    let helper2asm = cacheEntry.helpersByBoard[info.boardIndex].helper2;
    if (!helper2asm)
      throw `Cannot write ${PassStart.id}, missing helper2[${info.boardIndex}].`;

    copyRange(dataView, helper2asm, lenWritten, 0, helper2asm.byteLength);
    temp.helper2addr = curAddr + lenWritten;

    // Fix the J
    dataView.setUint32(lenWritten + 0x78, makeInst("J", temp.helper2addr + 0x78 + 0x38));

    lenWritten += helper2asm.byteLength;
  }
  if (!temp.helper1addr) {
    let helper1asm = cacheEntry.helpersByBoard[info.boardIndex].helper1;
    if (!helper1asm)
      throw `Cannot write ${PassStart.id}, missing helper1[${info.boardIndex}].`;

    copyRange(dataView, helper1asm, lenWritten, 0, helper1asm.byteLength);
    temp.helper1addr = curAddr + lenWritten;

    // Point helper1 to helper2
    dataView.setUint32(lenWritten + 0xB8, makeInst("JAL", temp.helper2addr));

    // Fix the J
    dataView.setUint32(lenWritten + 0xB0, makeInst("J", temp.helper1addr + 0xB0 + 0x10));

    lenWritten += helper1asm.byteLength;
  }

  // Point main to helper1
  dataView.setUint32(0x18, makeInst("JAL", temp.helper1addr));

  return [info.offset, lenWritten];
};

// This pseudo-event handles when the player lands on a previously visited star space.
// The space had turned into a Chance Time space.
const StarChanceEvent = createEvent("STARCHANCE", "Chance Time from old star space");
StarChanceEvent.activationType = EventActivationType.LANDON;
StarChanceEvent.executionType = EventExecutionType.DIRECT;
StarChanceEvent.fakeEvent = true;
StarChanceEvent.supportedGames = [
  Game.MP1_USA,
];
StarChanceEvent.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // DK  0x2449CC, 0x800F970C
    METHOD: "7E32BF9C855085A03CF3A8D208A6AB94", // +0x8C
  };

  if (hashEqual([dataView.buffer, info.offset, 0x8C], hashes.METHOD)) {
    let cacheEntry = EventCache.get(StarChanceEvent.id);
    if (!cacheEntry) {
      // Save the whole function, no unique values
      cacheEntry = {
        asm: dataView.buffer.slice(info.offset, info.offset + 0x8C)
      };
      EventCache.set(StarChanceEvent.id, cacheEntry);
    }

    return true;
  }

  return false;
};
StarChanceEvent.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(StarChanceEvent.id);
  if (!cacheEntry)
    throw `Cannot write ${StarChanceEvent.id}, no cache entry present.`;

  // Re-use the same asm.
  if (temp.writtenOffset)
    return [temp.writtenOffset, 0];

  let asm = cacheEntry.asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);

  temp.writtenOffset = info.offset;
  return [info.offset, 0x8C];
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
