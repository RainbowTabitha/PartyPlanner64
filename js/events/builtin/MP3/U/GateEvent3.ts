import { ISpaceEvent } from "../../../../boards";
import { IEventParseInfo, IEventWriteInfo, IEvent } from "../../../events";
import { EventActivationType, EventExecutionType, Game, SpaceSubtype, EventParameterType } from "../../../../types";
import { scenes } from "../../../../fs/scenes";
import { makeInst, REG } from "../../../../utils/MIPS";

interface GateParameterNames {
  gateEntryIndex: number;
  gateSpaceIndex: number;
  gateExitIndex: number;
  gatePrevChain: number[];
  gateNextChain: number[];
};

export const Gate3: IEvent = {
  id: "GATE3",
  name: "",
  activationType: EventActivationType.WALKOVER,
  executionType: EventExecutionType.PROCESS,
  parameters: [
    { name: "gateEntryIndex", type: EventParameterType.Number, },
    { name: "gateSpaceIndex", type: EventParameterType.Number, },
    { name: "gateExitIndex", type: EventParameterType.Number, },
    { name: "gatePrevChain", type: EventParameterType.NumberArray, },
    { name: "gateNextChain", type: EventParameterType.NumberArray, },
  ],
  fakeEvent: true,
  supportedGames: [
    Game.MP3_USA,
  ],
  parse(dataView: DataView, info: IEventParseInfo) {
    // Chilly Waters 0x80109AD8 - 0x80109E84, enter 0x7B,0x79, exit 0x4C,0x3F, gates at 0x6D,0x93
    if (info.boardIndex === 0) {
      if (info.offset !== 0x0031F648)
        return false;

      // Marking the gate if we find the event on the entering space.
      if (dataView.getUint16(info.offset + 0x62) === info.curSpaceIndex) {
        info.board.spaces[dataView.getUint16(info.offset + 0x106)].subtype = SpaceSubtype.GATE;
        return true;
      }
      else if (dataView.getUint16(info.offset + 0x6A) === info.curSpaceIndex) {
        info.board.spaces[dataView.getUint16(info.offset + 0x10E)].subtype = SpaceSubtype.GATE;
        return true;
      }
    }

    return false;
  },
  write(dataView: DataView, event: ISpaceEvent, info: IEventWriteInfo, temp: any) {
    let baseAddresses = [
      0x4138, // 0x0031F648,
    ];
    let base = baseAddresses[info.boardIndex];

    const {
      gateEntryIndex,
      gateSpaceIndex,
      gateExitIndex,
      gatePrevChain,
      gateNextChain,
    } = (event.parameterValues as any as GateParameterNames)!;

    // Since we attach this twice for each gate, we want to be careful with curGate.
    if (info.curSpaceIndex !== gateEntryIndex) {
      return `
        J 0x80109AD8
        NOP
      `;
      // return [0x0031F648, 0];
    }

    let curGate = temp.curGate = temp.curGate || 1;
    //$$log(`curGate ${curGate}`);
    temp.curGate++;

    if (info.boardIndex === 0) {
      const sceneView = scenes.getDataView(72);

      if (curGate === 1) {
        // Previous space
        // pre 6D gate
        // 31F97A    6
        // 31F982    R0 -> A2
        sceneView.setUint16(0x446A, gatePrevChain![0]); // 0x80109E08, 0x0031F97A
        sceneView.setUint32(0x4470, makeInst("ADDIU", REG.A2, REG.R0, gatePrevChain![1])); // 0x80109E10, 0x0031F980

        // Entering space
        sceneView.setUint16(base + 0x62, gateEntryIndex); // 0x80109B38
        sceneView.setUint16(base + 0xEE, gateEntryIndex); // 0x80109BC4
        sceneView.setUint16(base + 0x22A, gateEntryIndex); // 0x80109D00
        sceneView.setUint16(base + 0x326, gateEntryIndex); // 0x80109DFC
        // OK so the original code is tricksy and does a SLTI 7A in order to check equals to 7B...
        // We will just patch it to check equality and branch appropriately.
        sceneView.setUint32(0x4344, makeInst("ADDIU", REG.V0, REG.R0, gateEntryIndex)); // 0x80109CE4, 0x0031F854
        sceneView.setUint32(0x4348, makeInst("BEQ", REG.S1, REG.V0, 0x0005 << 2)); // 0x80109CE8 0x0031F858 // Keep branch to 0x80109D00
        // There's two!
        sceneView.setUint32(0x4440, makeInst("ADDIU", REG.V0, REG.R0, gateEntryIndex)); // 0x80109DE0, 0x0031F950
        sceneView.setUint32(0x4444, makeInst("BEQ", REG.S1, REG.V0, 0x0005 << 2)); // 0x80109DE4 0x0031F954 // Keep branch to 0x80109DFC

        // Gate space
        sceneView.setUint16(base + 0x106, gateSpaceIndex); // 0x80109BDC

        // Exit space
        sceneView.setUint16(base + 0x7A, gateExitIndex); // 0x80109B50
        sceneView.setUint16(base + 0xE6, gateExitIndex); // 0x80109BBC
        sceneView.setUint16(base + 0x216, gateExitIndex); // 0x80109CEC
        sceneView.setUint16(base + 0x312, gateExitIndex); // 0x80109DE8

        // Next space
        // after 6D gate
        // 31F962    6
        // 31F996    4
        sceneView.setUint16(0x4452, gateNextChain[0]); // 0x0031F962
        sceneView.setUint16(0x4486, gateNextChain[1]); // 0x0031F996
      }
      else if (curGate === 2) {
        // Previous space
        // pre 93 gate
        // 31F99A    9
        // 31F9A2    2
        sceneView.setUint16(0x448A, gatePrevChain[0]); // 0x80109E28, 0x0031F99A
        sceneView.setUint16(0x4492, gatePrevChain[1]); // 0x80109E30, 0x0031F9A2

        // Entering space
        sceneView.setUint16(base + 0x6A, gateEntryIndex);
        sceneView.setUint16(base + 0x206, gateEntryIndex);
        sceneView.setUint16(base + 0x2FE, gateEntryIndex);

        // Gate space
        sceneView.setUint16(base + 0x10E, gateSpaceIndex);

        // Exit space
        sceneView.setUint16(base + 0x92, gateExitIndex);

        // Next space
        // after 93 gate
        // 31F96A    9
        // 31f9B6    6
        sceneView.setUint16(0x445A, gateNextChain[0]); // 0x0031F96A
        sceneView.setUint16(0x44A6, gateNextChain[1]); // 0x0031F9B6
        // after 93 gate also
        // 31F9B2    9
        // 31F9B6    6
        sceneView.setUint16(0x44A2, gateNextChain[0]); // 0x0031F9B2
      }

      // Just point to the event because we left it alone.
      return `
        J 0x80109AD8
        NOP
      `;
    }

    throw "Can't write Gate to board index " + info.boardIndex;
  }
};