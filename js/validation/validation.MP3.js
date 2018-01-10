PP64.ns("validation");

PP64.validation.MP3 = (function() {
  const commonRules = [
    PP64.validation.getRule("TOOMANYBOWSERS", { limit: 0 }),
    PP64.validation.getRule("TOOMANYKOOPAS", { limit: 0 }),
    PP64.validation.getRule("GATESETUP"),
    PP64.validation.getRule("OVERRECOMMENDEDSPACES", { max: 128 }),
  ];

  function getValidationRulesForBoard(boardIndex) {
    let rules = commonRules.slice(0);
    if (boardIndex === 0) {
      rules.push(PP64.validation.getRule("TOOMANYOFEVENT", { event: PP64.adapters.events.getEvent("BANK"), high: 2 }));
      rules.push(PP64.validation.getRule("TOOMANYBANKS", { limit: 2 }));
      rules.push(PP64.validation.getRule("TOOMANYOFEVENT", { event: PP64.adapters.events.getEvent("ITEMSHOP"), high: 2 }));
      rules.push(PP64.validation.getRule("TOOMANYITEMSHOPS", { limit: 2 }));
      rules.push(PP64.validation.getRule("TOOMANYOFEVENT", { event: PP64.adapters.events.getEvent("BOO"), high: 1 }));
      rules.push(PP64.validation.getRule("TOOMANYBOOS", { limit: 1 }));
      rules.push(PP64.validation.getRule("TOOMANYGATES", { limit: 2 }));

      // TODO: gamemasterplc: if you want to fix being able to pick up stars with few of them @PartyPlanner64 overwrite rom offset 0x320058 with all zeroes
      rules.push(PP64.validation.getRule("BADSTARCOUNT", { low: 8, high: 8 }));

      // No longer needed? See MP3 onAfterOverwrite.
      //rules.push(PP64.validation.getRule("TOOFEWBLUESPACES", { low: 14 }));
      //rules.push(PP64.validation.getRule("TOOFEWREDSPACES", { low: 1 }));
    }
    return rules;
  }

  return {
    getValidationRulesForBoard,
  };
})();
