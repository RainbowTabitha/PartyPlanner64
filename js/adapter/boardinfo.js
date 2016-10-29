PP64.ns("adapters");

// BoardInfos are a PP64-specific object that represents known info about each game board.
PP64.adapters.boardinfo = (function() {
  const _boardInfos = Object.create(null);

  const BoardInfoBase = {
    // Called when the board is being read in.
    onLoad: function(board) { },

    // Called after the board has been overwritten.
    onOverwrite: function(romView) { },
  };

  function create(id) {
    if (_boardInfos[id])
      throw `Cannot create an already existing BoardInfo ${id}.`;
    let boardInfo = Object.create(BoardInfoBase);
    _boardInfos[id] = boardInfo;
    return boardInfo;
  }

  function getBoardInfos(gameID) {
    switch(gameID) {
      case $gameType.MP1_USA:
      case $gameType.MP1_JPN:
        return PP64.adapters.boardinfo.MP1.getBoardInfos(gameID);
      case $gameType.MP2_USA:
      case $gameType.MP2_JPN:
        return PP64.adapters.boardinfo.MP2.getBoardInfos(gameID);
      case $gameType.MP3_USA:
      case $gameType.MP3_JPN:
        return PP64.adapters.boardinfo.MP3.getBoardInfos(gameID);
    }
  }

  return {
    create,
    getBoardInfos,
  };
})();
