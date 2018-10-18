namespace PP64.adapters.events {
  /**
   * Stores junk that the events want to keep around.
   * In particular, cached data from parsing the original game events.
   */
  const _cache = Object.create(null);

  export const EventCache = {
    get: function(key: string) {
      return _cache[key];
    },
    set: function(key: string, value: any) {
      _cache[key] = value;
    }
  };

  const _events: { [id: string]: IEvent } = Object.create(null);

  export interface IEvent {
    id: string;
    name: string;
    parse: (dataView: DataView, info: any) => boolean;
    write: (dataView: DataView, event: any, info: any, temp: object) => number[] | false;
    sizeOf: (n: number) => number;
    activationType: PP64.types.EventActivationType;
    executionType: PP64.types.EventExecutionType;
    fakeEvent: boolean;
    supportedGames: PP64.types.Game[];
    sharedAsm: boolean;
    inlineArgs?: number[];
    custom?: boolean;
  }

  const EventBase: IEvent = {
    id: "",
    name: "",

    // Given the ROM and some state info, determines
    // if the event is represented by said function.
    parse: function(dataView, info) { throw "parse not implemented"; },

    // Given the ROM and various offsets, writes the event to the ROM.
    // Return the next free offset for a subsequent event to write to.
    write: function(dataView, event: IEvent, info, temp) {
      throw `${event.id || "event"}.write not implemented`;
    },

    // Returns the total ASM space required by n of these events.
    // Some events have a cost like n + O(1), where 1 .. n are cheaper than the first.
    sizeOf: function(n) { throw "sizeOf not implemented"; },

    // Default activation type for the event.
    activationType: $activationType.WALKOVER,

    // Default execution type for the event function.
    executionType: $executionType.DIRECT,

    // Returns true if event is not represented as a real event in the UI,
    // meaning it won't return a normal event object (chain merge, star, etc.)
    fakeEvent: false,

    // Which specific game versions (MP1_USA, etc.) are supported for write to ROM
    supportedGames: [],

    // True if multiple spaces would share the same ASM function (only need
    // to write once and point to it later)
    sharedAsm: false,
  };

  export function createEvent(id: string, name: string) {
    let event = Object.create(EventBase);
    event.id = id;
    event.name = name;
    _events[id] = event;
    return event;
  }

  function _getArgsSize(count: number) {
    // return (count * 2) + (4 - ((count * 2) % 4));
    return $$number.makeDivisibleBy(count * 2, 4);
  }

  function _supportedGamesMatch(supportedGames: PP64.types.Game[], gameVersion: number) {
    for (let i = 0; i < supportedGames.length; i++) {
      switch (supportedGames[i]) {
        case $gameType.MP1_USA:
        case $gameType.MP1_JPN:
        case $gameType.MP1_PAL:
          if (gameVersion === 1)
            return true;
          break;
        case $gameType.MP2_USA:
        case $gameType.MP2_JPN:
        case $gameType.MP2_PAL:
          if (gameVersion === 2)
            return true;
          break;
        case $gameType.MP3_USA:
        case $gameType.MP3_JPN:
        case $gameType.MP3_PAL:
          if (gameVersion === 3)
            return true;
          break;
      }
    }
    return false;
  }

  export function create(id: string, args?: any) {
    let e = _events[id];
    if (!e)
      throw `Requesting to create invalid event ${id}.`;
    let event = args ? PP64.utils.obj.copy(args) : {};
    event.id = id;
    event.activationType = e.activationType;
    event.executionType = e.executionType;
    return event;
  }

  export interface IEventParseInfo {
    addr: number;
    offset: number;
    board: PP64.boards.IBoard;
    boardIndex: number;
    curSpace: number;
    curSpaceIndex: number;
    chains: number[][];
    game: PP64.types.Game;
    gameVersion: number;
  }

  export function parse(romView: DataView, info: IEventParseInfo) {
    let currentGame = PP64.romhandler.getROMGame()!;
    for (let event in _events) {
      if (_events[event].supportedGames.indexOf(currentGame) === -1)
        continue;
      let args = _events[event].parse(romView, info);
      if (args) {
        if (_events[event].fakeEvent)
          return true;
        let result: any = {
          id: event,
        };
        if (args !== true)
          result.args = args;
        return result;
      }
    }
    return false;
  }

  export function getAvailableEvents() {
    let events = [];
    let _events = PP64.adapters.events.getEvents();
    let curGameVersion = PP64.boards.getCurrentBoard().game || 1;
    for (let id in _events) {
      let event = _events[id];
      if (_supportedGamesMatch(event.supportedGames, curGameVersion) && !event.fakeEvent)
        events.push(PP64.utils.obj.copy(event));
    }
    return events;
  }

  export function getCustomEvents() {
    let events = [];
    let _events = PP64.adapters.events.getEvents();
    for (let id in _events) {
      let event = _events[id];
      if (event.custom)
        events.push(PP64.utils.obj.copy(event));
    }
    return events;
  }

  export interface IEventWriteInfo {
    boardIndex: number;
    board: PP64.boards.IBoard;
    curSpaceIndex: number;
    curSpace: PP64.boards.ISpace;
    chains: number[][];
    offset: number;
    addr: number;
    game: PP64.types.Game;
    gameVersion: 1 | 2 | 3;
    parameterValues: { [name: string]: number };
    argsAddr?: number;
  }

  export function write(buffer: ArrayBuffer, event: IEvent, info: IEventWriteInfo, temp: any) {
    // Write any inline arguments.
    // Normally, these are right by the event list, but it makes more sense
    // to write them mixed in right beside the ASM that actually uses them...
    let argsCount = 0;
    let argsSize = 0;
    if (event.inlineArgs) {
      argsCount = event.inlineArgs.length;
      argsSize = _getArgsSize(argsCount);

      let argView = new DataView(buffer, info.offset);
      for (let arg = 0; arg < argsCount; arg++) {
        let argOffset = (arg * 2);
        argView.setUint16(argOffset, event.inlineArgs[arg]);
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
  }

  export function removeEvent(id: string) {
    delete _events[id];
  }

  export function isUnsupported(id: string, gameId: PP64.types.Game) {
    return _events[id].supportedGames.indexOf(gameId) === -1;
  }

  export function sharesAsm(id: string) {
    return _events[id].sharedAsm;
  }

  export function getName(id: string) {
    return (_events[id] && _events[id].name) || "";
  }

  export function getEvent(id: string) {
    return _events[id];
  }

  export function getEvents() {
    return _events;
  }
}
