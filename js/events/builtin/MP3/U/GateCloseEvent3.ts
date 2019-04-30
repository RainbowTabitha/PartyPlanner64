import { ISpaceEvent } from "../../../../boards";
import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, EventExecutionType, Game, EventParameterType } from "../../../../types";
import { getFunctionLength } from "../../../../utils/MIPS";

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

    return true;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    const gateIndex = event.parameterValues!.gateIndex as number;
    return `
      addiu SP, SP, -0x18
      sw    RA, 0x10(SP)
      jal   0x80108AE8 ; gate_spaces_event
       li    A0, ${gateIndex}
      lw    RA, 0x10(SP)
      jr    RA
       addiu SP, SP, 0x18
    `;
  }
};
