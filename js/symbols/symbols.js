PP64.ns("symbols");

Object.assign(PP64.symbols, (function() {
  function _getSymbolNameFromGame(game) {
    switch (game) {
      case $gameType.MP1_USA: return "MarioParty1U";
      case $gameType.MP1_JPN: return "MarioParty1J";
      case $gameType.MP1_PAL: return "MarioParty1E";
      case $gameType.MP2_USA: return "MarioParty2U";
      case $gameType.MP2_JPN: return "MarioParty2J";
      case $gameType.MP2_PAL: return "MarioParty2E";
      case $gameType.MP3_USA: return "MarioParty3U";
      case $gameType.MP3_JPN: return "MarioParty3J";
      case $gameType.MP3_PAL: return "MarioParty3E";
    }

    throw "Unrecognized game type " + game;
  }

  return {
    /** Retrieves the array of symbols for a game, optionally filtered by type. */
    getSymbols: function(game, type) {
      const symName = _getSymbolNameFromGame(game);

      let symbols = PP64.symbols[symName];
      if (!symbols)
        return [];

      if (type) {
        symbols = symbols.filter(sym => {
          return sym.type === type;
        });
      }

      symbols = symbols.filter(sym => {
        return sym.name[0] !== "_"; // Filter private-ish symbols
      });

      return symbols;
    },
  };
})());
