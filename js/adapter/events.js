PP64.ns("adapters");

PP64.adapters.events = (function() {
  // May implement with LocalStorage to avoid parsing all the time.
  const _cache = Object.create(null);
  const EventCache = {
    get: function(key) {
      return _cache[key];
    },
    set: function(key, value) {
      _cache[key] = value;
    }
  };

  const _events = Object.create(null);

  const EventBase = {
    // Given the ROM and some state info, determines
    // if the event is represented by said function.
    parse: function(dataView, info) { throw "parse not implemented"; },

    // Given the ROM and various offsets, writes the event to the ROM.
    // Return the next free offset for a subsequent event to write to.
    write: function(dataView, event, info, temp) {
      throw `${event.id || "event"}.write not implemented`;
    },

    // Returns the total ASM space required by n of these events.
    // Some events have a cost like n + O(1), where 1 .. n are cheaper than the first.
    sizeOf: function(n) { throw "sizeOf not implemented"; },

    // Default activation type for the event.
    activationType: $activationType.WALKOVER,

    // Default mystery value.
    mystery: 1,

    // Returns true if event is not represented as a real event in the UI,
    // meaning it won't return a normal event object (chain merge, star, etc.)
    fakeEvent: false,

    // Which games are supported (1, 2, and/or 3)
    supportedGameVersions: [],

    // Which specific game versions (MP1_USA, etc.) are supported for write to ROM
    supportedGames: [],

    // True if multiple spaces would share the same ASM function (only need
    // to write once and point to it later)
    sharedAsm: false,
  };

  function createEvent(id, name) {
    let event = Object.create(EventBase);
    event.id = id;
    event.name = name;
    _events[id] = event;
    return event;
  }

  function _getArgsSize(count) {
    // return (count * 2) + (4 - ((count * 2) % 4));
    return $$number.makeDivisibleBy(count * 2, 4);
  }

  return {
    createEvent,
    EventCache,
    create: function(id, args) { // This is what happens when you code after work.
      let e = _events[id];
      if (!e)
        throw `Requesting to create invalid event ${id}.`;
      let event = args ? PP64.utils.obj.copy(args) : {};
      event.id = id;
      event.activationType = e.activationType;
      event.mystery = e.mystery;
      return event;
    },
    parse: function(romView, info) {
      for (let event in _events) {
        let args = _events[event].parse(romView, info);
        if (args) {
          if (_events[event].fakeEvent)
            return true;
          let result = {
            id: event,
          };
          if (args !== true)
            result.args = args;
          return result;
        }
      }
      return false;
    },
    getAvailableEvents: function() {
      let events = [];
      let _events = PP64.adapters.events.getEvents();
      let currentGame = PP64.boards.getCurrentBoard().game || 1;
      for (let id in _events) {
        let event = _events[id];
        if (event.supportedGameVersions.indexOf(currentGame) >= 0 && !event.fakeEvent)
          events.push(PP64.utils.obj.copy(event));
      }
      return events;
    },
    write: function(buffer, event, info, temp) {
      // Write any inline arguments.
      // Normally, these are right by the event list, but it makes more sense
      // to write them mixed in right beside the ASM that actually uses them...
      let argsCount = 0;
      let argsSize = 0;
      if (event.args && event.args.inline) {
        argsCount = event.args.inline.length;
        argsSize = _getArgsSize(argsCount);

        let argView = new DataView(buffer, info.offset);
        for (let arg = 0; arg < argsCount; arg++) {
          let argOffset = (arg * 2);
          argView.setUint16(argOffset, event.args.inline[arg]);
        }

        // We will tell the event code where the args are, and update where it
        // should actually start writing the ASM because we wrote those args.
        info.argsAddr = info.addr;
        info.addr += argsSize;
        info.offset += argsSize;
      }

      let asmView = new DataView(buffer, info.offset);
      let result = _events[event.id].write(asmView, event, info, temp);
      if (result === false)
        throw "Could not write ${event.id} for game ${info.gameVersion}";

      result[1] += argsSize; // len needs to be more than what the event thought it should be

      return result;
    },
    isUnsupported: function(id, gameId) {
      return _events[id].supportedGames.indexOf(gameId) === -1;
    },
    sharesAsm: function(id) {
      return _events[id].sharedAsm;
    },
    getName: function(id) {
      return _events[id].name;
    },
    getEvent: function(id) {
      return _events[id];
    },
    getEvents: function() {
      return _events;
    },
  };
})();
