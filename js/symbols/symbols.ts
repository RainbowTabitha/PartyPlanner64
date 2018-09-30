namespace PP64.symbols {
  function _getSymbolNameFromGame(game: PP64.types.Game): string {
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

  interface ISymbols {
    [symName: string]: ISymbol[];
  }

  export interface ISymbol {
    name: string;
    type: string;
    addr: number;
  }

  /** Retrieves the array of symbols for a game, optionally filtered by type. */
  export function getSymbols(game: PP64.types.Game, type: any) {
    const symName = _getSymbolNameFromGame(game);

    let symbols = (PP64.symbols as any as ISymbols)[symName];
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
  }

  /** Retrieves the value of a particular symbol. */
  export function getSymbol(game: PP64.types.Game, name: string) {
    const symName = _getSymbolNameFromGame(game);

    let symbols = (PP64.symbols as any as ISymbols)[symName];
    if (!symbols)
      throw new Error(`Symbols aren't available for ${symName}.`);

    for (let i = 0; i < symbols.length; i++) {
      if (symbols[i].name === name) {
        return symbols[i].addr;
      }
    }

    throw new Error(`Symbol ${name} wasn't found for ${symName}.`);
  }
}
