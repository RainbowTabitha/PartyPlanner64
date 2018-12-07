import { ICustomEventParameter } from "./customevents";
import { IEventWriteInfo } from "./events";
import { getSymbols } from "../symbols/symbols";
import { getChainIndexValuesFromAbsoluteIndex } from "../adapter/boarddef";

/**
 * Takes the event asm that someone wrote and merges in all the assumed
 * global variables.
 */
export function prepAsm(asm: string, parameters: ICustomEventParameter[] | undefined, info: IEventWriteInfo) {
  const orgDirective = `.org 0x${info.addr.toString(16)}`;

  let symbols = getSymbols(info.game);
  let syms = symbols.map(symbol => {
    return `.definelabel ${symbol.name},0x${symbol.addr.toString(16)}`;
  });

  // TODO: Remove this hack
  if (info.gameVersion === 1) {
    syms.push(".definelabel __PP64_INTERNAL_GET_NEXT_TOAD_INDEX,0x800F6610");
    syms.push(".definelabel __PP64_STAR_SPACE_INTERNAL,0x800F6958"); // TODO: Probably wrong now
  }

  let parameterSymbols: string[] = [];
  if (parameters && parameters.length && info && info.parameterValues) {
    parameters.forEach(parameter => {
      const parameterValue = info.parameterValues[parameter.name];
      switch (parameter.type) {
        case "Boolean":
          parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue ? 1 : 0}`);
          break;

        case "Space":
          parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue}`);
          if (info.chains) {
            const indices = getChainIndexValuesFromAbsoluteIndex(info.chains, parameterValue);
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_index,${indices[0]}`);
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_space_index,${indices[1]}`);
          }
          else {
            // Mostly for testAssemble
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_index,-1`);
            parameterSymbols.push(`.definelabel ${parameter.name}_chain_space_index,-1`);
          }
          break;

        default:
          parameterSymbols.push(`.definelabel ${parameter.name},${parameterValue}`);
          break;
      }
    })
  }

  return [
    orgDirective,
    ...syms,
    ...parameterSymbols,
    asm,
    ".align 4", // it better!
  ].join("\n");
}
