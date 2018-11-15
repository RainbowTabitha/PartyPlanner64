import { IBoard } from "../boards";

// BoardInfos are a PP64-specific object that represents known info about each game board.
const _boardInfos = Object.create(null);

const BoardInfoBase = {
  // Called when the board is being read in.
  onLoad: function(board: IBoard) { },

  // Called after the board has been overwritten.
  onOverwrite: function(romView: DataView) { },
};

export function createBoardInfo(id: string) {
  if (_boardInfos[id])
    throw `Cannot create an already existing BoardInfo ${id}.`;
  const boardInfo = Object.create(BoardInfoBase);
  _boardInfos[id] = boardInfo;
  return boardInfo;
}
