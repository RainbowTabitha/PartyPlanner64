// CodeMirror autocompletion for MIPS / Mario Party assembly.
CodeMirror.registerHelper("hint", "mips-pp64", function(cm: any) {
  const cur = cm.getCursor();
  const token = cm.getTokenAt(cur);
  const tokenString = token.string;
  const start = token.start;
  const end = cur.ch;
  const line = cm.getLine(cur.line);
  // console.log(cur, token, start, end, line);

  if (line[0] === ".") {
    let directives = [
      "ascii",
      "asciiz",
      "align",
      "byte",
      "definelabel",
      "fill",
      "float",
      "halfword",
      // "org", would break events
      // "orga", would break events
      "skip",
      "word",
    ];
    return {
      list: directives,
      from: CodeMirror.Pos(cur.line, 1),
      to: CodeMirror.Pos(cur.line, end)
    };
  }

  const supportedGames = PP64.events.getActiveEditorSupportedGames();

  function getSymbols(games: PP64.types.Game[], type?: any) {
    if (!games.length)
      return [];
    if (games.length === 1)
      return PP64.symbols.getSymbols(games[0], type);

    // Take the intersection of the supported games' symbols.
    let result = PP64.symbols.getSymbols(games[0], type);
    for (let i = 0; i < games.length - 1; i++) {
      const nextSymbols = PP64.symbols.getSymbols(games[i + 1], type);
      result = PP64.utils.arrays.intersection(result, nextSymbols, (a, b) => {
        return a.name === b.name;
      });
    }
    return result;
  }

  const directJumps = /^(j|jal)\s+/i;
  if (directJumps.test(line)) {
    let syms = getSymbols(supportedGames, "code");
    return _showSyms(syms);
  }

  const beyondOpcode = /^\w+\s+/;
  if (beyondOpcode.test(line)) {
    let syms = getSymbols(supportedGames);
    return _showSyms(syms);
  }

  function _showSyms(symbols: PP64.symbols.ISymbol[]) {
    let syms = symbols.map(sym => {
      return sym.name;
    });
    let startOffset = 1; // Default: place sym one space after any previous value.
    if (tokenString.trim()) {
      // We should partial match.
      startOffset = tokenString.lastIndexOf("(") + 1; // From the last start of a function
      let postFnStr = tokenString.substring(startOffset);
      if (postFnStr) {
        syms = _filterByToken(tokenString, syms);
      }
    }
    return {
      list: syms.sort(),
      from: CodeMirror.Pos(cur.line, start + startOffset),
      to: CodeMirror.Pos(cur.line, end)
    };
  }

  function _filterByToken(tokenString: string, values: string[]) {
    return values.filter(value => {
      return value.startsWith(tokenString);
    });
  }
});
