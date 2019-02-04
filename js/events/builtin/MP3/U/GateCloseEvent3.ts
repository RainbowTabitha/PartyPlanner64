import { ISpaceEvent } from "../../../../boards";
import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, EventExecutionType, Game, EventParameterType } from "../../../../types";
import { getFunctionLength, makeInst, REG } from "../../../../utils/MIPS";
import { copyRange } from "../../../../utils/arrays";
import { EventCache } from "../../../EventCache";

export const GateClose3: IEvent = {
  id: "GATECLOSE3",
  name: "",
  activationType: EventActivationType.WALKOVER,
  executionType: EventExecutionType.DIRECT,
  parameters: [
    { name: "gateIndex", type: EventParameterType.Number },
  ],
  fakeEvent: true,
  supportedGames: [
    Game.MP3_USA,
  ],

  parse(dataView: DataView, info: IEventParseInfo) {
    let fnLen = getFunctionLength(dataView, info.offset);
    if (fnLen !== 0x1C)
      return false;

    let gateCloseJALs = [
      0x0C0422BA, // JAL 0x80108AE8
    ];

    // Chilly Waters 0x8010F050 - 0x8010F06C
    if (dataView.getUint32(info.offset + 8) !== gateCloseJALs[info.boardIndex])
      return false;

    let cacheEntry = EventCache.get(GateClose3.id);
    if (!cacheEntry)
      cacheEntry = {};
    if (!cacheEntry[info.game])
      cacheEntry[info.game] = {};
    if (!cacheEntry[info.game][info.boardIndex])
      cacheEntry[info.game][info.boardIndex] = {};
    if (!cacheEntry[info.game][info.boardIndex].asm)
      cacheEntry[info.game][info.boardIndex].asm = dataView.buffer.slice(info.offset, info.offset + fnLen);

    EventCache.set(GateClose3.id, cacheEntry);

    return true;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    // Strightforward write, but we need to update the A0 set at 0xC.
    // I think it is set to the gate index.

    let cacheEntry = EventCache.get(GateClose3.id);
    if (!cacheEntry || !cacheEntry[info.game] || !cacheEntry[info.game][info.boardIndex])
      throw `Cannot write ${GateClose3.id}, missing cache entry.`;

    let asm = cacheEntry[info.game][info.boardIndex].asm;
    copyRange(dataView, asm, 0, 0, asm.byteLength);

    const gateIndex = event.parameterValues!.gateIndex as number;
    dataView.setUint32(0x0C, makeInst("ADDIU", REG.A0, REG.R0, gateIndex));

    return [info.offset, asm.byteLength];
  }
};
