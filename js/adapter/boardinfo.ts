import { Game } from "../types";
import { getBoardInfos as getMP1UBoardInfos } from "./boardinfo.MP1.U";
import { getBoardInfos as getMP1JBoardInfos } from "./boardinfo.MP1.J";
import { getBoardInfos as getMP2BoardInfos } from "./boardinfo.MP2";
import { getBoardInfos as getMP3BoardInfos } from "./boardinfo.MP3";

export function getBoardInfos(gameID: Game): any[] {
  switch(gameID) {
    case Game.MP1_USA:
      return getMP1UBoardInfos();
    case Game.MP1_JPN:
      return getMP1JBoardInfos();
    case Game.MP2_USA:
      return getMP2BoardInfos();
    case Game.MP3_USA:
      return getMP3BoardInfos();
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
