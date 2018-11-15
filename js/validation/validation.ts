import { IBoard, getROMBoards, getCurrentBoard } from "../boards";
import { ValidationLevel, Game, BoardType } from "../types";
import { romhandler } from "../romhandler";
import { getValidationRulesForBoard as getValidationRulesForMP1 } from "./validation.MP1";
import { getValidationRulesForBoard as getValidationRulesForMP2 } from "./validation.MP2";
import { getValidationRulesForBoard as getValidationRulesForMP3 } from "./validation.MP3";
import { get, $setting } from "../settings";
import { getRule, IValidationRule } from "./validationrules";

function _overwriteAvailable(boardIndex: number) {
  return boardIndex === 0 || get($setting.uiSkipValidation);
}

function _dontShowInUI(romBoard: IBoard, boardIndex: number, boardType: BoardType) {
  if (typeof boardType !== "string") {
    // Because default is normal
    return romBoard.type === BoardType.DUEL;
  }
  return romBoard.type !== boardType;
}

function _getRulesForBoard(gameID: Game, boardIndex: number): IValidationRule[] {
  let rules = [
    getRule("HASSTART"),
    getRule("GAMEVERSION"),
    getRule("DEADEND"),
    getRule("TOOMANYSPACES"),
    getRule("UNRECOGNIZEDEVENTS"),
    getRule("UNSUPPORTEDEVENTS"),
    getRule("CUSTOMEVENTFAIL"),
    getRule("CUSTOMEVENTBADPARAMS"),
    getRule("TOOMANYPATHOPTIONS"),
    getRule("CHARACTERSONPATH"),
    getRule("SPLITATNONINVISIBLESPACE"),
  ];

  switch(gameID) {
    case Game.MP1_USA:
    case Game.MP1_JPN:
      rules = rules.concat(getValidationRulesForMP1(gameID, boardIndex));
      break;
    case Game.MP2_USA:
    case Game.MP2_JPN:
      rules = rules.concat(getValidationRulesForMP2(gameID, boardIndex));
      break;
    case Game.MP3_USA:
    case Game.MP3_JPN:
      rules = rules.concat(getValidationRulesForMP3(gameID, boardIndex));
      break;
  }

  return rules;
}

interface IValidationResult {
  name: string;
  unavailable: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCurrentBoardForOverwrite() {
  let gameID = romhandler.getROMGame()!;
  if (!gameID)
    return null;

  let results: IValidationResult[] = [];
  let romBoards = getROMBoards();
  let currentBoard = getCurrentBoard();
  romBoards.forEach((board, boardIndex) => {
    if (_dontShowInUI(board, boardIndex, currentBoard.type))
      return;

    let unavailable = !_overwriteAvailable(boardIndex);

    let errors: string[] = [];
    let warnings: string[] = [];
    if (!unavailable && !get($setting.uiSkipValidation)) {
      let rules = _getRulesForBoard(gameID, boardIndex);
      rules.forEach(rule => {
        let args;
        if (Array.isArray(rule)) {
          [rule, args] = rule;
        }
        let failureResult = rule.fails(currentBoard, args);
        if (failureResult) {
          if (rule.level === ValidationLevel.ERROR)
            errors.push(failureResult);
          else if (rule.level === ValidationLevel.WARNING)
            warnings.push(failureResult);
        }
      });
    }

    results.push({
      name: board.name,
      unavailable,
      errors,
      warnings,
    });
  });

  return results;
}
