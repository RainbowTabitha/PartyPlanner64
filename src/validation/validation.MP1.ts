import { getRule } from "./validationrules";
import "./validation.common";
import { Game } from "../types";

const commonRules = [
  getRule("TOOMANYGATES", { limit: 0 }),
  getRule("ADDITIONALBGCODEISSUE"),
  getRule("TOOMANYBOOS", { limit: 2 }),
  getRule("TOOMANYBOWSERS", { limit: 1 }),
  getRule("TOOMANYKOOPAS", { limit: 1 }),
  getRule("BADSTARCOUNT", { low: 7, high: 7 }),
];

export function getValidationRules(gameID: Game) {
  return commonRules.slice(0);
}
