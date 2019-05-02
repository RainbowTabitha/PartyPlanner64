import { IEventWriteInfo, IEvent } from "./events";
import { getSymbols } from "../symbols/symbols";
import { getChainIndexValuesFromAbsoluteIndex } from "../adapter/boarddef";
import { Game, EventParameterType } from "../types";
import { $$hex } from "../utils/debug";
import { ISpaceEvent } from "../boards";
import { ParametricBufferGeometry } from "three";

/**
 * Takes event asm, and makes it assemble (in isolation)
 */
export function prepAsm(asm: string, event: IEvent, spaceEvent: ISpaceEvent, info: IEventWriteInfo) {
  const orgDirective = `.org ${$$hex(info.addr!)}`;
  const syms = makeGameSymbolLabels(info.game);
  const parameterSymbols = makeParameterSymbolLabels(event, spaceEvent, info);
  return [
    orgDirective,
    ...syms,
    ...parameterSymbols,
    asm,
    ".align 4", // it better!
  ].join("\n");
}

export function prepSingleEventAsm(
  asm: string, event: IEvent, spaceEvent: ISpaceEvent, info: IEventWriteInfo, keepStatic: boolean, eventNum: number): string
{
  return scopeLabelsStaticByDefault(`
    .beginfile ; Scopes static labels
    __PP64_INTERNAL_EVENT_${info.curSpaceIndex}_${eventNum}:
    ${makeParameterSymbolLabels(event, spaceEvent, info).join("\n")}
    ${asm}
    .align 4
    .endfile
  `, keepStatic);
}

export function makeGameSymbolLabels(game: Game) {
  const symbols = getSymbols(game);
  const syms = symbols.map(symbol => {
    return `.definelabel ${symbol.name},0x${symbol.addr.toString(16)}`;
  });
  return syms;
}

export function makeParameterSymbolLabels(event: IEvent, spaceEvent: ISpaceEvent, info: IEventWriteInfo): string[] {
  let parameterSymbols: string[] = [];
  const parameters = event.parameters;
  const parameterValues = spaceEvent.parameterValues;
  if (parameters && parameters.length && parameterValues) {
    parameters.forEach(parameter => {
      const parameterValue = parameterValues[parameter.name];
      switch (parameter.type) {
        case EventParameterType.Boolean:
          parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue ? 1 : 0}`);
          break;

        case EventParameterType.Space:
          parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue}`);
          if (info.chains) {
            const indices = getChainIndexValuesFromAbsoluteIndex(info.chains, parameterValue as number);
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_index,${indices[0]}`);
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_space_index,${indices[1]}`);
          }
          else {
            // Mostly for testAssemble
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_index,-1`);
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_space_index,-1`);
          }
          break;

        case EventParameterType.Number:
          if (typeof parameterValue === "number") {
            parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue}`);
          }
          break;

        case EventParameterType.NumberArray:
          break; // TODO: Maybe expose labels for these?

        default:
          if (typeof parameterValue !== "undefined" && parameterValue !== null) {
            parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue}`);
          }
          break;
      }
    })
  }
  return parameterSymbols;
}

/**
 * Events are written assuming their global labels are scoped to themselves,
 * but during assembly they need to be scoped using the static labels feature.
 */
export function scopeLabelsStaticByDefault(asm: string, keepStatic: boolean): string {
  const lines = asm.split("\n").map(line => line.trim())

  // We always find labels to scope without static sections...
  const asmWithoutStaticSections = removeStaticSections(lines, keepStatic).join("\n");
  const labels = findLabelsToScope(asmWithoutStaticSections);

  // But only keep the static section when replacing the first time.
  asm = keepStatic ? replaceStaticRegionDirectives(lines) : asmWithoutStaticSections;

  const labelCharRegex = /[@\w\!\?]/;
  labels.forEach(label => {
    let currentIndex = -1;
    do {
      currentIndex = asm.indexOf(label, currentIndex);
      if (currentIndex >= 0) {
        if (currentIndex > 0) {
          const prevChar = asm[currentIndex - 1];
          if (labelCharRegex.test(prevChar)) {
            // Something odd comes before this instance of the label.
            currentIndex += label.length;
            continue;
          }
        }
        if (currentIndex + label.length < asm.length) {
          const nextChar = asm[currentIndex + label.length];
          if (labelCharRegex.test(nextChar)) {
            // Something odd comes after this instance of the label.
            currentIndex += label.length;
            continue;
          }
        }

        asm = asm.slice(0, currentIndex) + "@" + asm.slice(currentIndex);
        currentIndex += label.length + 1;
      }
    } while (currentIndex >= 0);
  });

  return asm;
}

function findLabelsToScope(asm: string): string[] {
  const defineLabelRegex = /\.definelabel\s+([^,]+)/gi;
  const labelRegex = /([@\w\!\?]+):/gi;
  let labels = getAllMatches(defineLabelRegex, asm).concat(getAllMatches(labelRegex, asm));
  labels = labels.filter(label => {
    if (label.indexOf("__PP64_INTERNAL") >= 0) {
      return false; // Don't scope internal labels.
    }
    if (label[0] === "@") {
      return false; // Don't scope already somewhat-scoped labels.
    }

    return true;
  });

  return labels;
}

function getAllMatches(regex: RegExp, str: string): string[] {
  const matches = [];
  let match;
  do {
    match = regex.exec(str);
    if (match) {
      matches.push(match[1]);
    }
  } while (match);
  return matches;
}

function removeStaticSections(lines: string[], keepingStatics: boolean): string[] {
  let withinStatic = false;
  let filteredLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === ".beginstatic") {
      if (withinStatic) {
        throw new Error("Cannot repeat .beginstatic within a static section");
      }
      withinStatic = true;
      if (!keepingStatics) {
        filteredLines.push("; omitted statics");
      }
      continue;
    }
    else if (lines[i] === ".endstatic") {
      if (!withinStatic) {
        throw new Error("Saw .endstatic without .beginstatic");
      }
      withinStatic = false;
      continue;
    }

    if (!withinStatic) {
      filteredLines.push(lines[i]);
    }
  }

  if (withinStatic) {
    throw new Error("Saw .beginstatic without .endstatic");
  }

  return filteredLines;
}

/** Just comments out the .beginstatic and .endstatic lines */
function replaceStaticRegionDirectives(lines: string[]): string {
  let adjustedLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === ".beginstatic") {
      adjustedLines.push("; .beginstatic");
    }
    else if (lines[i] === ".endstatic") {
      adjustedLines.push("; .endstatic");
    }
    else {
      adjustedLines.push(lines[i]);
    }
  }

  return adjustedLines.join("\n");
}
