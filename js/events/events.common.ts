import { createEvent, getEvent, EventCache, IEvent, IEventWriteInfo, IEventParseInfo } from "./events";
import { EventActivationType, EventExecutionType, Game } from "../types";
import { hashEqual, copyRange } from "../utils/arrays";
import { REG, makeInst } from "../utils/MIPS";

import "./builtin/ChainMergeEvent";
import "./builtin/ChainMergeEvent3";

interface IChainSplitEvent extends IEvent {
  chains: number[];
}

// Represents the "event" where the player decides between two paths.
// This won't be an actual event when exposed to the user.
export const ChainSplit = createEvent("CHAINSPLIT", "");
ChainSplit.activationType = EventActivationType.WALKOVER;
ChainSplit.executionType = EventExecutionType.PROCESS;
ChainSplit.fakeEvent = true;
ChainSplit.supportedGames = [
  Game.MP1_USA,
  Game.MP2_USA,
  Game.MP3_USA,
];
ChainSplit.parse = function(dataView: DataView, info: IEventParseInfo) {
  let eChainSplit = getEvent(ChainSplit.id);
  switch (info.gameVersion) {
    case 1:
      return (eChainSplit as any)._parse1(dataView, info);
    case 2:
      return (eChainSplit as any)._parse2(dataView, info);
    case 3:
      return (eChainSplit as any)._parse3(dataView, info);
  }
  return false;
};
ChainSplit.write = function(dataView: DataView, event: IChainSplitEvent, info: IEventWriteInfo, temp: { helper1addr: number, helper2addr: number }) {
  if (info.gameVersion === 3) {
    let eChainSplit = getEvent(ChainSplit.id);
    return (eChainSplit as any)._write3(dataView, event, info, temp);
  }

  let cacheEntry = EventCache.get(ChainSplit.id);
  if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm || !cacheEntry[info.game].helper1 || !cacheEntry[info.game].helper2)
    throw `Cannot write ${ChainSplit.id}, missing cache entry values.`;

  let lenWritten = 0;
  let curAddr = info.addr & 0x7FFFFFFF; // No 0x8... in JALs

  let asm = cacheEntry[info.game].asm;
  copyRange(dataView, asm, lenWritten, 0, asm.byteLength);
  lenWritten += asm.byteLength;

  // We need to write the helpers once, then we can reuse them later.
  if (!temp.helper1addr) {
    let helper1asm = cacheEntry[info.game].helper1[info.boardIndex];
    if (!helper1asm)
      throw `Cannot write ${ChainSplit.id}, missing helper1[${info.boardIndex}].`;

    copyRange(dataView, helper1asm, lenWritten, 0, helper1asm.byteLength);
    temp.helper1addr = curAddr + lenWritten;
    lenWritten += helper1asm.byteLength;
  }
  if (!temp.helper2addr) {
    let helper2asm = cacheEntry[info.game].helper2[info.boardIndex];
    if (!helper2asm)
      throw `Cannot write ${ChainSplit.id}, missing helper2[${info.boardIndex}].`;

    copyRange(dataView, helper2asm, lenWritten, 0, helper2asm.byteLength);
    temp.helper2addr = curAddr + lenWritten;
    lenWritten += helper2asm.byteLength;
  }

  let argsAddrLower = info.argsAddr! & 0x0000FFFF;
  let argsAddrUpper = info.argsAddr! >>> 16;
  if (argsAddrLower & 0x8000)
    argsAddrUpper += 1;

  switch(info.game) {
    case Game.MP1_USA:
    //case Game.MP1_JPN:
      dataView.setUint32(0x2C, makeInst("JAL", temp.helper1addr)); // Set the helper1 call.
      dataView.setUint32(0x40, makeInst("LUI", REG.A1, argsAddrUpper));
      dataView.setUint32(0x48, makeInst("ADDIU", REG.A1, REG.A1, argsAddrLower));
      dataView.setUint32(0xC4, makeInst("JAL", temp.helper2addr)); // Set the helper2 call.
      dataView.setUint32(0xD4, makeInst("J", curAddr + 0xE0)); // J +3
      dataView.setUint16(0xDA, event.chains[0]); // Set the left chain index.
      dataView.setUint16(0xDE, event.chains[1]); // Set the right chain index.
      break;
    case Game.MP2_USA:
      dataView.setUint32(0x2C, makeInst("JAL", temp.helper1addr)); // Set the helper1 call.
      dataView.setUint32(0x40, makeInst("LUI", REG.A1, argsAddrUpper));
      dataView.setUint32(0x48, makeInst("ADDIU", REG.A1, REG.A1, argsAddrLower));
      dataView.setUint32(0xD4, makeInst("JAL", temp.helper2addr)); // Set the helper2 call.
      dataView.setUint32(0xE4, makeInst("J", curAddr + 0xF0)); // J +3
      dataView.setUint16(0xEA, event.chains[0]); // Set the left chain index.
      dataView.setUint16(0xEE, event.chains[1]); // Set the right chain index.
      break;
    default:
      throw `Writing ChainSplit for unknown game`;
  }

  return [info.offset, lenWritten];
};

export const BooEvent = createEvent("BOO", "Visit Boo");
BooEvent.activationType = EventActivationType.WALKOVER;
BooEvent.executionType = EventExecutionType.DIRECT;
BooEvent.supportedGames = [
  Game.MP1_USA, Game.MP2_USA, Game.MP3_USA,
];
BooEvent.parse = function(dataView: DataView, info: IEventParseInfo) {
  const eBoo = getEvent(BooEvent.id);
  switch (info.gameVersion) {
    case 2:
      return (eBoo as any)._parse2(dataView, info);
    case 3:
      return (eBoo as any)._parse3(dataView, info);
  }

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
    let match = sceneNum === 0x65;

    if (match) {
      let cacheEntry = EventCache.get(BooEvent.id);
      if (!cacheEntry) {
        // Save the whole function, but clear the argument values.
        cacheEntry = {
          asm: dataView.buffer.slice(info.offset, info.offset + 0x34)
        };
        let cacheView = new DataView(cacheEntry.asm);
        cacheView.setUint16(0x16, 0); // Blank the "face towards" space.
        EventCache.set(BooEvent.id, cacheEntry);
      }
    }

    return match;
  }
  else if (hashEqual([dataView.buffer, info.offset + 0x54, 0x18], hashes.METHOD_END) &&
      hashEqual([dataView.buffer, info.offset, 0x28], hashes.DK_TWOBOO_METHOD_START)) {
    return true; // We know this is stock DK board.
  }

  return false;
};
BooEvent.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eBooEvent = getEvent(BooEvent.id);
  switch (info.gameVersion) {
    // case 1:
    //   return eBooEvent._write1(dataView, event, info, temp);
    case 2:
      return (eBooEvent as any)._write2(dataView, event, info, temp);
    case 3:
      return (eBooEvent as any)._write3(dataView, event, info, temp);
  }

  let cacheEntry = EventCache.get(BooEvent.id);
  if (!cacheEntry)
    throw `Cannot write ${BooEvent.id}, no cache entry present.`;

  let asm = cacheEntry.asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);
  // TODO: "Facing towards" space?
  // For now, blank out the facing towards.
  dataView.setUint32(8, 0);
  dataView.setUint32(12, 0);
  dataView.setUint32(16, 0);
  dataView.setUint32(20, 0);

  return [info.offset, 0x34];
};

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

    if (isBowserScene) {
      let cacheEntry = EventCache.get(Bowser.id);
      if (!cacheEntry) {
        // Save the whole function, but clear the argument values.
        cacheEntry = {
          asm: dataView.buffer.slice(info.offset, info.offset + 0x38)
        };
        let cacheView = new DataView(cacheEntry.asm);
        cacheView.setUint32(0x08, 0); // Completely remove the "face towards" for now.
        cacheView.setUint32(0x0C, 0);
        cacheView.setUint32(0x10, 0);
        cacheView.setUint32(0x14, 0); // 0x16 is the actual space faced towards.
        cacheView.setUint32(0x1A, 0); // Blank the scene number.
        EventCache.set(Bowser.id, cacheEntry);
      }
    }

    return isBowserScene;
  }

  return false;
};
Bowser.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(Bowser.id);
  if (!cacheEntry)
    throw `Cannot write ${Bowser.id}, no cache entry present.`;

  let asm = cacheEntry.asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);

  // TODO: "Facing towards" space?

  // Any of these "work" but only the corresponding one has the right background.
  let bowserSceneNum = [0x48, 0x49, 0x4F, 0x53, 0x54, 0x5B, 0x5D][info.boardIndex];
  dataView.setUint16(0x1A, bowserSceneNum);

  return [info.offset, 0x38];
};

export const StarEvent = createEvent("STAR", "Buy star");
StarEvent.activationType = EventActivationType.WALKOVER;
StarEvent.executionType = EventExecutionType.DIRECT;
StarEvent.fakeEvent = true;
StarEvent.supportedGames = [
  Game.MP1_USA,
  Game.MP2_USA,
  Game.MP3_USA,
];
StarEvent.parse = function(dataView: DataView, info: IEventParseInfo) {
  const eStarEvent = getEvent(StarEvent.id);
  switch (info.gameVersion) {
    case 1:
      return (eStarEvent as any)._parse1(dataView, info);
    case 2:
      return (eStarEvent as any)._parse2(dataView, info);
  }
  return false;
};
StarEvent.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eStarEvent = getEvent(StarEvent.id);
  switch (info.gameVersion) {
    case 1:
      return (eStarEvent as any)._write1(dataView, event, info, temp);
    case 2:
      return (eStarEvent as any)._write2(dataView, event, info, temp);
    case 3:
      return (eStarEvent as any)._write3(dataView, event, info, temp);
  }
  return false;
};

const ChanceTime = createEvent("CHANCETIME", "Chance Time");
ChanceTime.activationType = EventActivationType.LANDON;
ChanceTime.executionType = EventExecutionType.DIRECT;
ChanceTime.supportedGames = [
  Game.MP1_USA,
];
ChanceTime.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // Peach hash, 0x24699C
    METHOD: "18F44B4AA1F4AAAA839C100E3B0FD863", // +0x6C
  };

  if (hashEqual([dataView.buffer, info.offset, 0x6C], hashes.METHOD)) {
    let cacheEntry = EventCache.get(ChanceTime.id);
    if (!cacheEntry) {
      // Save the whole function.
      cacheEntry = {
        asm: dataView.buffer.slice(info.offset, info.offset + 0x6C)
      };
      EventCache.set(ChanceTime.id, cacheEntry);
    }

    return true;
  }

  return false;
};
ChanceTime.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(ChanceTime.id);
  if (!cacheEntry)
    throw `Cannot write ${ChanceTime.id}, no cache entry present.`;

  // Re-use a single chance time event.
  if (temp.writtenOffset)
    return [temp.writtenOffset, 0];

  let asm = cacheEntry.asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);

  temp.writtenOffset = info.offset;
  return [info.offset, 0x6C];
};

export const BankEvent = createEvent("BANK", "Visit Bank");
BankEvent.activationType = EventActivationType.WALKOVER;
BankEvent.executionType = EventExecutionType.DIRECT;
BankEvent.supportedGames = [
  Game.MP2_USA,
  Game.MP3_USA,
];
BankEvent.parse = function(dataView: DataView, info: IEventParseInfo) {
  const eBank = getEvent(BankEvent.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eBank as any)._parse2(dataView, info);
    case 3:
      return (eBank as any)._parse3(dataView, info);
  }
  return false;
};
BankEvent.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eBank = getEvent(BankEvent.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eBank as any)._write2(dataView, event, info, temp);
    case 3:
      return (eBank as any)._write3(dataView, event, info, temp);
  }
  return false;
};

export const ItemShop = createEvent("ITEMSHOP", "Visit Item Shop");
ItemShop.activationType = EventActivationType.WALKOVER;
ItemShop.executionType = EventExecutionType.DIRECT;
ItemShop.supportedGames = [
  Game.MP2_USA,
  Game.MP3_USA,
];
ItemShop.parse = function(dataView: DataView, info: IEventParseInfo) {
  const eItemShop = getEvent(ItemShop.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eItemShop as any)._parse2(dataView, info);
    case 3:
      return (eItemShop as any)._parse3(dataView, info);
  }
  return false;
};
ItemShop.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eItemShop = getEvent(ItemShop.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eItemShop as any)._write2(dataView, event, info, temp);
    case 3:
      return (eItemShop as any)._write3(dataView, event, info, temp);
  }
  return false;
};

export const Gate = createEvent("GATE", "Skeleton Key Gate");
Gate.activationType = EventActivationType.WALKOVER;
Gate.executionType = EventExecutionType.PROCESS;
Gate.fakeEvent = true;
Gate.supportedGames = [
  //Game.MP2_USA,
  Game.MP3_USA,
];
Gate.parse = function(dataView: DataView, info: IEventParseInfo) {
  const eGate = getEvent(Gate.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eGate as any)._parse2(dataView, info);
    case 3:
      return (eGate as any)._parse3(dataView, info);
  }
  return false;
};
Gate.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eGate = getEvent(Gate.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eGate as any)._write2(dataView, event, info, temp);
    case 3:
      return (eGate as any)._write3(dataView, event, info, temp);
  }
  return false;
};

// Event that actually occurs on the gate space itself to cause it to close.
export const GateClose = createEvent("GATECLOSE", "Skeleton Key Gate Close");
GateClose.activationType = EventActivationType.WALKOVER;
GateClose.executionType = EventExecutionType.DIRECT;
GateClose.fakeEvent = true;
GateClose.supportedGames = [
  //Game.MP2_USA,
  Game.MP3_USA,
];
GateClose.parse = function(dataView: DataView, info: IEventParseInfo) {
  const eGateClose = getEvent(GateClose.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eGateClose as any)._parse2(dataView, info);
    case 3:
      return (eGateClose as any)._parse3(dataView, info);
  }
  return false;
};
GateClose.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eGateClose = getEvent(GateClose.id);
  switch (info.gameVersion) {
    case 1:
      return false;
    case 2:
      return (eGateClose as any)._write2(dataView, event, info, temp);
    case 3:
      return (eGateClose as any)._write3(dataView, event, info, temp);
  }
  return false;
};
