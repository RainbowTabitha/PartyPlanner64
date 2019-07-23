import { getRule } from "./validationrules";
import { getBoardInfoByIndex, getArrowRotationLimit } from "../adapter/boardinfo";
import { Game } from "../types";
import "./validation.common";

const commonRules = [
  getRule("TOOMANYBOWSERS", { limit: 0 }),
  getRule("TOOMANYKOOPAS", { limit: 0 }),
  getRule("TOOMANYGATES", { limit: 0 }), // Someday
];

export function getValidationRulesForBoard(gameID: Game, boardIndex: number) {
  const rules = commonRules.slice(0);
  const boardInfo = getBoardInfoByIndex(gameID, boardIndex);

  const totalArrowsToWrite = getArrowRotationLimit(boardInfo);
  rules.push(getRule("TOOMANYARROWROTATIONS", { limit: totalArrowsToWrite }));

  if (boardIndex === 0) {
    rules.push(getRule("TOOMANYBANKS", { limit: 2 }));
    rules.push(getRule("TOOMANYITEMSHOPS", { limit: 1 }));
    rules.push(getRule("TOOMANYBOOS", { limit: 2 }));
    rules.push(getRule("BADSTARCOUNT", { low: 7, high: 7 }));
  }
  return rules;
}
