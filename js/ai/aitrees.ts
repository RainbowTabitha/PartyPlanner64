import { Game, GameVersion } from "../types";

export interface IDecisionTreeNode {
  type: DecisionTreeNodeType;
  data: number;
  decision: IDecisionTreeNode[] | IDecisionTreeResult;
}

export interface IDecisionTreeResult {
  value: 0 | 1;
  probability: number[]; // 3 or 4 values.
}

export enum DecisionTreeNodeType {
  leaf = 0,
  /** Node is accepted if player has the amount of coins. */
  hasCoins = 1,
  /** Node is accepted if the current star matches a flagged bit. */
  star = 2,
  /** Node is accepted if `node_data & (1 << remaining_spaces)` is non-zero. */
  remainingSpaces = 3,
  stateComparison = 4,
  winningHeuristic = 5,
  /** Node is accepted if function returns true. */
  customCode = 6,
  /** Node is accepted if the number of turns elapsed is at least equal to the value in node_data. */
  turnsElapsed = 7,
  /** Node is accepted if the player has the specified item. */
  hasItem = 8,
  // There are more, but they're in the sequels and less useful.
}

export function parseDecisionTree(view: DataView, offset: number, base: number, game: GameVersion): IDecisionTreeNode[] {
  const nodes: IDecisionTreeNode[] = [];

  let type: number;
  do {
    type = view.getUint32(offset);
    let data = view.getUint32(offset + 4);
    let decision = view.getUint32(offset + 8);
    if (decision & 0x80000000) {
      nodes.push({
        type,
        data,
        decision: parseDecisionTree(view, decision - base, base, game)
      });
    }
    else {
      nodes.push({
        type,
        data,
        decision: parseDecisionTreeResult(decision, game)
      });
    }
  }
  while(type !== DecisionTreeNodeType.leaf);

  return nodes;
}

function parseDecisionTreeResult(res: number, gameVersion: GameVersion): IDecisionTreeResult {
  if (gameVersion > 1) {
    // Decision, Super Hard, Hard, Normal, Easy
    // DDDD SSSS SSSH HHHH HHNN NNNN NEEE EEEE
    return {
      value: ((res & 0xF0000000) >>> 28) as (1 | 0),
      probability: [
        (res & 0x0FE00000) >>> 21,
        (res & 0x001FC000) >>> 14,
        (res & 0x00003F80) >>> 7,
        (res & 0x0000007F)
      ]
    };
  }
  else {
    return {
      value: ((res & 0xFFFF0000) >>> 16) as (1 | 0),
      probability: [
        (res & 0x0000FF00) >>> 8,
        (res & 0x000000FF)
      ]
    };
  }
}