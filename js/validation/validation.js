PP64.validation = (function() {
  const _rules = Object.create(null);

  const ValidationRuleBase = {
    fails: function(board, args) { throw "fails not implemented"; },
  };

  function createRule(id, name, level) {
    let rule = Object.create(ValidationRuleBase);
    rule.id = id;
    rule.name = name;
    rule.level = level;
    _rules[id] = rule;
    return rule;
  }

  // var NAMEHERE = createRule("", "");
  // NAMEHERE.fails = function(board, args) {
    
  // };

  const HasStart = createRule("HASSTART", "Has start space", $validationLevel.ERROR);
  HasStart.fails = function(board, args) {
    let curIdx = PP64.boards.getStartSpaceIndex(board);
    if (curIdx < 0)
      return "No start space found on board.";
    return false;
  };

  const GameVersionMatch = createRule("GAMEVERSION", "Game version mismatch", $validationLevel.ERROR);
  GameVersionMatch.fails = function(board, args) {
    let romGame = PP64.romhandler.getGameVersion();
    if (romGame !== board.game)
      return `Board is for MP${board.game}, but ROM is MP${romGame}`;
    return false;
  };

  const DeadEnd = createRule("DEADEND", "No dead ends", $validationLevel.ERROR);
  DeadEnd.fails = function(board, args) {
    const deadEnds = PP64.boards.getDeadEnds(board);

    const startIndex = PP64.boards.getStartSpaceIndex(board);
    if (startIndex < 0)
      return false; // Let HASSTART rule complain.

    if (deadEnds.indexOf(startIndex) >= 0)
      return "Start space does not lead anywhere.";

    if (deadEnds.length)
      return "There is a dead end on the board.";

    return false;
  };

  const TooManySpaces = createRule("TOOMANYSPACES", "Too many spaces", $validationLevel.ERROR);
  TooManySpaces.fails = function(board, args) {
    if (board.spaces.length > 0xFFFF)
      return "There is a hard limit of 65535 spaces.";
    return false;
  };

  const OverRecommendedSpaces = createRule("OVERRECOMMENDEDSPACES", "Over recommended spaces", $validationLevel.WARNING);
  OverRecommendedSpaces.fails = function(board, args) {
    const spaceCount = board.spaces.length;
    if (spaceCount > args.max)
      return `${spaceCount} spaces present, more than ${args.max} spaces can be unstable.`;
    return false;
  };

  const _makeTooManyOfSubtypeRule = function(subtype, name) {
    let rule = createRule(`TOOMANY${name.toUpperCase().replace(/\s+/g, "")}`, `Too many ${name}`, $validationLevel.ERROR);
    rule.fails = function(board, args = {}) {
      let limit = args.limit || 0;
      let count = board.spaces.filter(space => {
        return space && space.subtype === subtype;
      }).length;
      if (count > limit)
        return `There are ${count} ${name}, but the limit is ${limit} for this board.`;
      return false;
    };
  }

  const TooManyBoos = _makeTooManyOfSubtypeRule($spaceSubType.BOO, "Boos");
  const TooManyBowsers = _makeTooManyOfSubtypeRule($spaceSubType.BOWSER, "Bowsers");
  const TooManyKoopas = _makeTooManyOfSubtypeRule($spaceSubType.KOOPA, "Koopas");
  const TooManyBanks = _makeTooManyOfSubtypeRule($spaceSubType.BANK, "Banks");
  const TooManyItemShops = _makeTooManyOfSubtypeRule($spaceSubType.ITEMSHOP, "Item Shops");
  const TooManyGates = _makeTooManyOfSubtypeRule($spaceSubType.GATE, "Gates");

  const BadStarCount = createRule("BADSTARCOUNT", "Bad star count", $validationLevel.ERROR);
  BadStarCount.fails = function(board, args = {}) {
    let low = args.low || 1;
    let high = args.high || 1;
    let count = board.spaces.filter(space => {
      return space && space.star;
    }).length;
    if (count < low || count > high) {
      if (low !== high)
        return `There are ${count} stars, but the range is ${low}-${high} for this board.`;
      else
        return `There are ${count} stars, but the count must be ${low} for this board.`;
    }
    return false;
  };

  const _makeTooFewOfSpaceTypeRule = function(type, name) {
    let rule = createRule(`TOOFEW${name.toUpperCase().replace(/\s+/g, "")}SPACES`, `Too few ${name} spaces`, $validationLevel.ERROR);
    rule.fails = function(board, args = {}) {
      let low = args.low || 0;
      let count = board.spaces.filter(space => {
        return space && space.type === type;
      }).length;
      if (count < low)
        return `There are ${count} ${name} spaces, need at least ${low} spaces of this type.`;
      return false;
    };
  }

  _makeTooFewOfSpaceTypeRule($spaceType.BLUE, "Blue");
  _makeTooFewOfSpaceTypeRule($spaceType.RED, "Red");

  const TooManyOfEvent = createRule("TOOMANYOFEVENT", "Too many of event", $validationLevel.ERROR);
  TooManyOfEvent.fails = function(board, args) {
    let count = 0;
    board.spaces.forEach(space => {
      if (!space || !space.events)
        return;
      space.events.forEach(event => {
        if (event.id === args.event.id)
          count++;
      });
    });

    let low = args.low || 0;
    let high = args.high || 0;
    if (count < low || count > high) {
      if (low && high)
        return `There are ${count} of event ${args.event.name}, but the range is ${low}-${high} for this board.`;
      if (low)
        return `There are ${count} of event ${args.event.name}, but there must be at least ${low} for this board.`;
      else if (high)
        return `There are ${count} of event ${args.event.name}, but there can be at most ${high} for this board.`;
    }
    return false;
  };

  const UnrecognizedEvents = createRule("UNRECOGNIZEDEVENTS", "Unrecognized events", $validationLevel.ERROR);
  UnrecognizedEvents.fails = function(board, args) {
    let unrecognizedEvents = Object.create(null);
    board.spaces.forEach(space => {
      if (!space || !space.events)
        return;
      space.events.forEach(event => {
        if (!PP64.adapters.events.getEvent(event.id) && !unrecognizedEvents[event.id])
          unrecognizedEvents[event.id] = true;
      });
    });

    let ids = [];
    for (var id in unrecognizedEvents) {
      ids.push(id);
    }

    if (!ids.length)
      return false;

    let error = "The following events were unrecognized:\n";
    ids.forEach(id => {
      error += "\t" + id + "\n";
    });
    return error;
  };

  const UnsupportedEvents = createRule("UNSUPPORTEDEVENTS", "Unsupported events", $validationLevel.ERROR);
  UnsupportedEvents.fails = function(board, args) {
    let unsupportedEvents = Object.create(null);
    let gameID = PP64.romhandler.getROMGame();
    board.spaces.forEach(space => {
      if (!space || !space.events)
        return;
      space.events.forEach(event => {
        if (!PP64.adapters.events.getEvent(event.id)) {
          return; // Let the other rule handle this.
        }
        if (PP64.adapters.events.isUnsupported(event.id, gameID) && !unsupportedEvents[event.id])
          unsupportedEvents[event.id] = true;
      });
    });

    let ids = [];
    for (var id in unsupportedEvents) {
      ids.push(id);
    }

    if (!ids.length)
      return false;

    let error = "The following events cannot be written to this ROM:\n";
    ids.forEach(id => {
      error += "\t" + id + "\n";
    });
    return error;
  };

  const FailingCustomEvents = createRule("CUSTOMEVENTFAIL", "Custom event errors", $validationLevel.ERROR);
  FailingCustomEvents.fails = function(board, args) {
    let failingEvents = Object.create(null);
    let gameID = PP64.romhandler.getROMGame();
    board.spaces.forEach(space => {
      if (!space || !space.events)
        return;
      space.events.forEach(event => {
        event = PP64.adapters.events.getEvent(event.id);
        if (!event)
          return; // Let the other rule handle this.
        if (!event.custom)
          return;
        try {
          PP64.adapters.events.CustomAsmHelper.testAssemble(event.asm, { game: gameID });
        }
        catch (e) {
          console.error(e.toString());
          if (!failingEvents[event.id])
            failingEvents[event.id] = true;
        }
      });
    });

    let ids = [];
    for (var id in failingEvents) {
      ids.push(id);
    }

    if (!ids.length)
      return false;

    let error = "The following custom events fail to assemble:\n";
    ids.forEach(id => {
      error += "\t" + id + "\n";
    });
    return error;
  };

  const TooManyPathOptions = createRule("TOOMANYPATHOPTIONS", "Too many path options", $validationLevel.ERROR);
  TooManyPathOptions.fails = function(board, args = {}) {
    let limit = args.limit || 2;
    for (var space in board.links) {
      let links = board.links[space];
      if (Array.isArray(links) && links.length > limit)
        return `A space branches in ${links.length} directions, but the maximum is ${limit}.`;
    }
    return false;
  };

  const CharactersOnPath = createRule("CHARACTERSONPATH", "Characters are on path", $validationLevel.WARNING);
  CharactersOnPath.fails = function(board, args = {}) {
    for (var spaceIdx in board.links) {
      let space = board.spaces[spaceIdx];
      if (space.hasOwnProperty("subtype") && space.subtype !== $spaceSubType.GATE)
        return "Characters and objects <a href='https://github.com/PartyPlanner64/PartyPlanner64/wiki/Creating-a-Board#special-charactersobjects' target='_blank'>should not be on the player path</a>.";
    }
    return false;
  };

  const SplitAtNonInvisibleSpace = createRule("SPLITATNONINVISIBLESPACE", "Split at non-invisible space", $validationLevel.WARNING);
  SplitAtNonInvisibleSpace.fails = function(board, args = {}) {
    const preferredSplitTypes = [
      $spaceType.OTHER,
      $spaceType.STAR,
      $spaceType.START,
      $spaceType.BLACKSTAR,
      $spaceType.ARROW,
    ];
    for (let spaceIdx in board.links) {
      let links = PP64.boards.getConnections(spaceIdx, board);
      if (links.length > 1) {
        let space = board.spaces[spaceIdx];
        if (preferredSplitTypes.indexOf(space.type) === -1)
          return "There is a <a href='https://github.com/PartyPlanner64/PartyPlanner64/wiki/Creating-a-Board#board-flow' target='_blank'>non-conventional path split</a>.";
      }
    }
    return false;
  };

  const TooManyArrowRotations = createRule("TOOMANYARROWROTATIONS", "Too many arrow rotations", $validationLevel.WARNING);
  TooManyArrowRotations.fails = function(board, args = {}) {
    let rotationCount = 0;
    board.spaces.forEach(space => {
      if (!space)
        return;
      if (typeof space.rotation === "number") {
        rotationCount++;
      }
    });
    if (rotationCount > args.limit) {
      return `Only ${args.limit} arrows will be rotated in-game.`;
    }
    return false;
  };

  const GateSetup = createRule("GATESETUP", "Incorrect gate setup", $validationLevel.ERROR);
  GateSetup.fails = function(board, args = {}) {
    let gateSpaceIndices = PP64.boards.getSpacesOfSubType($spaceSubType.GATE, board);

    for (let i = 0; i < gateSpaceIndices.length; i++) {
      let gateSpaceIndex = gateSpaceIndices[i];

      // We want the gate to be on an invisible space.
      let gateSpace = board.spaces[gateSpaceIndex];
      if (gateSpace.type !== $spaceType.OTHER)
        return "Only invisible spaces can have gates."; // UI should prevent this pretty well

      // Check space/link structure after gate space.
      let exitingSpaces = PP64.boards.getConnections(gateSpaceIndex, board);
      if (exitingSpaces.length !== 1)
        return "A single path should leave a gate space.";
      let exitSpaceIndex = exitingSpaces[0];
      let exitSpace = board.spaces[exitSpaceIndex];
      if (!exitSpace || exitSpace.type !== $spaceType.OTHER)
        return "Space after a gate space must be invisible.";
      if (exitSpace.subtype === $spaceSubType.GATE)
        return "Gate spaces must be 2 or more spaces apart.";
      if (_getPointingSpaceIndices(exitSpaceIndex).length !== 1)
        return "A single path should connect to the space after a gate space.";

      let nextSpaces = PP64.boards.getConnections(exitSpaceIndex, board);
      if (nextSpaces.length !== 1)
        return "A single path should leave the space after a gate space";
      let nextSpaceIndex = nextSpaces[0];
      let nextSpace = board.spaces[nextSpaceIndex];
      if (nextSpace.subtype === $spaceSubType.GATE)
        return "Gate spaces must be 2 or more spaces apart.";

      // Check space/link structure before gate space.
      let enteringSpaces = _getPointingSpaceIndices(gateSpaceIndex);
      if (enteringSpaces.length !== 1)
        return "A single path should connect to a gate space.";
      let enteringSpaceIndex = enteringSpaces[0];
      let enteringSpace = board.spaces[enteringSpaceIndex];
      if (!enteringSpace || enteringSpace.type !== $spaceType.OTHER)
        return "Space before a gate space must be invisible.";
      if (enteringSpace.subtype === $spaceSubType.GATE)
        return "Gate spaces must be 2 or more spaces apart.";

      let prevSpaces = _getPointingSpaceIndices(enteringSpaceIndex);
      if (prevSpaces.length !== 1)
        return "A single path should connect to the space before a gate space.";
      if (prevSpaces[0].subtype === $spaceSubType.GATE)
        return "Gate spaces must be 2 or more spaces apart.";
    };

    function _getPointingSpaceIndices(pointedAtIndex) {
      let pointingIndices = [];
      for (let startIdx in board.links) {
        let ends = PP64.boards.getConnections(startIdx, board);
        ends.forEach(end => {
          if (end === pointedAtIndex)
            pointingIndices.push(Number(startIdx));
        });
      }
      return pointingIndices;
    }

    return false;
  };

  function _overwriteAvailable(boardIndex) {
    return boardIndex === 0 || PP64.settings.get($setting.uiSkipValidation);
  }

  function _dontShowInUI(romBoard, boardIndex, boardType) {
    if (typeof boardType !== "string") {
      // Because default is normal
      return romBoard.type === PP64.types.BoardType.DUEL;
    }
    return romBoard.type !== boardType;
  }

  function _getRulesForBoard(gameID, boardIndex) {
    let rules = [
      PP64.validation.getRule("HASSTART"),
      PP64.validation.getRule("GAMEVERSION"),
      PP64.validation.getRule("DEADEND"),
      PP64.validation.getRule("TOOMANYSPACES"),
      PP64.validation.getRule("UNRECOGNIZEDEVENTS"),
      PP64.validation.getRule("UNSUPPORTEDEVENTS"),
      PP64.validation.getRule("CUSTOMEVENTFAIL"),
      PP64.validation.getRule("TOOMANYPATHOPTIONS"),
      PP64.validation.getRule("CHARACTERSONPATH"),
      PP64.validation.getRule("SPLITATNONINVISIBLESPACE"),
    ];

    switch(gameID) {
      case $gameType.MP1_USA:
      case $gameType.MP1_JPN:
        rules = rules.concat(PP64.validation.MP1.getValidationRulesForBoard(gameID, boardIndex));
        break;
      case $gameType.MP2_USA:
      case $gameType.MP2_JPN:
        rules = rules.concat(PP64.validation.MP2.getValidationRulesForBoard(gameID, boardIndex));
        break;
      case $gameType.MP3_USA:
      case $gameType.MP3_JPN:
        rules = rules.concat(PP64.validation.MP3.getValidationRulesForBoard(gameID, boardIndex));
        break;
    }

    return rules;
  }

  function validateCurrentBoardForOverwrite() {
    let gameID = PP64.romhandler.getROMGame();
    if (!gameID)
      return null;

    let results = [];
    let romBoards = PP64.boards.getROMBoards();
    let currentBoard = PP64.boards.getCurrentBoard();
    romBoards.forEach((board, boardIndex) => {
      if (_dontShowInUI(board, boardIndex, currentBoard.type))
        return;

      let unavailable = !_overwriteAvailable(boardIndex);

      let errors = [];
      let warnings = [];
      if (!unavailable && !PP64.settings.get($setting.uiSkipValidation)) {
        let rules = _getRulesForBoard(gameID, boardIndex);
        rules.forEach(rule => {
          let args;
          if (Array.isArray(rule)) {
            [rule, args] = rule;
          }
          let failureResult = rule.fails(currentBoard, args);
          if (failureResult) {
            if (rule.level === $validationLevel.ERROR)
              errors.push(failureResult);
            else if (rule.level === $validationLevel.WARNING)
              warnings.push(failureResult);
          }
        });
      }

      results.push({
        name: board.name,
        unavailable,
        errors,
        warnings,
      });
    });

    return results;
  }

  return {
    createRule,
    getRule(id, args) {
      let rule = _rules[id];
      let newRule = {
        id: rule.id,
        name: rule.name,
        level: rule.level,
        fails: function(board) {
          return rule.fails(board, args);
        }
      };
      return newRule;
    },
    validateCurrentBoardForOverwrite,
  };
})();
