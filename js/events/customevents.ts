/// <reference types="mips-assembler" />

import { IEvent, IEventWriteInfo, IEventParseInfo, createEvent } from "./events";
import { getSavedEvents } from "../utils/localstorage";
import { getSymbols } from "../symbols/symbols";
import { $$log } from "../utils/debug";
import { copyRange } from "../utils/arrays";
import { EventActivationType, getGameName, Game, getExecutionTypeByName, EventParameterTypes } from "../types";
import { assemble } from "mips-assembler";
import { getChainIndexValuesFromAbsoluteIndex } from "../adapter/boarddef";

export interface ICustomEventParameter {
  name: string;
  type: string;
}

export interface ICustomEvent extends IEvent {
  asm: string;
  parameters: ICustomEventParameter[];
}

export const CustomAsmHelper = {
  readDiscreteProperty: function(asm: string, propName: string) {
    const regex = new RegExp("^\\s*[;\\/]+\\s*" + propName + ":(.+)$", "gim");
    let regexMatch = regex.exec(asm);
    if (regexMatch) {
      return regexMatch[1];
    }
    return null;
  },

  readDiscretePropertySet: function(asm: string, propName: string) {
    const regex = new RegExp("^\\s*[;\\/]+\\s*" + propName + ":(.+)$", "gim");
    let lastFind = null;
    const matches = [];
    do {
      lastFind = regex.exec(asm);
      if (lastFind) {
        matches.push(lastFind[1].trim());
      }
    } while (lastFind);
    return matches;
  },

  readSupportedGames: function(asm: string): Game[] | null {
    let value = CustomAsmHelper.readDiscreteProperty(asm, "GAMES");
    if (value !== null) {
      let ids: string[] = value.trim().split(",");
      const supportedGames = [];
      for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        if ((Game as any)[id]) {
          supportedGames.push((Game as any)[id]);
        }
      }
      return supportedGames;
    }
    return null;
  },

  readExecutionType: function(asm: string) {
    let value = CustomAsmHelper.readDiscreteProperty(asm, "EXECUTION");
    if (value) {
      return getExecutionTypeByName(value.trim());
    }
  },

  readParameters: function(asm: string) {
    const entryStrings = CustomAsmHelper.readDiscretePropertySet(asm, "PARAM");
    const parameters: ICustomEventParameter[] = [];
    entryStrings.forEach(entryStr => {
      const pieces = entryStr.split("|");
      if (pieces.length !== 2)
        return;
      const parameter = {
        name: pieces[1],
        type: pieces[0]
      };
      try {
        CustomAsmHelper.validateParameters([parameter]);
        parameters.push(parameter);
      }
      catch (e) {} // It's invalid, just skip it.
    });
    return parameters;
  },

  validParameterNameRegex: /^[\w\?\!]*$/,

  validateParameters: function(parameters: ICustomEventParameter[]) {
    if (!parameters)
      return;
    parameters.forEach(parameter => {
      if (!parameter.name)
        throw new Error("An event parameter didn't have a name");
      if (!parameter.type)
        throw new Error("An event parameter didn't have a type");
      if (!parameter.name.match(CustomAsmHelper.validParameterNameRegex))
        throw new Error(`Event parameter name '${parameter.name}' is not valid`);
      if (EventParameterTypes.indexOf(parameter.type) === -1)
        throw new Error(`Event parameter type ${parameter.type} is not recognized`);
    });
  },

  /** Does a test assembly of a custom event. */
  testAssemble: function(asm: string, parameters?: ICustomEventParameter[], info: Partial<IEventWriteInfo> = {}) {
    // Make fake parameterValues
    const parameterValues: any = {};
    if (parameters && parameters.length) {
      parameters.forEach(parameter => {
        parameterValues[parameter.name] = 0;
      });
    }

    const preppedAsm = prepAsm(asm, parameters, Object.assign({
      addr: 0,
      parameterValues,
    }, info) as IEventWriteInfo);
    const bytes = assemble(preppedAsm) as ArrayBuffer;
    return bytes;
  }
};

/** Creates a custom event object from string assembly. */
export function createCustomEvent(asm: string) {
  let eventName = CustomAsmHelper.readDiscreteProperty(asm, "NAME");
  if (!eventName || !eventName.trim()) {
    throw new Error("Custom event must have a name");
  }
  eventName = eventName.trim();
  const eventId = eventName.toUpperCase();

  const executionType = CustomAsmHelper.readExecutionType(asm);
  if (!executionType) {
    throw new Error("Custom even must have execution type");
  }

  const supportedGames = CustomAsmHelper.readSupportedGames(asm);
  if (!supportedGames) {
    throw new Error("Custom even must have supported games list");
  }

  const parameters = CustomAsmHelper.readParameters(asm);
  CustomAsmHelper.validateParameters(parameters);

  // Test that assembly works in all claimed supported versions.
  for (let i = 0; i < supportedGames.length; i++) {
    const game = supportedGames[i];
    try {
      CustomAsmHelper.testAssemble(asm, parameters, { game });
    }
    catch (e) {
      throw new Error("Failed a test assembly for " + getGameName(game)
        + ". The event may need adjustments before it can be used.\n\n" + e.toString());
    }
  }

  const custEvent: ICustomEvent = createEvent(eventId, eventName) as ICustomEvent;
  custEvent.custom = true;
  custEvent.asm = asm;
  custEvent.activationType = EventActivationType.LANDON;
  custEvent.executionType = executionType;
  custEvent.supportedGames = supportedGames;
  custEvent.parameters = parameters;

  custEvent.parse = function(dataView: DataView, info: IEventParseInfo) {
    // TODO: Can we generically parse custom events?
    return false;
  };
  custEvent.write = function(dataView: DataView, event: ICustomEvent, info: IEventWriteInfo, temp: any) {
    $$log("Writing custom event", event, info);

    // Assemble and write
    const asm = prepAsm(event.asm, event.parameters, info);
    const bytes = assemble(asm) as ArrayBuffer;

    copyRange(dataView, bytes, 0, 0, bytes.byteLength);

    return [info.offset, bytes.byteLength];
  }

  //$$log("New custom event", custEvent);
  return custEvent;
}

/**
 * Takes the event asm that someone wrote and merges in all the assumed
 * global variables.
 */
function prepAsm(asm: string, parameters: ICustomEventParameter[] | undefined, info: IEventWriteInfo) {
  const orgDirective = `.org 0x${info.addr.toString(16)}`;

  let symbols = getSymbols(info.game);
  let syms = symbols.map(symbol => {
    return `.definelabel ${symbol.name},0x${symbol.addr.toString(16)}`;
  });

  let parameterSymbols: string[] = [];
  if (parameters && parameters.length && info.parameterValues) {
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

// Yes, right here, load cached events...
const cachedEvents = getSavedEvents();
if (cachedEvents && cachedEvents.length) {
  cachedEvents.forEach((eventObj: IEvent) => {
    if (!eventObj || !(eventObj as ICustomEvent).asm)
      return;
    try {
      createCustomEvent((eventObj as ICustomEvent).asm);
    }
    catch (e) {
      // Just let the error slide, event format changed or something?
      console.error("Error reading cached event: " + e.toString());
    }
  });
}
