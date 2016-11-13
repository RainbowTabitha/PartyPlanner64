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

  function _getSpacesCopy(board) {
    return PP64.utils.obj.copy(board.spaces);
  }

  const HasStart = createRule("HASSTART", "Has start space", $validationLevel.ERROR);
  HasStart.fails = function(board, args) {
    let curIdx = PP64.boards.getStartSpace(board);
    if (curIdx === null)
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
    let curIdx = PP64.boards.getStartSpace(board);
    let spaces = _getSpacesCopy(board);
    if (!board.links.hasOwnProperty(curIdx))
      return "Start space does not lead anywhere.";

    function _checkDeadEnd(spaceIndex) {
      if (spaces[spaceIndex]._seen)
        return false; // We have reached a previous space - no dead end.
      if (!board.links.hasOwnProperty(spaceIndex))
        return "There is a dead end on the board.";
      spaces[spaceIndex]._seen = true;
      var nextSpaces = board.links[spaceIndex];
      var result;
      if (Array.isArray(nextSpaces)) {
        for (var i = 0; i < nextSpaces.length; i++) {
          result = _checkDeadEnd(nextSpaces[i]);
          if (result)
            return result;
        }
      }
      else {
        result = _checkDeadEnd(nextSpaces);
        if (result)
          return result;
      }
    }

    return _checkDeadEnd(curIdx);
  };

  const TooManySpaces = createRule("TOOMANYSPACES", "Too many spaces", $validationLevel.ERROR);
  TooManySpaces.fails = function(board, args) {
    if (board.spaces.length > 0xFFFF)
      return "There is a hard limit of 65535 spaces.";
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

  const BadGateCount = createRule("BADGATECOUNT", "Bad gate count", $validationLevel.ERROR);
  BadGateCount.fails = function(board, args = {}) {
    let low = args.low || 0;
    let high = args.high || 1;
    let count = board.spaces.filter(space => {
      return space && space.gate;
    }).length;
    if (count < low || count > high) {
      if (low !== high)
        return `There are ${count} gates, but the range is ${low}-${high} for this board.`;
      else
        return `There are ${count} gates, but the count must be ${low} for this board.`;
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

  const UnsupportedEvents = createRule("UNSUPPORTEDEVENTS", "Unsupported events", $validationLevel.ERROR);
  UnsupportedEvents.fails = function(board, args) {
    let unsupportedEvents = Object.create(null);
    let gameID = PP64.romhandler.getROMGame();
    board.spaces.forEach(space => {
      if (!space || !space.events)
        return;
      space.events.forEach(event => {
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
      if (space.hasOwnProperty("subtype"))
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
    for (var spaceIdx in board.links) {
      let links = board.links[spaceIdx];
      if (Array.isArray(links) && links.length > 1) {
        let space = board.spaces[spaceIdx];
        if (preferredSplitTypes.indexOf(space.type) === -1)
          return "There is a <a href='https://github.com/PartyPlanner64/PartyPlanner64/wiki/Creating-a-Board#board-flow' target='_blank'>non-conventional path split</a>.";
      }
    }
    return false;
  };

  function _overwriteAvailable(boardIndex) {
    return boardIndex === 0 || PP64.settings.get($setting.uiSkipValidation);
  }

  function _dontShowInUI(boardIndex) {
    return boardIndex > 7;
  }

  function _getRulesForBoard(gameID, boardIndex) {
    let rules = [
      PP64.validation.getRule("HASSTART"),
      PP64.validation.getRule("GAMEVERSION"),
      PP64.validation.getRule("DEADEND"),
      PP64.validation.getRule("TOOMANYSPACES"),
      PP64.validation.getRule("UNSUPPORTEDEVENTS"),
      PP64.validation.getRule("TOOMANYPATHOPTIONS"),
      PP64.validation.getRule("CHARACTERSONPATH"),
      PP64.validation.getRule("SPLITATNONINVISIBLESPACE"),
    ];

    switch(gameID) {
      case $gameType.MP1_USA:
      case $gameType.MP1_JPN:
        rules = rules.concat(PP64.validation.MP1.getValidationRulesForBoard(boardIndex));
        break;
      case $gameType.MP2_USA:
      case $gameType.MP2_JPN:
        rules = rules.concat(PP64.validation.MP2.getValidationRulesForBoard(boardIndex));
        break;
      case $gameType.MP3_USA:
      case $gameType.MP3_JPN:
        rules = rules.concat(PP64.validation.MP3.getValidationRulesForBoard(boardIndex));
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
      if (_dontShowInUI(boardIndex))
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
