import { IEvent, IEventParseInfo, IEventWriteInfo } from "../../../events";
import { ISpaceEvent, getSpacesOfSubType } from "../../../../boards";
import { SpaceSubtype } from "../../../../types";
import { distance } from "../../../../utils/number";
import { scenes } from "../../../../fs/scenes";

export const ItemShopEvent3: Partial<IEvent> = {
  parse(dataView: DataView, info: IEventParseInfo) {
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
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
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
      const sceneView = scenes.getDataView(72);

      if (curItemShop === 1) {
        // The current space
        sceneView.setUint16(0x5D5E, info.curSpaceIndex); // 0x8010B6FC, 0x003211CC + 0xA2
        sceneView.setUint16(0x5D92, info.curSpaceIndex); // 0x8010B730, 0x003211CC + 0xD6

        // The shop's space
        sceneView.setUint16(0x5D7A, bestItemShopIdx); // 0x8010B718, 0x003211CC + 0xBE
        sceneView.setUint16(0x5D86, bestItemShopIdx); // 0x8010B724, 0x003211CC + 0xCA
      }
      else if (curItemShop === 2) {
        // The current space
        sceneView.setUint16(0x5D66, info.curSpaceIndex); // 0x8010B704, 0x003211CC + 0xAA
        sceneView.setUint16(0x5DBA, info.curSpaceIndex); // 0x8010B758, 0x003211CC + 0xFE

        // The shop's space
        sceneView.setUint16(0x5D6E, bestItemShopIdx); // 0x8010B70C, 0x003211CC + 0xB2
        sceneView.setUint16(0x5DAE, bestItemShopIdx); // 0x8010B74C, 0x003211CC + 0xF2
      }

      // Just point to the event because we left it alone.
      return `
        J 0x8010B65C ; item_shop_event
        NOP
      `;
    }

    throw "Can't write Item Shop to board index " + info.boardIndex;
  }
};
