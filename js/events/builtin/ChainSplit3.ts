import { createEvent, IEvent, IEventParseInfo, IEventWriteInfo, EventCache } from "../events";
import { EventActivationType, EventExecutionType, Game } from "../../types";
import { hashEqual, copyRange } from "../../utils/arrays";
import { addConnection } from "../../boards";
import { makeInst, REG, getRegSetUpperAndLower } from "../../utils/MIPS";

interface IChainSplitEvent extends IEvent {
  chains: number[];
}

// Represents the "event" where the player decides between two paths.
// This won't be an actual event when exposed to the user.
export const ChainSplit3 = createEvent("CHAINSPLIT3", "");
ChainSplit3.activationType = EventActivationType.WALKOVER;
ChainSplit3.executionType = EventExecutionType.PROCESS;
ChainSplit3.fakeEvent = true;
ChainSplit3.supportedGames = [
  Game.MP3_USA,
];
ChainSplit3.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // From Chilly Waters 0x80108D28 / 0x31E898:
    METHOD_START: "16092DD153432852C141C78807ECCBF0", // +0x08
    METHOD_END: "6FF6DF70CDC85862F8F129303009A544", // [0x24]+0x14
  };

  // Match a few sections to see if we match.
  if (hashEqual([dataView.buffer, info.offset, 0x08], hashes.METHOD_START) &&
      hashEqual([dataView.buffer, info.offset + 0x24, 0x14], hashes.METHOD_END)) {
    // Read the RAM offset of the space index arguments.
    let upperAddr = dataView.getUint16(info.offset + 0x0A) << 16;
    let lowerAddr = dataView.getUint16(info.offset + 0x0E);
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

    let cacheEntry = EventCache.get(ChainSplit3.id);
    if (!cacheEntry)
      cacheEntry = {};
    if (!cacheEntry[info.game])
      cacheEntry[info.game] = {};
    if (!cacheEntry[info.game].asm) {
      cacheEntry[info.game].asm = dataView.buffer.slice(info.offset, info.offset + 0x38);
      let cacheView = new DataView(cacheEntry[info.game].asm);
      cacheView.setUint32(0x08, 0); // Blank the A0 load.
      cacheView.setUint32(0x0C, 0);
      cacheView.setUint32(0x10, 0); // Blank the A1 load.
      cacheView.setUint32(0x14, 0);
      cacheView.setUint32(0x18, 0); // Blank the A2 load.
      cacheView.setUint32(0x20, 0);
    }

    EventCache.set(ChainSplit3.id, cacheEntry);

    return true;
  }

  return false;
};
ChainSplit3.write = function(dataView: DataView, event: IChainSplitEvent, info: IEventWriteInfo, temp: any) {
  let cacheEntry = EventCache.get(ChainSplit3.id);
  if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
    throw `Cannot write ${ChainSplit3.id}, missing cache entry values.`;

  let asm = cacheEntry[info.game].asm;
  copyRange(dataView, asm, 0, 0, asm.byteLength);

  let [argsAddrUpper, argsAddrLower] = getRegSetUpperAndLower(info.argsAddr!);
  dataView.setUint32(0x08, makeInst("LUI", REG.A0, argsAddrUpper));
  dataView.setUint32(0x0C, makeInst("ADDIU", REG.A0, REG.A0, argsAddrLower));

  [argsAddrUpper, argsAddrLower] = getRegSetUpperAndLower(info.argsAddr! + 0x14);
  dataView.setUint32(0x10, makeInst("LUI", REG.A1, argsAddrUpper));
  dataView.setUint32(0x14, makeInst("ADDIU", REG.A1, REG.A1, argsAddrLower));

  // Not sure what A2 is, but it seems to be fine if it is equal to an address containing 0.
  // Oops, no it wasn't OK? CPUs wouldn't move. So now I just picked a random existing AI addr.
  // Tried 0x8011D668, maybe causes weird path mess ups going in reverse? Maybe not...
  dataView.setUint32(0x18, makeInst("LUI", REG.A2, 0x8012));
  dataView.setUint32(0x20, makeInst("ADDIU", REG.A2, REG.A2, 0xD854));

  if ((event as any)._reverse) { // Blank out the extra JAL we don't do when reversing.
    dataView.setUint32(0x24, 0);
    dataView.setUint32(0x28, 0);
  }

  return [info.offset, asm.byteLength];
};
