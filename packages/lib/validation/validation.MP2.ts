import { getRule } from "./validationrules";
import { getArrowRotationLimit } from "../adapter/boardinfo";
import { Game } from "../types";
import "./validation.common";

const commonRules = [
  getRule("TOOMANYBOWSERS", { limit: 0 }),
  getRule("TOOMANYKOOPAS", { limit: 0 }),
  getRule("TOOMANYGATES", { limit: 0 }), // Someday
];

export function getValidationRules(gameID: Game) {
  const rules = commonRules.slice(0);

  const totalArrowsToWrite = getArrowRotationLimit();
  rules.push(getRule("TOOMANYARROWROTATIONS", { limit: totalArrowsToWrite }));

  return rules;
}

export function getValidationRulesForBoard(gameID: Game, boardIndex: number) {
  if (boardIndex === 0) {
    return [
      getRule("TOOMANYBANKS", { limit: 2 }),
      getRule("TOOMANYITEMSHOPS", { limit: 1 }),
      getRule("TOOMANYBOOS", { limit: 2 }),
      getRule("BADSTARCOUNT", { low: 7, high: 7 }),
    ];
  }

  return [];
}
