import { createEvent, IEvent, IEventParseInfo, IEventWriteInfo } from "../events";
import { EventActivationType, EventExecutionType, Game } from "../../types";
import { hashEqual, copyRange } from "../../utils/arrays";
import { addConnection } from "../../boards";
import { prepAsm } from "../prepAsm";
import { assemble } from "mips-assembler";

interface IChainSplitEvent extends IEvent {
  chains: number[];
}

// Represents the "event" where the player decides between two paths.
// This won't be an actual event when exposed to the user.
export const ChainSplit1 = createEvent("CHAINSPLIT1", "");
ChainSplit1.activationType = EventActivationType.WALKOVER;
ChainSplit1.executionType = EventExecutionType.PROCESS;
ChainSplit1.fakeEvent = true;
ChainSplit1.supportedGames = [
  Game.MP1_USA,
];

ChainSplit1.parse = function(dataView: DataView, info: IEventParseInfo) {
  let hashes = {
    // From Mario Rainbow Castle / Luigi Engine Room:
    METHOD_START: "597324F65BC9A4D0BCA9527477258625", // +0x2C
    METHOD_MID1: "E276F5BAE352AC662ADCA86793409B62", // [0x30]+0x18
    METHOD_MID2: "24FBEBD7FA3B256016D536690EF70AD8", // [0x4C]+0x1C
    METHOD_END: "F153076BBD19ECBB4967EFC92CD738DF" // [0xE0]+0x28
  };

  // Match a few sections to see if we match.
  if (hashEqual([dataView.buffer, info.offset, 0x2C], hashes.METHOD_START) &&
      //hashEqual([dataView.buffer, info.offset + 0x30, 0x18], hashes.METHOD_MID1) &&
      hashEqual([dataView.buffer, info.offset + 0x4C, 0x1C], hashes.METHOD_MID2) &&
      hashEqual([dataView.buffer, info.offset + 0xE0, 0x28], hashes.METHOD_END)) {
    // Read the chain indices.
    let leftChain = dataView.getUint16(info.offset + 0xDA);
    let rightChain = dataView.getUint16(info.offset + 0xDE);

    let leftSpace = info.chains[leftChain][0]; // Technically, we should check if A2 is really R0.
    let rightSpace = info.chains[rightChain][0];

    addConnection(info.curSpace, leftSpace, info.board);
    addConnection(info.curSpace, rightSpace, info.board);

    return true;
  }

  return false;
};
ChainSplit1.write = function(dataView: DataView, event: IChainSplitEvent, info: IEventWriteInfo, temp: any) {
  const asm = prepAsm(`
      ADDIU SP SP 0xFFD8
      SW RA 0x24(SP)
      SW S2 0x20(SP)
      SW S1 0x1C(SP)
      SW S0 0x18(SP)

      ; Change player to standing animation?
      ADDIU A0 R0 -1
      ADDIU A1 R0 -1
      JAL 0x80052BE8
      ADDIU A2 R0 2

      JAL SleepVProcess
      NOP
      JAL setup_arrows
      NOP
      LUI S0 0x800F
      ADDIU S0 S0 0xD5DC ; 0x800ED5DC
      LH A0 0(S0)
      LUI A1 hi(${info.argsAddr!})
      JAL 0x8003C218
      ADDIU A1 A1 lo(${info.argsAddr!})
      ADDU S2 V0 R0
      ADDU A0 S2 R0
      LH A1 0(S0)
      JAL 0x8003C060
      ADDU A2 R0 R0
      JAL PlayerIsCPU
      ADDIU A0 R0 -1
      BEQ V0 R0 do_direction_prompt
      NOP
      LUI A0 hi(ai_logic)
      ADDIU A0 A0 lo(ai_logic)
      JAL 0x8003E9B0
      ADDU S0 R0 R0
      SLL V0 V0 0x10
      SRA S1 V0 0x10
      BLEZ S1 choice_neg
      ADDU A0 S2 R0
    choice_pos:
      JAL 0x8003BE84
      ADDIU A1 R0 0xFFFE
      ADDIU S0 S0 1
      SLT V0 S0 S1
      BNE V0 R0 choice_pos
      ADDU A0 S2 R0
    choice_neg:
      JAL 0x8003BE84
      ADDIU A1 R0 0xFFFC
    do_direction_prompt:
      JAL 0x8003C14C ; DirectionPrompt
      ADDU A0 S2 R0
      ADDU S0 V0 R0
      JAL 0x8003B908
      ADDU A0 S2 R0
      JAL hide_arrows
      NOP
      BNE S0 R0 set_chain_right
      ADDIU A0 R0 -1
      J set_chain
      ADDIU A1 R0 ${event.chains[0]}
    set_chain_right:
      ADDIU A1 R0 ${event.chains[1]}
    set_chain:
      JAL SetNextChainAndSpace
      ADDU A2 R0 R0 ; 0th space of the chain
      JAL 0x8005DD90
      ADDU A0 R0 R0
      LW RA 0x24(SP)
      LW S2 0x20(SP)
      LW S1 0x1C(SP)
      LW S0 0x18(SP)
      JR RA
      ADDIU SP SP 0x28

    .definelabel CORE_800EE320,0x800EE320

    setup_arrows:
      addiu SP, SP, -0x18
      sw    RA, 0x10(SP)
    setup_arrows_loop1:
      jal   0x8004B850 ; waiting for this to signal
      NOP
      beq  V0, R0, setup_arrows_loop1_exit
      NOP
      jal   SleepVProcess
      NOP
      j     setup_arrows_loop1
      NOP
    setup_arrows_loop1_exit:
      jal   SleepVProcess
      NOP
      addu  A0, R0, R0
      addiu    A1, R0, 146
      jal   0x80045D84
      addiu    A2, R0, 1
      lui   AT, hi(memval1)
      sw    V0, lo(memval1)(AT)
      addiu    A0, R0, 1
      addiu    A1, R0, 160
      jal   0x80045D84
      addiu    A2, R0, 1
      lui   AT, hi(memval2)
      sw    V0, lo(memval2)(AT)
      addiu    A0, R0, 3
      addiu    A1, R0, 174
      jal   0x80045D84
      addiu    A2, R0, 1
      lui   AT, hi(memval3)
      sw    V0, lo(memval3)(AT)
      addiu    A0, R0, 11
      addiu    A1, R0, 188
      jal   0x80045D84
      addiu    A2, R0, 1
      lui   AT, hi(memval4)
      sw    V0, lo(memval4)(AT)
      jal   SleepProcess
      addiu    A0, R0, 3
      addiu    V0, R0, 1
      lui   AT, hi(CORE_800EE320)
      sh    V0, lo(CORE_800EE320)(AT)
      lw    RA, 0x10(SP)
      jr    RA
      addiu SP, SP, 0x18

    hide_arrows:
      addiu SP, SP, -0x18
      sw    RA, 0x10(SP)
      lui   AT, hi(CORE_800EE320)
      sh    R0, lo(CORE_800EE320)(AT)
      lui   A0, hi(memval1)
      jal   0x80045E6C
      lw    A0, lo(memval1)(A0)
      lui   A0, hi(memval2)
      jal   0x80045E6C
      lw    A0, lo(memval2)(A0)
      lui   A0, hi(memval3)
      jal   0x80045E6C
      lw    A0, lo(memval3)(A0)
      lui   A0, hi(memval4)
      jal   0x80045E6C
      lw    A0, lo(memval4)(A0)
      lw    RA, 0x10(SP)
      jr    RA
      addiu SP, SP, 0x18

    .align 4
    memval1:
      .word 0
    memval2:
      .word 0
    memval3:
      .word 0
    memval4:
      .word 0

    ; Choose randomly
    ai_logic:
      .word 0x00000000, 0x00000000, 0x00003232
  `, undefined, info);
  const bytes = assemble(asm) as ArrayBuffer;
  copyRange(dataView, bytes, 0, 0, bytes.byteLength);
  return [info.offset, bytes.byteLength];
};
