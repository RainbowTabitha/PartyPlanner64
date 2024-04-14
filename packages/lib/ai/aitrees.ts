import { GameVersion } from "../types";

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

export function parseDecisionTree(
  view: DataView,
  offset: number,
  base: number,
  game: GameVersion,
): IDecisionTreeNode[] {
  const nodes: IDecisionTreeNode[] = [];

  let type: number;
  do {
    type = view.getUint8(offset);
    const data = view.getUint32(offset + 4);
    const decision = view.getUint32(offset + 8);
    if (decision & 0x80000000) {
      nodes.push({
        type,
        data,
        decision: parseDecisionTree(
          view,
          (decision & 0x7fffffff) - base,
          base,
          game,
        ),
      });
    } else {
      nodes.push({
        type,
        data,
        decision: parseDecisionTreeResult(decision, game),
      });
    }
    offset += 12;
  } while (type !== DecisionTreeNodeType.leaf);

  return nodes;
}

function parseDecisionTreeResult(
  res: number,
  gameVersion: GameVersion,
): IDecisionTreeResult {
  if (gameVersion === 3) {
    // Decision, Super Hard, Hard, Normal, Easy
    // DDDD SSSS SSSH HHHH HHNN NNNN NEEE EEEE
    return {
      value: ((res & 0xf0000000) >>> 28) as 1 | 0,
      probability: [
        res & 0x0000007f,
        (res & 0x00003f80) >>> 7,
        (res & 0x001fc000) >>> 14,
        (res & 0x0fe00000) >>> 21,
      ],
    };
  } else {
    return {
      value: ((res & 0xffff0000) >>> 16) as 1 | 0,
      probability: [res & 0x000000ff, (res & 0x0000ff00) >>> 8],
    };
  }
}
