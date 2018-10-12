namespace PP64.validation.MP2 {
  const commonRules = [
    PP64.validation.getRule("TOOMANYBOWSERS", { limit: 0 }),
    PP64.validation.getRule("TOOMANYKOOPAS", { limit: 0 }),
    PP64.validation.getRule("TOOMANYGATES", { limit: 0 }), // Someday
  ];

  export function getValidationRulesForBoard(gameID: PP64.types.Game, boardIndex: number) {
    const rules = commonRules.slice(0);
    const boardInfo = PP64.adapters.boardinfo.getBoardInfoByIndex(gameID, boardIndex);

    const totalArrowsToWrite = PP64.adapters.boardinfo.getArrowRotationLimit(boardInfo);
    rules.push(PP64.validation.getRule("TOOMANYARROWROTATIONS", { limit: totalArrowsToWrite }));

    if (boardIndex === 0) {
      rules.push(PP64.validation.getRule("TOOMANYBANKS", { limit: 2 }));
      rules.push(PP64.validation.getRule("TOOMANYITEMSHOPS", { limit: 1 }));
      rules.push(PP64.validation.getRule("TOOMANYBOOS", { limit: 2 }));
      rules.push(PP64.validation.getRule("BADSTARCOUNT", { low: 7, high: 7 }));
    }
    return rules;
  }
}
