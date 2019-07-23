import { IEvent, IEventWriteInfo, IEventParameter } from "./events";
import { getSavedEvents } from "../utils/localstorage";
import { $$log } from "../utils/debug";
import { copyRange } from "../utils/arrays";
import { EventActivationType, getGameName, Game, getExecutionTypeByName, EventParameterTypes, EventParameterType } from "../types";
import { assemble } from "mips-assembler";
import { prepAsm } from "./prepAsm";
import { ISpaceEvent } from "../boards";
import { addEventToLibrary } from "./EventLibrary";

export interface ICustomEvent extends IEvent {
  asm: string;
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
    const parameters: IEventParameter[] = [];
    entryStrings.forEach(entryStr => {
      const pieces = entryStr.split("|");
      if (pieces.length !== 2)
        return;
      const parameter: IEventParameter = {
        name: pieces[1],
        type: pieces[0] as EventParameterType // hopefully
      };
      try {
        CustomAsmHelper.validateParameters([parameter]);
        parameters.push(parameter);
      }
      catch (e) {} // It's invalid, just skip it.
    });
    return parameters;
  },

  validParameterNameRegex: /^[\w?!]*$/,

  validateParameters: function(parameters: IEventParameter[]) {
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
  testAssemble: function(asm: string, parameters?: IEventParameter[], info: Partial<IEventWriteInfo> = {}) {
    // Make fake parameterValues
    const parameterValues: any = {};
    if (parameters && parameters.length) {
      parameters.forEach(parameter => {
        parameterValues[parameter.name] = 0;
      });
    }

    const customEvent = createCustomEvent(asm);
    const preppedAsm = prepAsm(asm, customEvent, { parameterValues } as ISpaceEvent, Object.assign({
      addr: 0,
    }, info) as IEventWriteInfo);
    const bytes = assemble(preppedAsm) as ArrayBuffer;
    return bytes;
  }
};

/** Creates a custom event object from string assembly. */
export function createCustomEvent(asm: string, validate?: boolean) {
  let eventName = CustomAsmHelper.readDiscreteProperty(asm, "NAME");
  if (!eventName || !eventName.trim()) {
    throw new Error("Custom event must have a name");
  }
  eventName = eventName.trim();
  const eventId = eventName;

  const executionType = CustomAsmHelper.readExecutionType(asm);
  if (!executionType) {
    throw new Error("Custom even must have execution type");
  }

  const supportedGames = CustomAsmHelper.readSupportedGames(asm);
  if (!supportedGames) {
    throw new Error("Custom even must have supported games list");
  }

  const parameters = CustomAsmHelper.readParameters(asm);

  if (validate) {
    CustomAsmHelper.validateParameters(parameters);

    // Test that assembly works in all claimed supported versions.
    for (let i = 0; i < supportedGames.length; i++) {
      const game = supportedGames[i];
      try {
        CustomAsmHelper.testAssemble(asm, parameters, { game });
      }
      catch (e) {
        const errorMsg = "Failed a test assembly for " + getGameName(game)
        + ". The event may need adjustments before it can be used.\n\n" + e.toString();
        console.error(errorMsg + "\n\n" + asm)
        throw new Error(errorMsg);
      }
    }
  }

  const custEvent: ICustomEvent = {
    id: eventId,
    name: eventName,
    custom: true,
    asm: asm,
    activationType: EventActivationType.LANDON,
    executionType: executionType,
    supportedGames: supportedGames,
    parameters: parameters,
  };

  //$$log("New custom event", custEvent);
  return custEvent;
}

export function writeCustomEvent(dataView: DataView, spaceEvent: ISpaceEvent, info: IEventWriteInfo, asm: string, temp: any) {
  $$log("Writing custom event", spaceEvent, info);

  // Assemble and write
  if (info.gameVersion !== 2) {
    return asm;
  }

  const customEvent = createCustomEvent(asm);
  const preppedAsm = prepAsm(asm, customEvent, spaceEvent, info);
  const bytes = assemble(preppedAsm) as ArrayBuffer;
  $$log(preppedAsm);
  copyRange(dataView, bytes, 0, 0, bytes.byteLength);
  return [info.offset!, bytes.byteLength];
}

// Yes, right here, load cached events...
const cachedEvents = getSavedEvents();
if (cachedEvents && cachedEvents.length) {
  cachedEvents.forEach((eventObj: IEvent) => {
    if (!eventObj || !(eventObj as ICustomEvent).asm)
      return;
    try {
      const customEvent = createCustomEvent((eventObj as ICustomEvent).asm);
      addEventToLibrary(customEvent);
    }
    catch (e) {
      // Just let the error slide, event format changed or something?
      console.error("Error reading cached event: " + e.toString());
    }
  });
}
