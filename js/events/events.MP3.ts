import { hashEqual, copyRange } from "../utils/arrays";
import { EventCache, IEventParseInfo, createEvent, IEventWriteInfo, IEvent } from "./events";
import { addConnection, getSpacesOfSubType } from "../boards";
import { getRegSetUpperAndLower, makeInst, REG, getFunctionLength } from "../utils/MIPS";
import { Game, EventActivationType, EventExecutionType, SpaceSubtype } from "../types";
import { romhandler } from "../romhandler";
import { distance } from "../utils/number";
import { $$log } from "../utils/debug";
import { ChainSplit, StarEvent, BooEvent, BankEvent, ItemShop, Gate, GateClose } from "./events.common";

// When going in reverse, there can be splits where there otherwise was only
// chain merges going forward. The game basically wraps a chain split with a
// small function that checks if the player is going in reverse.
const ReverseChainSplit = createEvent("REVERSECHAINSPLIT", "");
ReverseChainSplit.fakeEvent = true;
ReverseChainSplit.activationType = EventActivationType.WALKOVER;
ReverseChainSplit.executionType = EventExecutionType.DIRECT; // Notable difference
ReverseChainSplit.supportedGames = [
  Game.MP3_USA,
];
ReverseChainSplit.parse = function(dataView: DataView, info: IEventParseInfo) {
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
}
ReverseChainSplit.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(ReverseChainSplit.id);
  if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
    throw `Cannot write ${ReverseChainSplit.id}, missing cache entry values.`;

  // Basically, we want to just write a normal ChainSplit, but then write
  // the wrapper and point to that as the actual event.
  (event as any)._reverse = true;
  let [splitOffset, splitLen] = (ChainSplit as any)._write3(dataView, event, info, temp);

  // Now write the wrapper.
  let asm = cacheEntry[info.game].asm;
  copyRange(dataView, asm, splitLen, 0, asm.byteLength);

  // Patch wrapper to JAL ChainSplit
  let jalAddr = info.addr & 0x7FFFFFFF; // This is still pointing at the ChainSplit
  dataView.setUint32(splitLen + 0x30, makeInst("JAL", jalAddr));

  return [info.offset + splitLen, splitLen + asm.byteLength];
};

interface IGateChainSplitEvent extends IEvent {
  prevSpace: number;
  altChain: number[];
}

// Oh look, more ChainSplits!
// This is a ChainSplit where one path leads to a gate.
// The difference is that it has logic to just send the player in the non-gate
// direction automatically if they are coming back from the gate.
const GateChainSplit = createEvent("GATECHAINSPLIT", "");
GateChainSplit.fakeEvent = true;
GateChainSplit.activationType = EventActivationType.WALKOVER;
GateChainSplit.executionType = EventExecutionType.PROCESS;
GateChainSplit.supportedGames = [
  Game.MP3_USA,
];
GateChainSplit.parse = function(dataView: DataView, info: IEventParseInfo) {
  // Chilly waters 0x8D space, 0x80108DD0, 0x31E940
  let hashes = {
    GATE_FILTER: "A99A70CBC4A1F9509AAB966831FC584E"
  };

  if (!hashEqual([dataView.buffer, info.offset, 0x44], hashes.GATE_FILTER))
    return false;

  // We need to parse the chain split I suppose, can't really reuse code
  // right now but it's the same idea, only different offsets.
  let upperAddr = dataView.getUint16(info.offset + 0x7E) << 16;
  let lowerAddr = dataView.getUint16(info.offset + 0x82);
  let spacesAddr = (upperAddr | lowerAddr) & 0x7FFFFFFF;
  if (spacesAddr & 0x00008000)
    spacesAddr = spacesAddr - 0x00010000;
  let spacesOffset = info.offset - (info.addr - spacesAddr);

  let destinationSpace = dataView.getUint16(spacesOffset);
  while (destinationSpace !== 0xFFFF) {
    addConnection(info.curSpace, destinationSpace, info.board);
    spacesOffset += 2;
    destinationSpace = dataView.getUint16(spacesOffset);
  }

  // Cache the function ASM so we can write this event later for gates
  let cacheEntry = EventCache.get(GateChainSplit.id) || {};
  if (!cacheEntry[info.game]) {
    cacheEntry[info.game] = {
      asm: dataView.buffer.slice(info.offset, info.offset + getFunctionLength(dataView, info.offset)!)
    };
    EventCache.set(GateChainSplit.id, cacheEntry);
  }

  return true;
}
GateChainSplit.write = function(dataView: DataView, event: IGateChainSplitEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(GateChainSplit.id);
  if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
    throw `Cannot write ${GateChainSplit.id}, missing cache entry values.`;

  let asm = cacheEntry[info.game].asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);

  // Check for the previous space being the gate chain's first space.
  dataView.setUint16(0x46, event.prevSpace);

  // Send player to other chain if coming from gate.
  dataView.setUint32(0x5C, makeInst("ADDIU", REG.A1, REG.R0, event.altChain[0])); // Chain index
  dataView.setUint32(0x68, makeInst("ADDIU", REG.A2, REG.R0, event.altChain[1])); // Index in chain

  // Write the same A0, A1 as ChainSplit, but later in function.
  let [argsAddrUpper, argsAddrLower] = getRegSetUpperAndLower(info.argsAddr!);
  dataView.setUint32(0x7C, makeInst("LUI", REG.A0, argsAddrUpper));
  dataView.setUint32(0x80, makeInst("ADDIU", REG.A0, REG.A0, argsAddrLower));

  [argsAddrUpper, argsAddrLower] = getRegSetUpperAndLower(info.argsAddr! + 0x14);
  dataView.setUint32(0x84, makeInst("LUI", REG.A1, argsAddrUpper));
  dataView.setUint32(0x88, makeInst("ADDIU", REG.A1, REG.A1, argsAddrLower));

  // Well, one of the A2 AI values from a Chilly GateChainSplit is already there in the cache...
  //dataView.setUint32(0x, makeInst("LUI", REG.A2, 0x8012));
  //dataView.setUint32(0x, makeInst("ADDIU", REG.A2, REG.A2, 0xD854));

  return [info.offset, asm.byteLength];
};

(StarEvent as any)._parse3 = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    CHILLY: "E9B6C28983AAE724AC187EA8E0CBC79D" // 0x8010A4B4 - 0x8010A860 (0x00320024 - 0x003203d0)
  };

  if (hashEqual([dataView.buffer, info.offset, 0x3BC], hashes.CHILLY)) {
    return true;
  }

  return false;
};
(StarEvent as any)._write3 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  // Just point to the event because we left it alone.
  return [0x00320024, 0];
};

(BooEvent as any)._parse3 = function(dataView: DataView, info: IEventParseInfo) {
  let fnLen;
  let found = false;

  // Chilly Waters 0x8010DE7C - 0x10F050, space 0x92 with 0x6A boo
  if (info.boardIndex === 0) {
    if (info.offset !== 0x003239EC)
      return false;
    if (dataView.getUint32(info.offset + 0x4C) !== 0x0C03AF32) // JAL 0x800EBCC8
      return false;
    fnLen = getFunctionLength(dataView, info.offset);
    found = fnLen === 0x11D4;
  }

  // Deep bloober 0x8010D9E4, space 0x79 with 0x66 boo

  if (!found)
    return false;

  // let cacheEntry = EventCache.get(BooEvent.id);
  // if (!cacheEntry)
  //   cacheEntry = {};
  // if (!cacheEntry[info.game])
  //   cacheEntry[info.game] = {};
  // if (!cacheEntry[info.game][info.boardIndex])
  //   cacheEntry[info.game][info.boardIndex] = {};
  // if (!cacheEntry[info.game][info.boardIndex].asm) {
  //   cacheEntry[info.game][info.boardIndex].asm = dataView.buffer.slice(info.offset, info.offset + fnLen);
  //   //let cacheView = new DataView(cacheEntry[info.game].asm);
  // }

  // EventCache.set(BooEvent.id, cacheEntry);

  return true;
};
(BooEvent as any)._write3 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  // Just point to the event because we left it there.
  if (info.boardIndex === 0) {
    let romView = romhandler.getDataView();
    romView.setUint16(0x003239EC + 0xBE, info.curSpaceIndex); // 0x8010DF38

    // Find the closest (probably only) boo space nearby.
    let booSpaces = getSpacesOfSubType(SpaceSubtype.BOO, info.board);
    let eventSpace = info.curSpace;
    let bestDistance = Number.MAX_VALUE;
    let bestBooIdx = info.board._deadSpace!;
    for (let b = 0; b < booSpaces.length; b++) {
      let booIdx = booSpaces[b];
      let booSpace = info.board.spaces[booIdx];
      let dist = distance(eventSpace.x, eventSpace.y, booSpace.x, booSpace.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestBooIdx = booIdx;
      }
    }

    romView.setUint16(0x003239EC + 0x13E, bestBooIdx);
    romView.setUint16(0x003239EC + 0x14A, bestBooIdx);

    return [0x003239EC, 0];
  }

  throw "Can't write Boo to board index " + info.boardIndex;
};

(BankEvent as any)._parse3 = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // A good chunk...
    CHILLY: "FCA0025616E8B2BE4CD60F47EE60DC30" // 0x8010A860 - 0x8010B394 (0x3203D0 ...)
  };

  if (hashEqual([dataView.buffer, info.offset, 0xB4], hashes.CHILLY)) {
    return true;
  }

  return false;
};
(BankEvent as any)._write3 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let curBank = temp.curBank = temp.curBank || 1;
  temp.curBank++;

  // Find the closest Bank subtype space nearby.
  let bankSpaces = getSpacesOfSubType(SpaceSubtype.BANK, info.board);
  let eventSpace = info.curSpace;
  let bestDistance = Number.MAX_VALUE;
  let bestBankIdx = info.board._deadSpace!;
  for (let b = 0; b < bankSpaces.length; b++) {
    let bankIdx = bankSpaces[b];
    let bankSpace = info.board.spaces[bankIdx];
    let dist = distance(eventSpace.x, eventSpace.y, bankSpace.x, bankSpace.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestBankIdx = bankIdx;
    }
  }

  if (info.boardIndex === 0) {
    let romView = romhandler.getDataView();

    if (curBank === 1) {
      // The current space
      romView.setUint16(0x003203D0 + 0x8A, info.curSpaceIndex); // 0x8010A8E8
      romView.setUint16(0x003203D0 + 0xDA, info.curSpaceIndex); // 0x8010A938

      // The bank's space
      romView.setUint16(0x003203D0 + 0xCA, bestBankIdx); // 0x8010A928
      romView.setUint16(0x003203D0 + 0xD2, bestBankIdx); // 0x8010A930
    }
    else if (curBank === 2) {
      // The current space
      romView.setUint16(0x003203D0 + 0x92, info.curSpaceIndex); // 0x8010A8F0
      romView.setUint16(0x003203D0 + 0xBA, info.curSpaceIndex); // 0x8010A918

      // The bank's space
      romView.setUint16(0x003203D0 + 0xA6, bestBankIdx); // 0x8010A904
      romView.setUint16(0x003203D0 + 0xAE, bestBankIdx); // 0x8010A90C
    }

    // Just point to the event because we left it alone.
    return [0x003203D0, 0];
  }

  throw "Can't write Bank to board index " + info.boardIndex;
};

(ItemShop as any)._parse3 = function(dataView: DataView, info: IEventParseInfo) {
  // let fnLen;
  let found = false;

  // Chilly Waters 0x8010B65C - , spaces 0x7C,0x77 with 0x6E,0x73
  if (info.boardIndex === 0) {
    if (info.offset !== 0x003211CC)
      return false;
    if (dataView.getUint32(info.offset + 0x44) !== 0x0C03C84F) // JAL 0x800F213C
      return false;
    // fnLen = getFunctionLength(dataView, info.offset);
    // found = fnLen === ;
    found = true;
  }

  if (!found)
    return false;

  return true;
};
(ItemShop as any)._write3 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let curItemShop = temp.curItemShop = temp.curItemShop || 1;
  temp.curItemShop++;

  // Find the closest Item shop subtype space nearby.
  let itemShopSpaces = getSpacesOfSubType(SpaceSubtype.ITEMSHOP, info.board);
  let eventSpace = info.curSpace;
  let bestDistance = Number.MAX_VALUE;
  let bestItemShopIdx = info.board._deadSpace!;
  for (let b = 0; b < itemShopSpaces.length; b++) {
    let shopIdx = itemShopSpaces[b];
    let shopSpace = info.board.spaces[shopIdx];
    let dist = distance(eventSpace.x, eventSpace.y, shopSpace.x, shopSpace.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestItemShopIdx = shopIdx;
    }
  }

  if (info.boardIndex === 0) {
    let romView = romhandler.getDataView();

    let base = 0x003211CC;
    if (curItemShop === 1) {
      // The current space
      romView.setUint16(base + 0xA2, info.curSpaceIndex); // 0x8010B6FC
      romView.setUint16(base + 0xD6, info.curSpaceIndex); // 0x8010B730

      // The shop's space
      romView.setUint16(base + 0xBE, bestItemShopIdx); // 0x8010B718
      romView.setUint16(base + 0xCA, bestItemShopIdx); // 0x8010B724
    }
    else if (curItemShop === 2) {
      // The current space
      romView.setUint16(base + 0xAA, info.curSpaceIndex); // 0x8010B704
      romView.setUint16(base + 0xFE, info.curSpaceIndex); // 0x8010B758

      // The shop's space
      romView.setUint16(base + 0xB2, bestItemShopIdx); // 0x8010B70C
      romView.setUint16(base + 0xF2, bestItemShopIdx); // 0x8010B74C
    }

    // Just point to the event because we left it alone.
    return [base, 0];
  }

  throw "Can't write Item Shop to board index " + info.boardIndex;
};

interface IGateEvent extends IEvent {
  gateEntryIndex: number;
  gateSpaceIndex: number;
  gateExitIndex: number;
  gatePrevChain: number[];
  gateNextChain: number[]
}

(Gate as any)._parse3 = function(dataView: DataView, info: IEventParseInfo) {
  // Chilly Waters 0x80109AD8 - 0x80109E84, enter 0x7B,0x79, exit 0x4C,0x3F, gates at 0x6D,0x93
  if (info.boardIndex === 0) {
    if (info.offset !== 0x0031F648)
      return false;

    // Marking the gate if we find the event on the entering space.
    if (dataView.getUint16(info.offset + 0x62) === info.curSpaceIndex) {
      info.board.spaces[dataView.getUint16(info.offset + 0x106)].subtype = SpaceSubtype.GATE;
      return true;
    }
    else if (dataView.getUint16(info.offset + 0x6A) === info.curSpaceIndex) {
      info.board.spaces[dataView.getUint16(info.offset + 0x10E)].subtype = SpaceSubtype.GATE;
      return true;
    }
  }

  return false;
};
(Gate as any)._write3 = function(dataView: DataView, event: IGateEvent, info: IEventWriteInfo, temp: any) {
  let baseAddresses = [
    0x0031F648,
    // TODO: Other boards of course.
  ];
  let base = baseAddresses[info.boardIndex];

  // Since we attach this twice for each gate, we want to be careful with curGate.
  if (info.curSpaceIndex !== event.gateEntryIndex)
    return [base, 0];

  let curGate = temp.curGate = temp.curGate || 1;
  $$log(`curGate ${curGate}`);
  temp.curGate++;

  if (info.boardIndex === 0) {
    let romView = romhandler.getDataView();

    if (curGate === 1) {
      // Previous space
      // pre 6D gate
      // 31F97A    6
      // 31F982    R0 -> A2
      romView.setUint16(0x0031F97A, event.gatePrevChain[0]); // 0x80109E08
      romView.setUint32(0x0031F980, makeInst("ADDIU", REG.A2, REG.R0, event.gatePrevChain[1])); // 0x80109E10

      // Entering space
      romView.setUint16(base + 0x62, event.gateEntryIndex); // 0x80109B38
      romView.setUint16(base + 0xEE, event.gateEntryIndex); // 0x80109BC4
      romView.setUint16(base + 0x22A, event.gateEntryIndex); // 0x80109D00
      romView.setUint16(base + 0x326, event.gateEntryIndex); // 0x80109DFC
      // OK so the original code is tricksy and does a SLTI 7A in order to check equals to 7B...
      // We will just patch it to check equality and branch appropriately.
      romView.setUint32(0x0031F854, makeInst("ADDIU", REG.V0, REG.R0, event.gateEntryIndex)); // 0x80109CE4
      romView.setUint32(0x0031F858, makeInst("BEQ", REG.S1, REG.V0, 0x0005 << 2)); // 0x80109CE8 // Keep branch to 0x80109D00
      // There's two!
      romView.setUint32(0x0031F950, makeInst("ADDIU", REG.V0, REG.R0, event.gateEntryIndex)); // 0x80109DE0
      romView.setUint32(0x0031F954, makeInst("BEQ", REG.S1, REG.V0, 0x0005 << 2)); // 0x80109DE4 // Keep branch to 0x80109DFC

      // Gate space
      romView.setUint16(base + 0x106, event.gateSpaceIndex); // 0x80109BDC

      // Exit space
      romView.setUint16(base + 0x7A, event.gateExitIndex); // 0x80109B50
      romView.setUint16(base + 0xE6, event.gateExitIndex); // 0x80109BBC
      romView.setUint16(base + 0x216, event.gateExitIndex); // 0x80109CEC
      romView.setUint16(base + 0x312, event.gateExitIndex); // 0x80109DE8

      // Next space
      // after 6D gate
      // 31F962    6
      // 31F996    4
      romView.setUint16(0x0031F962, event.gateNextChain[0]);
      romView.setUint16(0x0031F996, event.gateNextChain[1]);
    }
    else if (curGate === 2) {
      // Previous space
      // pre 93 gate
      // 31F99A    9
      // 31F9A2    2
      romView.setUint16(0x0031F99A, event.gatePrevChain[0]); // 0x80109E28
      romView.setUint16(0x0031F9A2, event.gatePrevChain[1]); // 0x80109E30

      // Entering space
      romView.setUint16(base + 0x6A, event.gateEntryIndex);
      romView.setUint16(base + 0x206, event.gateEntryIndex);
      romView.setUint16(base + 0x2FE, event.gateEntryIndex);

      // Gate space
      romView.setUint16(base + 0x10E, event.gateSpaceIndex);

      // Exit space
      romView.setUint16(base + 0x92, event.gateExitIndex);

      // Next space
      // after 93 gate
      // 31F96A    9
      // 31f9B6    6
      romView.setUint16(0x0031F96A, event.gateNextChain[0]);
      romView.setUint16(0x0031F9B6, event.gateNextChain[1]);
      // after 93 gate also
      // 31F9B2    9
      // 31F9B6    6
      romView.setUint16(0x0031F9B2, event.gateNextChain[0]);
    }

    // Just point to the event because we left it alone.
    return [base, 0];
  }


  throw "Can't write Gate to board index " + info.boardIndex;
};

interface IGateCloseEvent extends IEvent {
  gateIndex: number;
}

(GateClose as any)._parse3 = function(dataView: DataView, info: IEventParseInfo) {
  let fnLen = getFunctionLength(dataView, info.offset);
  if (fnLen !== 0x1C)
    return false;

  let gateCloseJALs = [
    0x0C0422BA, // JAL 0x80108AE8
  ];

  // Chilly Waters 0x8010F050 - 0x8010F06C
  if (dataView.getUint32(info.offset + 8) !== gateCloseJALs[info.boardIndex])
    return false;

  let cacheEntry = EventCache.get(GateClose.id);
  if (!cacheEntry)
    cacheEntry = {};
  if (!cacheEntry[info.game])
    cacheEntry[info.game] = {};
  if (!cacheEntry[info.game][info.boardIndex])
    cacheEntry[info.game][info.boardIndex] = {};
  if (!cacheEntry[info.game][info.boardIndex].asm)
    cacheEntry[info.game][info.boardIndex].asm = dataView.buffer.slice(info.offset, info.offset + fnLen);

  EventCache.set(GateClose.id, cacheEntry);

  return true;
};
(GateClose as any)._write3 = function(dataView: DataView, event: IGateCloseEvent, info: IEventWriteInfo, temp: any) {
  // Strightforward write, but we need to update the A0 set at 0xC.
  // I think it is set to the gate index.

  let cacheEntry = EventCache.get(GateClose.id);
  if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game][info.boardIndex])
    throw `Cannot write ${GateClose.id}, missing cache entry.`;

  let asm = cacheEntry[info.game][info.boardIndex].asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);

  dataView.setUint32(0x0C, makeInst("ADDIU", REG.A0, REG.R0, event.gateIndex));

  return [info.offset, asm.byteLength];
};
