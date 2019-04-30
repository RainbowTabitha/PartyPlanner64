import { IEvent, IEventParseInfo, IEventWriteInfo } from "../../../events";
import { getFunctionLength } from "../../../../utils/MIPS";
import { ISpaceEvent, getSpacesOfSubType } from "../../../../boards";
import { scenes } from "../../../../fs/scenes";
import { distance } from "../../../../utils/number";
import { SpaceSubtype } from "../../../../types";

export const BooEvent3: Partial<IEvent> = {
  parse(dataView: DataView, info: IEventParseInfo) {
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

    return true;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    // Just point to the event because we left it there.
    if (info.boardIndex === 0) {
      const sceneView = scenes.getDataView(72);
      sceneView.setUint16(0x859A, info.curSpaceIndex); // 0x8010DF3A, 0x003239EC + 0xBE

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

      sceneView.setUint16(0x861A, bestBooIdx); // 0x003239EC + 0x13E
      sceneView.setUint16(0x8626, bestBooIdx); // 0x003239EC + 0x14A

      return `
        J 0x8010DE7C ; boo_event
        NOP
      `;

      // return [0x003239EC, 0];
    }

    throw "Can't write Boo to board index " + info.boardIndex;
  }
};
