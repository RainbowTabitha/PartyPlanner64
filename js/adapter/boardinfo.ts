namespace PP64.adapters.boardinfo {

  // BoardInfos are a PP64-specific object that represents known info about each game board.
  const _boardInfos = Object.create(null);

  const BoardInfoBase = {
    // Called when the board is being read in.
    onLoad: function(board: PP64.boards.IBoard) { },

    // Called after the board has been overwritten.
    onOverwrite: function(romView: DataView) { },
  };

  export function create(id: string) {
    if (_boardInfos[id])
      throw `Cannot create an already existing BoardInfo ${id}.`;
    const boardInfo = Object.create(BoardInfoBase);
    _boardInfos[id] = boardInfo;
    return boardInfo;
  }

  export function getBoardInfos(gameID: PP64.types.Game) {
    switch(gameID) {
      case $gameType.MP1_USA:
      case $gameType.MP1_JPN:
      case $gameType.MP1_PAL:
        return (PP64.adapters.boardinfo as any).MP1.getBoardInfos(gameID);
      case $gameType.MP2_USA:
      case $gameType.MP2_JPN:
      case $gameType.MP2_PAL:
        return (PP64.adapters.boardinfo as any).MP2.getBoardInfos(gameID);
      case $gameType.MP3_USA:
      case $gameType.MP3_JPN:
      case $gameType.MP3_PAL:
        return (PP64.adapters.boardinfo as any).MP3.getBoardInfos(gameID);
    }
  }

  export function getBoardInfoByIndex(gameID: PP64.types.Game, index: number) {
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
}
