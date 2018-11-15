import { Game } from "../types";
import { getBoardInfos as getMP1BoardInfos } from "./boardinfo.MP1";
import { getBoardInfos as getMP2BoardInfos } from "./boardinfo.MP2";
import { getBoardInfos as getMP3BoardInfos } from "./boardinfo.MP3";

export function getBoardInfos(gameID: Game): any[] {
  switch(gameID) {
    case Game.MP1_USA:
    case Game.MP1_JPN:
    case Game.MP1_PAL:
      return getMP1BoardInfos(gameID)!;
    case Game.MP2_USA:
    case Game.MP2_JPN:
    case Game.MP2_PAL:
      return getMP2BoardInfos(gameID)!;
    case Game.MP3_USA:
    case Game.MP3_JPN:
    case Game.MP3_PAL:
      return getMP3BoardInfos(gameID)!;
  }

  throw new Error("Missing boardinfo for " + gameID);
}

export function getBoardInfoByIndex(gameID: Game, index: number) {
  return getBoardInfos(gameID)[index];
}

export function getArrowRotationLimit(boardInfo: any) {
  const { arrowRotStartOffset, arrowRotEndOffset } = boardInfo;
  if (!arrowRotStartOffset)
    return 0;

  // 8 arrows is the imposed restriction by the game.
  // We may be further restricted by the space available.
  // We can write 1 rotation angle with 3 instructions.
  const bytesAvailable = arrowRotEndOffset - arrowRotStartOffset;
  const instructionsAvailable = Math.floor(bytesAvailable / 4);
  const numArrowBlocks = Math.floor(instructionsAvailable / 3);
  return Math.min(8, numArrowBlocks);
}
