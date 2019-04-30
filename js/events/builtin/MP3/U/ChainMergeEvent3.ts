import { IEvent, IEventWriteInfo, IEventParseInfo } from "../../../events";
import { EventActivationType, EventExecutionType, Game, EventParameterType } from "../../../../types";
import { hashEqual, copyRange } from "../../../../utils/arrays";
import { addConnection, ISpaceEvent } from "../../../../boards";
import { $$hex } from "../../../../utils/debug";
import { addEventToLibrary } from "../../../EventLibrary";

// Represents the "event" that takes the player from one chain to another.
// This won't be an actual event when exposed to the user.
export const ChainMerge3: IEvent = {
  id: "CHAINMERGE3",
  name: "",
  activationType: EventActivationType.WALKOVER,
  executionType: EventExecutionType.DIRECT,
  parameters: [
    { name: "prevSpace", type: EventParameterType.Number, },
    { name: "chain", type: EventParameterType.Number, },
    { name: "spaceIndex", type: EventParameterType.Number, },
  ],
  fakeEvent: true,
  supportedGames: [
    Game.MP3_USA,
  ],
  parse(dataView: DataView, info: IEventParseInfo) {
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
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    let staticHelperJal = 0;
    if (info.boardIndex === 0)
      staticHelperJal = 0x80108C1C; // TODO: Include this code here too.
    else
      throw `ChainMerge3 for ${info.boardIndex} needs work`;

    // TODO: Could just use "prevSpace" etc below, the definelabels should work...
    return `
      ADDIU SP, SP, -0x18
      SW    RA, 0x10(SP)
      ADDIU A0, R0, ${event.parameterValues!.prevSpace}
      ADDIU A1, R0, ${event.parameterValues!.chain || 0}
      JAL   ${$$hex(staticHelperJal)}
      ADDIU A2, R0, ${event.parameterValues!.spaceIndex || 0}
      LW    RA, 0x10(SP)
      JR    RA
      ADDIU SP, SP, 0x18
    `;
  },
}
addEventToLibrary(ChainMerge3);
