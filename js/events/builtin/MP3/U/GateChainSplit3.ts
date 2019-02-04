import { ISpaceEvent, addConnection } from "../../../../boards";
import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, Game, EventExecutionType, EventParameterType } from "../../../../types";
import { hashEqual, copyRange } from "../../../../utils/arrays";
import { getFunctionLength, makeInst, REG, getRegSetUpperAndLower } from "../../../../utils/MIPS";
import { EventCache } from "../../../EventCache";
import { addEventToLibrary } from "../../../EventLibrary";

// Oh look, more ChainSplits!
// This is a ChainSplit where one path leads to a gate.
// The difference is that it has logic to just send the player in the non-gate
// direction automatically if they are coming back from the gate.
export const GateChainSplit: IEvent = {
  id: "GATECHAINSPLIT",
  name: "",
  fakeEvent: true,
  activationType: EventActivationType.WALKOVER,
  executionType: EventExecutionType.PROCESS,
  parameters: [
    { name: "prevSpace", type: EventParameterType.Number, },
    { name: "altChain", type: EventParameterType.NumberArray, },
  ],
  supportedGames: [
    Game.MP3_USA,
  ],
  parse(dataView: DataView, info: IEventParseInfo) {
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
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    let cacheEntry = EventCache.get(GateChainSplit.id);
    if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game].asm)
      throw `Cannot write ${GateChainSplit.id}, missing cache entry values.`;

    let asm = cacheEntry[info.game].asm;
    copyRange(dataView, asm, 0, 0, asm.byteLength);

    // Check for the previous space being the gate chain's first space.
    dataView.setUint16(0x46, event.parameterValues!.prevSpace as number);

    // Send player to other chain if coming from gate.
    const altChain = event.parameterValues!.altChain as number[];
    dataView.setUint32(0x5C, makeInst("ADDIU", REG.A1, REG.R0, altChain[0])); // Chain index
    dataView.setUint32(0x68, makeInst("ADDIU", REG.A2, REG.R0, altChain[1])); // Index in chain

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
  }
};
addEventToLibrary(GateChainSplit);
