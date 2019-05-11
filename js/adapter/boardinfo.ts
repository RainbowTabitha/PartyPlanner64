import { Game } from "../types";
import { getBoardInfos as getMP1UBoardInfos } from "./boardinfo.MP1.U";
import { getBoardInfos as getMP1JBoardInfos } from "./boardinfo.MP1.J";
import { getBoardInfos as getMP2BoardInfos } from "./boardinfo.MP2";
import { getBoardInfos as getMP3BoardInfos } from "./boardinfo.MP3";
import { IBoardInfo } from "./boardinfobase";

export function getBoardInfos(gameID: Game): IBoardInfo[] {
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

export function getBoardInfoByIndex(gameID: Game, index: number): IBoardInfo {
  return getBoardInfos(gameID)[index];
}

export function getArrowRotationLimit(boardInfo: any) {
  // 8 arrows is the imposed restriction by the game.
  return 8;
}
