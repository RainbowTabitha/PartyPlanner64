PP64.ns("adapters.events");

Object.assign(PP64.adapters.events, (function() {

  const CustomAsmHelper = {
    readDiscreteProperty: function(asm, propName) {
      const regex = new RegExp("^\\s*[;\\/]+\\s*" + propName + ":(.+)$", "gim");
      let regexMatch = regex.exec(asm);
      if (regexMatch) {
        return regexMatch[1];
      }
      return null;
    },

    readDiscretePropertySet: function(asm, propName) {
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

    readSupportedGames: function(asm) {
      let value = CustomAsmHelper.readDiscreteProperty(asm, "GAMES");
      if (value !== null) {
        let ids = value.trim().split(",");
        const supportedGames = [];
        for (let i = 0; i < ids.length; i++) {
          let id = ids[i];
          if ($gameType[id]) {
            supportedGames.push($gameType[id]);
          }
        }
        return supportedGames;
      }
      return null;
    },

    readExecutionType: function(asm) {
      let value = CustomAsmHelper.readDiscreteProperty(asm, "EXECUTION");
      return PP64.types.getExecutionTypeByName(value.trim());
    },

    readParameters: function(asm) {
      const entryStrings = CustomAsmHelper.readDiscretePropertySet(asm, "PARAM");
      const parameters = [];
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

    validateParameters: function(parameters) {
      if (!parameters)
        return;
      parameters.forEach(parameter => {
        if (!parameter.name)
          throw new Error("An event parameter didn't have a name");
        if (!parameter.type)
          throw new Error("An event parameter didn't have a type");
        if (!parameter.name.match(CustomAsmHelper.validParameterNameRegex))
          throw new Error(`Event parameter name '${parameter.name}' is not valid`);
        if (PP64.types.EventParameterTypes.indexOf(parameter.type) === -1)
          throw new Error(`Event parameter type ${parameter.type} is not recognized`);
      });
    },

    /** Does a test assembly of a custom event. */
    testAssemble: function(asm, parameters, info = {}) {
      // Make fake parameterValues
      const parameterValues = {};
      if (parameters && parameters.length) {
        parameters.forEach(parameter => {
          parameterValues[parameter.name] = 0;
        });
      }

      const preppedAsm = prepAsm(asm, parameters, Object.assign({
        addr: 0,
        parameterValues,
      }, info));
      const bytes = MIPSAssem.assemble(preppedAsm);
      return bytes;
    }
  };

  /** Creates a custom event object from string assembly. */
  function createCustomEvent(asm) {
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
        throw new Error("Failed a test assembly for " + PP64.types.getGameName(game)
          + ". The event may need adjustments before it can be used.\n\n" + e.toString());
      }
    }

    const custEvent = PP64.adapters.events.createEvent(eventId, eventName);
    custEvent.custom = true;
    custEvent.asm = asm;
    custEvent.activationType = $activationType.LANDON;
    custEvent.executionType = executionType;
    custEvent.supportedGames = supportedGames;
    custEvent.parameters = parameters;

    custEvent.parse = function(dataView, info) {
      // TODO: Can we generically parse custom events?
      return false;
    };
    custEvent.write = function(dataView, event, info, temp) {
      $$log("Writing custom event", event, info);

      // Assemble and write
      const asm = prepAsm(event.asm, event.parameters, info);
      const bytes = MIPSAssem.assemble(asm);

      PP64.utils.arrays.copyRange(dataView, bytes, 0, 0, bytes.byteLength);

      return [info.offset, bytes.byteLength];
    }
    custEvent.sizeOf = function(n) {
      // Fake-assemble to determine size.
      // TODO: This is never called?
      const bytes = CustomAsmHelper.testAssemble(asm);
      return bytes.byteLength;
    }

    //$$log("New custom event", custEvent);
    return custEvent;
  }

  /**
   * Takes the event asm that someone wrote and merges in all the assumed
   * global variables.
   */
  function prepAsm(asm, parameters, info) {
    const orgDirective = `.org 0x${info.addr.toString(16)}`;

    let syms = PP64.symbols.getSymbols(info.game);
    syms = syms.map(symbol => {
      return `.definelabel ${symbol.name},0x${symbol.addr.toString(16)}`;
    });

    let parameterSymbols = [];
    if (parameters && parameters.length && info.parameterValues) {
      parameterSymbols = parameters.map(parameter => {
        switch (parameter.type) {
          case "Boolean":
            return `.definelabel ${parameter.name},${info.parameterValues[parameter.name] ? 1 : 0}`;

          default:
            return `.definelabel ${parameter.name},${info.parameterValues[parameter.name]}`;
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
  const cachedEvents = PP64.utils.localstorage.getSavedEvents();
  if (cachedEvents && cachedEvents.length) {
    cachedEvents.forEach(eventObj => {
      if (!eventObj || !eventObj.asm)
        return;
      try {
        createCustomEvent(eventObj.asm);
      }
      catch (e) {
        // Just let the error slide, event format changed or something?
        console.error("Error reading cached event: " + e.toString());
      }
    });
  }

  return {
    createCustomEvent,
    CustomAsmHelper,
  };
})());
