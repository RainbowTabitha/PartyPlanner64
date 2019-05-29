import * as React from "react";
import * as ReactDOM from "react-dom";
import { IDecisionTreeNode, DecisionTreeNodeType, IDecisionTreeResult } from "./aitrees";
import { $$hex } from "../utils/debug";

interface IDecisionTreeEditorProps {
  root: IDecisionTreeNode[];
}

export function DecisionTreeEditor(props: IDecisionTreeEditorProps) {
  const root = props.root;
  if (!root) {
    return (
      <div>No decision tree provided.</div>
    );
  }

  const list = root.map(node =>
    <DecisionTreeNodeWrapper node={node} />
  );

  return (
    <div className="aiEditor">
      {list}
    </div>
  );
}

interface IDecisionTreeNodeWrapperProps {
  node: IDecisionTreeNode;
}

function DecisionTreeNodeWrapper(props: IDecisionTreeNodeWrapperProps) {
  const node = props.node;

  let hasResult = false;
  let list;
  if (Array.isArray(node.decision)) {
    list = node.decision.map(node =>
      <DecisionTreeNodeWrapper node={node} />
    );
  }
  else {
    hasResult = true;
  }

  return (
    <div>
      {getNodeConditionComponent(node)}
      {list}
      {hasResult && <DecisionTreeResult node={node} />}
    </div>
  );
}

function getNodeConditionComponent(node: IDecisionTreeNode) {
  switch (node.type) {
    case DecisionTreeNodeType.leaf:
      return (
        <div>----</div>
      );

    case DecisionTreeNodeType.hasCoins:
      return (
        <div>Has {node.data} coins</div>
      );

    case DecisionTreeNodeType.star:
      return (
        <div>Stars: {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.remainingSpaces:
      return (
        <div>Player has {$$hex(node.data)} remaining spaces</div>
      );

    case DecisionTreeNodeType.stateComparison:
      return (
        <div>State {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.winningHeuristic:
      return (
        <div>Heuristic {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.customCode:
      return (
        <div>Custom function at {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.hasItem:
      return (
        <div>Has the {$$hex(node.data)} item</div>
      );
  }
}

interface IDecisionTreeResultProps {
  node: IDecisionTreeNode;
}

function DecisionTreeResult(props: IDecisionTreeResultProps) {
  const result = props.node.decision as IDecisionTreeResult;
  return (
    <div>
      <span>{result.value}</span>
      <span title="Probability on Easy difficulty">E: </span>
      <span>{result.probability[0]}</span>
      <span title="Probability on Normal difficulty">N: </span>
      <span>{result.probability[1]}</span>
      <span title="Probability on Hard difficulty">H: </span>
      <span>{result.probability[2]}</span>
      {result.probability.length > 3 &&
        <>
          <span title="Probability on Super Hard difficulty">SH: </span>
          <span>{result.probability[3]}</span>
        </>
      }
    </div>
  );
}