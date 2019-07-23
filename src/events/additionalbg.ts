import { IBoard } from "../boards";

/** Default assembly code used for background selection. */
export const defaultAdditionalBgAsm = `; Customize the background used each turn!
; This function runs at the start of each turn.
; The default background is available as DEFAULT_BG.
; Additional backgrounds are available as ADDITIONAL_BG_#,
; e.g. ADDITIONAL_BG_1 for the first added background.
ADDIU SP SP -4
SW RA 0(SP)

; Return the background index in V0.
LI V0 DEFAULT_BG

LW RA 0(SP)
JR RA
ADDIU SP SP 4`;

export function makeFakeBgSyms(board: IBoard): number[] {
  if (!board.additionalbg)
    return [];

  let i = 0;
  return board.additionalbg.map(bg => ++i);
}