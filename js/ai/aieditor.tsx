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

  const list = root.map((node, index) =>
    <DecisionTreeNodeWrapper node={node} key={index} />
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
    list = node.decision.map((node, index) =>
      <DecisionTreeNodeWrapper node={node} key={index} />
    );
  }
  else {
    hasResult = true;
  }

  return (
    <div className="aiTreeNode">
      {getNodeConditionComponent(node)}
      {list}
      {hasResult && <DecisionTreeResult node={node} />}
    </div>
  );
}

function getNodeConditionComponent(node: IDecisionTreeNode) {
  switch (node.type) {
    case DecisionTreeNodeType.leaf:
      return null;

    case DecisionTreeNodeType.hasCoins:
      return (
        <div className="aiNodeCondition">Has {node.data} coins</div>
      );

    case DecisionTreeNodeType.star:
      return (
        <div className="aiNodeCondition">Stars: {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.remainingSpaces:
      return (
        <div className="aiNodeCondition">Player has {node.data} remaining spaces</div>
      );

    case DecisionTreeNodeType.stateComparison:
      return (
        <div className="aiNodeCondition">State {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.winningHeuristic:
      return (
        <div className="aiNodeCondition">Heuristic {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.customCode:
      return (
        <div className="aiNodeCondition">Custom function at {$$hex(node.data)}</div>
      );

    case DecisionTreeNodeType.turnsElapsed:
      return (
        <div className="aiNodeCondition">{node.data} turns elapsed</div>
      );

    case DecisionTreeNodeType.hasItem:
      return (
        <div className="aiNodeCondition">Has the {$$hex(node.data)} item</div>
      );
  }

  return (
    <div className="aiNodeCondition">Unknown Condition!</div>
  );
}

interface IDecisionTreeResultProps {
  node: IDecisionTreeNode;
}

function DecisionTreeResult(props: IDecisionTreeResultProps) {
  const result = props.node.decision as IDecisionTreeResult;

  let secondProbability;
  if (result.probability.length === 2) {
    secondProbability =
      <DecisionTreeResultDifficulty probability={result.probability[1]}
        difficultyLong="Normal / Hard" difficultyShort="N/H" />;
  }
  else {
    secondProbability =
      <DecisionTreeResultDifficulty probability={result.probability[1]}
        difficultyLong="Normal" difficultyShort="N" />;
  }

  return (
    <div>
      <span className="aiNodeDecision">{result.value}</span>
      {" @ "}
      <DecisionTreeResultDifficulty probability={result.probability[0]}
        difficultyLong="Easy" difficultyShort="E" />
      {" "}
      {secondProbability}
      {result.probability.length > 2 &&
        <>
          {" "}
          <DecisionTreeResultDifficulty probability={result.probability[2]}
            difficultyLong="Hard" difficultyShort="H" />
          {" "}
          <DecisionTreeResultDifficulty probability={result.probability[3]}
            difficultyLong="Super Hard" difficultyShort="SH" />
        </>
      }
    </div>
  );
}

interface IDecisionTreeResultDifficultyProps {
  difficultyLong: string;
  difficultyShort: string;
  probability: number;
}

function DecisionTreeResultDifficulty(props: IDecisionTreeResultDifficultyProps) {
  return <>
    <span className="aiNodeDifficulty"
      title={`Probability on ${props.difficultyLong} difficulty`}>
      {props.difficultyShort}:
    </span>
    {" "}
    <span className="aiNodeDifficulty">{props.probability}</span>
  </>;
}