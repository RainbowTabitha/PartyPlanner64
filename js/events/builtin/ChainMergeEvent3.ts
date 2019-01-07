import { createEvent, IEvent, IEventWriteInfo, IEventParseInfo } from "../events";
import { EventActivationType, EventExecutionType, Game } from "../../types";
import { hashEqual, copyRange } from "../../utils/arrays";
import { addConnection } from "../../boards";
import { prepAsm } from "../prepAsm";
import { assemble } from "mips-assembler";
import { $$hex } from "../../utils/debug";

// Represents the "event" that takes the player from one chain to another.
// This won't be an actual event when exposed to the user.
export const ChainMerge3 = createEvent("CHAINMERGE3", "");
ChainMerge3.activationType = EventActivationType.WALKOVER;
ChainMerge3.executionType = EventExecutionType.DIRECT;
ChainMerge3.fakeEvent = true;
ChainMerge3.supportedGames = [
  Game.MP3_USA,
];
ChainMerge3.parse = function(dataView: DataView, info: IEventParseInfo) {
  // ChainMerge in 3 uses a helper function. It passes the space index of the
  // _previous_ space the player was before reaching the event space.
  const hashes = {
    START: "16092DD153432852C141C78807ECCBF0", // +0x08
    //MID: "123FF0D66026C628870C3DAEE5C63134", // [0x10]+0x04 // Use mergeJALs instead
    END: "0855E7309F121915D7A762AB85A7FDB6", // [0x18]+0x08
  };
  const mergeJALs = [
    0x0C03B666, // JAL 0x800ED998
    0x0C042307, // JAL 0x80108C1C
  ];

  let nextChain, nextSpace;

  if (hashEqual([dataView.buffer, info.offset, 0x08], hashes.START) &&
    mergeJALs.indexOf(dataView.getUint32(info.offset + 0x10)) >= 0 &&
    hashEqual([dataView.buffer, info.offset + 0x18, 0x08], hashes.END)) {
    // Read the chain we are going to.
    nextChain = dataView.getUint16(info.offset + 0x0E);
    nextChain = nextChain > 1000 ? 0 : nextChain; // R0 will be 0x2821 - just check for "way to big".

    // Read the offset into the chain.
    if (dataView.getUint16(info.offset + 0x14) === 0) // Usually this is an add with R0.
      nextSpace = info.chains[nextChain][0];
    else
      nextSpace = info.chains[nextChain][dataView.getUint16(info.offset + 0x16)];

    // This isn't an event really - write directly to the board links.
    if (!isNaN(nextSpace)) {
      // I think this tries to prevent reading the "reverse" event...
      if (info.board.links.hasOwnProperty(info.curSpace)) {
        return false;
      }

      addConnection(info.curSpace, nextSpace, info.board);
    }

    return true;
  }
  return false;
};

interface IChainMergeEvent extends IEvent {
  prevSpace: number;
  chain: number;
  spaceIndex: number;
}

ChainMerge3.write = function(dataView: DataView, event: IChainMergeEvent, info: IEventWriteInfo, temp: any) {
  let staticHelperJal = 0;
  if (info.boardIndex === 0)
    staticHelperJal = 0x80108C1C;
  else
    throw `ChainMerge3 for ${info.boardIndex} needs work`;

  const asm = prepAsm(`
    ADDIU SP, SP, -0x18
    SW    RA, 0x10(SP)
    ADDIU A0, R0, ${event.prevSpace}
    ADDIU A1, R0, ${event.chain}
    JAL   ${$$hex(staticHelperJal)}
    ADDIU A2, R0, ${event.spaceIndex || 0}
    LW    RA, 0x10(SP)
    JR    RA
    ADDIU SP, SP, 0x18
  `, event, info);
  const bytes = assemble(asm) as ArrayBuffer;
  copyRange(dataView, bytes, 0, 0, bytes.byteLength);
  return [info.offset!, bytes.byteLength];
};
