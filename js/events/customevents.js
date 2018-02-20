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

    /** Does a test assembly of a custom event. */
    testAssemble: function(asm, info = {}) {
      const preppedAsm = prepAsm(asm, Object.assign({
        addr: 0,
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

    // Test that assembly works in all claimed supported versions.
    for (let i = 0; i < supportedGames.length; i++) {
      const game = supportedGames[i];
      try {
        CustomAsmHelper.testAssemble(asm, { game });
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

    custEvent.parse = function(dataView, info) {
      // TODO: Can we generically parse custom events?
      return false;
    };
    custEvent.write = function(dataView, event, info, temp) {
      $$log("Writing custom event", event, info);

      // Assemble and write
      const asm = prepAsm(event.asm, info);
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

    $$log("New custom event", custEvent);
    return custEvent;
  }

  /**
   * Takes the event asm that someone wrote and merges in all the assumed
   * global variables.
   */
  function prepAsm(asm, info) {
    const orgDirective = `.org 0x${info.addr.toString(16)}`;

    let syms = PP64.symbols.getSymbols(info.game);
    syms = syms.map(symbol => {
      return `.definelabel ${symbol.name},0x${symbol.addr.toString(16)}`;
    });

    return [
      orgDirective,
      ...syms,
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
