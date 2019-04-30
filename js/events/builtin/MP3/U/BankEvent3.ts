import { IEvent, IEventParseInfo, IEventWriteInfo } from "../../../events";
import { hashEqual } from "../../../../utils/arrays";
import { ISpaceEvent, getSpacesOfSubType } from "../../../../boards";
import { SpaceSubtype } from "../../../../types";
import { distance } from "../../../../utils/number";
import { scenes } from "../../../../fs/scenes";

export const BankEvent3: Partial<IEvent> = {
  parse(dataView: DataView, info: IEventParseInfo) {
    let hashes = {
      // A good chunk...
      CHILLY: "FCA0025616E8B2BE4CD60F47EE60DC30" // 0x8010A860 - 0x8010B394 (0x3203D0 ...)
    };

    if (hashEqual([dataView.buffer, info.offset, 0xB4], hashes.CHILLY)) {
      return true;
    }

    return false;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
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
      const sceneView = scenes.getDataView(72);

      if (curBank === 1) {
        // The current space
        sceneView.setUint16(0x4F4A, info.curSpaceIndex); // 0x8010A8E8, 0x003203D0 + 0x8A
        sceneView.setUint16(0x4F9A, info.curSpaceIndex); // 0x8010A938, 0x003203D0 + 0xDA

        // The bank's space
        sceneView.setUint16(0x4F8A, bestBankIdx); // 0x8010A928, 0x003203D0 + 0xCA
        sceneView.setUint16(0x4F92, bestBankIdx); // 0x8010A930, 0x003203D0 + 0xD2
      }
      else if (curBank === 2) {
        // The current space
        sceneView.setUint16(0x4F52, info.curSpaceIndex); // 0x8010A8F0, 0x003203D0 + 0x92
        sceneView.setUint16(0x4F7A, info.curSpaceIndex); // 0x8010A918, 0x003203D0 + 0xBA

        // The bank's space
        sceneView.setUint16(0x4F66, bestBankIdx); // 0x8010A904, 0x003203D0 + 0xA6
        sceneView.setUint16(0x4F6E, bestBankIdx); // 0x8010A90C, 0x003203D0 + 0xAE
      }

      // Just point to the event because we left it alone.
      //return [0x003203D0, 0];
      return `
        J 0x8010A860 ; bank_space_event
        NOP
      `;
    }

    throw "Can't write Bank to board index " + info.boardIndex;
  }
};
