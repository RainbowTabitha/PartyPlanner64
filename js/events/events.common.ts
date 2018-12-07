import { createEvent, getEvent, EventCache, IEvent, IEventWriteInfo, IEventParseInfo } from "./events";
import { EventActivationType, EventExecutionType, Game } from "../types";

import "./builtin/ChainMergeEvent";
import "./builtin/ChainMergeEvent3";
import "./builtin/BowserEvent1";
import "./builtin/ChanceTimeEvent1";
import "./builtin/PassStartEvent1";
import "./builtin/StarChanceEvent1";
import { Star1Event } from "./builtin/StarEvent1";
import { Boo1Event } from "./builtin/BooEvent1";
import { ChainSplit1 } from "./builtin/ChainSplit1";
import { ChainSplit2 } from "./builtin/ChainSplit2";
import { ChainSplit3 } from "./builtin/ChainSplit3";

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
  switch (info.gameVersion) {
    case 1:
      return ChainSplit1.parse(dataView, info);
    case 2:
      return ChainSplit2.parse(dataView, info);
    case 3:
      return ChainSplit3.parse(dataView, info);
  }
  return false;
};
ChainSplit.write = function(dataView: DataView, event: IChainSplitEvent, info: IEventWriteInfo, temp: { helper1addr: number, helper2addr: number }) {
  switch (info.gameVersion) {
    case 1:
      return ChainSplit1.write(dataView, event, info, temp);
    case 2:
      return ChainSplit2.write(dataView, event, info, temp);
    case 3:
      return ChainSplit3.write(dataView, event, info, temp);
  }
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
    case 1:
      return Boo1Event.parse(dataView, info);
    case 2:
      return (eBoo as any)._parse2(dataView, info);
    case 3:
      return (eBoo as any)._parse3(dataView, info);
  }
};
BooEvent.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eBooEvent = getEvent(BooEvent.id);
  switch (info.gameVersion) {
    case 1:
      return Boo1Event.write(dataView, event, info, temp);
    case 2:
      return (eBooEvent as any)._write2(dataView, event, info, temp);
    case 3:
      return (eBooEvent as any)._write3(dataView, event, info, temp);
  }
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
      return Star1Event.parse(dataView, info);
    case 2:
      return (eStarEvent as any)._parse2(dataView, info);
  }
  return false;
};
StarEvent.write = function(dataView: DataView, event: IEvent, info: IEventWriteInfo, temp: any) {
  const eStarEvent = getEvent(StarEvent.id);
  switch (info.gameVersion) {
    case 1:
      return Star1Event.write(dataView, event, info, temp);
    case 2:
      return (eStarEvent as any)._write2(dataView, event, info, temp);
    case 3:
      return (eStarEvent as any)._write3(dataView, event, info, temp);
  }
  return false;
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
