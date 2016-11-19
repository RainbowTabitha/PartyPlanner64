PP64.ns("validation");

PP64.validation.MP1 = (function() {
  const commonRules = [
    PP64.validation.getRule("TOOMANYGATES", { limit: 0 }),
  ];

  function getValidationRulesForBoard(boardIndex) {
    let rules = commonRules.slice(0);
    if (boardIndex === 0) {
      rules.push(PP64.validation.getRule("TOOMANYBOOS", { limit: 2 }));
      rules.push(PP64.validation.getRule("TOOMANYBOWSERS", { limit: 1 }));
      rules.push(PP64.validation.getRule("TOOMANYKOOPAS", { limit: 1 }));
      rules.push(PP64.validation.getRule("BADSTARCOUNT", { low: 7, high: 7 }));
    }
    return rules;
  }

  return {
    getValidationRulesForBoard,
  };
})();
