import { mpFormatToPlainText } from "../../../packages/lib/utils/string";
import { getCurrentBoard } from "../boards";

export function updateWindowTitle(boardName: string) {
  boardName = boardName || getCurrentBoard().name;
  boardName = mpFormatToPlainText(boardName);
  document.title = boardName
    ? `PartyPlanner64 - ${boardName}`
    : "PartyPlanner64";
}
