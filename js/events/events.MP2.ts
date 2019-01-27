import { IEventParseInfo, IEventWriteInfo, IEvent, getEvents } from "./events";
import { hashEqual } from "../utils/arrays";
import { getSpacesOfSubType } from "../boards";
import { SpaceSubtype } from "../types";
import { distance } from "../utils/number";
import { copyObject } from "../utils/obj";
import { StarEvent, BooEvent, BankEvent, ItemShop } from "./events.common";
import { scenes } from "../fs/scenes";

(StarEvent as any)._parse2 = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    WESTERN: "D52AD53C2FED642C3001C3579B4299C3" // 0x29E0DC - 0x29E91C ROM
  };

  if (hashEqual([dataView.buffer, info.offset, 0x840], hashes.WESTERN)) {
    return true;
  }

  return false;
};
(StarEvent as any)._write2 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  // Just point to the event because we left it alone.
  return [0x29E0DC, 0];
};

(BooEvent as any)._parse2 = function(dataView: DataView, info: IEventParseInfo) {
  let fnLen;
  let found = false;

  // Western Land 0x10BA48 - 0x8010C44C, spaces 0xAF,0xB4 with boos 0x9D,0x9F
  if (info.boardIndex === 0) {
    if (info.offset !== 0x002A0D18)
      return false;
    //if (dataView.getUint32(info.offset + 0x4C) !== 0x0C03AF32) // JAL 0x800EBCC8
    //  return false;
    //fnLen = getFunctionLength(dataView, info.offset);
    //found = fnLen === 0x11D4;
    found = true;
  }

  if (!found)
    return false;

  return true;
};
(BooEvent as any)._write2 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let curBoo = temp.curBoo = temp.curBoo || 1;
  temp.curBoo++;

  // Find the closest (probably only) boo space nearby.
  let booSpaces = getSpacesOfSubType(SpaceSubtype.BOO, info.board);
  let eventSpace = info.curSpace;
  let bestDistance = Number.MAX_VALUE;
  let bestBooIdx = info.curSpaceIndex;
  for (let b = 0; b < booSpaces.length; b++) {
    let booIdx = booSpaces[b];
    let booSpace = info.board.spaces[booIdx];
    let dist = distance(eventSpace.x, eventSpace.y, booSpace.x, booSpace.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestBooIdx = booIdx;
    }
  }

  if (info.boardIndex === 0) {
    const sceneView = scenes.getDataView(62);

    // base 0x002A0D18
    if (curBoo === 1) {
      sceneView.setUint16(0x9248 + 0x82, info.curSpaceIndex); // 0x1010BAC8
      sceneView.setUint16(0x9248 + 0xA6, bestBooIdx); // 0x8010BAEC
    }
    else if (curBoo === 2) {
      sceneView.setUint16(0x9248 + 0x8A, info.curSpaceIndex); // 0x8010BAD0
      sceneView.setUint16(0x9248 + 0xAE, bestBooIdx); // 0x8010BAF4
    }

    // Just point to the event because we left it there.
    return [0x002A0D18, 0];
  }

  throw "Can't write Boo to board index " + info.boardIndex;
};

(BankEvent as any)._parse2 = function(dataView: DataView, info: IEventParseInfo) {
  let fnLen;
  let found = false;

  // Western Land 0x8010964C - 0x80109A70, spaces 0x5E,0x8A with banks 0x9B,0x99
  if (info.boardIndex === 0) {
    if (info.offset !== 0x0029E91C)
      return false;
    //if (dataView.getUint32(info.offset + 0x44) !== 0x0C03C84F)
    //  return false;
    // fnLen = getFunctionLength(dataView, info.offset);
    // found = fnLen === ;
    found = true;
  }

  if (!found)
    return false;

  return true;
};
(BankEvent as any)._write2 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let curBank = temp.curBank = temp.curBank || 1;
  temp.curBank++;

  // Find the closest Bank subtype space nearby.
  let bankSpaces = getSpacesOfSubType(SpaceSubtype.BANK, info.board);
  let eventSpace = info.curSpace;
  let bestDistance = Number.MAX_VALUE;
  let bestBankIdx = info.curSpaceIndex;
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
    const sceneView = scenes.getDataView(62);

    const base = 0x6E4C; // 0x0029E91C
    if (curBank === 1) {
      // The current space
      sceneView.setUint16(base + 0x6A, info.curSpaceIndex); // 0x801096B4

      // The bank's space
      sceneView.setUint16(base + 0x92, bestBankIdx); // 0x801096DC
    }
    else if (curBank === 2) {
      // The current space
      sceneView.setUint16(base + 0x72, info.curSpaceIndex); // 0x801096BC

      // The bank's space
      sceneView.setUint16(base + 0x86, bestBankIdx); // 0x801096D0
    }

    // Just point to the event because we left it alone.
    return [0x0029E91C, 0];
  }

  throw "Can't write Bank to board index " + info.boardIndex;
};

(ItemShop as any)._parse2 = function(dataView: DataView, info: IEventParseInfo) {
  let fnLen;
  let found = false;

  // Western Land 0x80109B30 - 0x8010A13C, space 0xA7 with shop at 0x9A
  if (info.boardIndex === 0) {
    if (info.offset !== 0x0029EE00)
      return false;
    //if (dataView.getUint32(info.offset + 0x44) !== 0x0C03C84F)
    //  return false;
    // fnLen = getFunctionLength(dataView, info.offset);
    // found = fnLen === ;
    found = true;
  }

  if (!found)
    return false;

  return true;
};
(ItemShop as any)._write2 = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  let curItemShop = temp.curItemShop = temp.curItemShop || 1;
  temp.curItemShop++;

  // Find the closest Item shop subtype space nearby.
  let itemShopSpaces = getSpacesOfSubType(SpaceSubtype.ITEMSHOP, info.board);
  let eventSpace = info.curSpace;
  let bestDistance = Number.MAX_VALUE;
  let bestItemShopIdx = info.curSpaceIndex;
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
    const sceneView = scenes.getDataView(62);

    if (curItemShop === 1) {
      // The shop's space
      sceneView.setUint16(0x7330 + 0x62, bestItemShopIdx); // 0x80109B90
    }

    // Just point to the event because we left it alone.
    return [0x0029EE00, 0];
  }

  throw "Can't write Item Shop to board index " + info.boardIndex;
};


export function getAvailableEvents() {
  let events = [];
  let _events = getEvents();
  for (let id in _events) {
    let event = _events[id];
    if (!(event as any).unsupported && !event.fakeEvent)
      events.push(copyObject(event));
  }
  return events;
}
