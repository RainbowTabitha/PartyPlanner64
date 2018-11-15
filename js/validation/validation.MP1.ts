import { getRule } from "./validationrules";
import { Game } from "../types";
import "./validation.common";

const commonRules = [
  getRule("TOOMANYGATES", { limit: 0 }),
];

export function getValidationRulesForBoard(gameID: Game, boardIndex: number) {
  let rules = commonRules.slice(0);
  if (boardIndex === 0) {
    rules.push(getRule("TOOMANYBOOS", { limit: 2 }));
    rules.push(getRule("TOOMANYBOWSERS", { limit: 1 }));
    rules.push(getRule("TOOMANYKOOPAS", { limit: 1 }));
    rules.push(getRule("BADSTARCOUNT", { low: 7, high: 7 }));
  }
  return rules;
}
