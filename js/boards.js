PP64.boards = (function() {
  let currentBoard = 0;

  function _makeDefaultBoard(gameVersion = 1) {
    let board = {
      name: "Untitled",
      description: "Use your Star Power to finish\nthis board.",
      difficulty: 3,
      spaces: [],
      links: {},
      game: gameVersion,
    };
    switch (gameVersion) {
      case 1:
        board.bg = {
          "width": 960,
          "height": 720,
          "src": true, // Replaced with theme url later.
        };
        board.otherbg = {
          boardselect: true, // Replaced with theme url later.
          boardlogo: true,
          largescene: true,
          conversation: true,
          splashscreen: true,
        };
        board.audioIndex = 0x18; // Mambo!
        break;
      case 2:
        board.bg = {
          width: 1152,
          height: 864,
          src: true
        };
        board.animbg = [];
        board.otherbg = {
          boardselect: true,
          boardselecticon: true,
          boardlogo: true,
          largescene: true,
        };
        break;
      case 3:
        board.bg = {
          width: 1152,
          height: 864,
          src: true
        };
        board.otherbg = {
          boardselect: true,
          boardlogo: true,
          boardlogotext: true,
          largescene: true,
        };
        break;
    }
    board.spaces.push({ "x": board.bg.width - 200, "y": board.bg.height - 200, "type": $spaceType.START });
    applyTheme(board);
    return board;
  }

  let boards;
  let cachedBoards = window.localStorage && localStorage.getItem("boards");
  if (cachedBoards) {
    boards = JSON.parse(cachedBoards);
  }
  if (!boards || !boards.length) {
    boards = [ _makeDefaultBoard(1) ];
  }

  window.addEventListener("beforeunload", function() {
    if (!window.localStorage)
      return;
    let myBoards = boards.filter(val => {
      return !boardIsROM(val);
    });
    try {
      localStorage.setItem("boards", JSON.stringify(myBoards));
    }
    catch (e) {
      // Browsers don't really let you save much...
      // return "The browser won't let PartyPlanner64 save all your boards. Return to the editor and export them?";
    }
  });

  function addBoard(board, opts = {}) {
    if (!board)
      board = _makeDefaultBoard(opts.game || 1)

    if (opts.rom)
      board._rom = true;

    boards.push(board);

    PP64.app.boardsChanged();

    return boards.length - 1;
  }

  function getCurrentBoard(forExport = false) {
    let board = boards[currentBoard];
    if (forExport)
      board = stripPrivateProps(board);
    return board;
  }

  function setCurrentBoard(index) {
    currentBoard = index;
    PP64.app.currentBoardChanged();
  }

  function boardIsROM(board) {
     return !!board._rom;
  }

  // Tests if there is a connection from startIdx to endIdx.
  // If endIdx is not passed, test if any connection is outbound from startIdx.
  function hasConnection(startIdx, endIdx, board = getCurrentBoard()) {
    if (Array.isArray(board.links[startIdx])) {
      if (endIdx === null || endIdx === undefined)
        return true; // Asking if any connections exist out of startIdx
      return board.links[startIdx].indexOf(endIdx) >= 0;
    }
    if (board.links[startIdx] !== undefined && board.links[startIdx] !== null) {
      if (endIdx === null || endIdx === undefined)
        return true;
      return board.links[startIdx] === endIdx;
    }
    return false;
  }

  // Removes all connections to a certain space.
  function _removeConnections(spaceIdx, board) {
    if (!board.links)
      return;

    delete board.links[spaceIdx];
    for (let startSpace in board.links) {
      let value = board.links[startSpace];
      if (Array.isArray(value)) {
        let entry = value.indexOf(spaceIdx);
        if (entry !== -1)
          value.splice(entry, 1);
        if (value.length === 1)
          board.links[startSpace] = value[0];
        else if (!value.length)
          delete board.links[startSpace];
      }
      else if (value === spaceIdx) {
        delete board.links[startSpace];
      }
    }
  }

  // Removes any _ prefixed property from a board.
  function stripPrivateProps(obj = {}) {
    if (typeof obj !== "object")
      return obj;

    obj = JSON.parse(JSON.stringify(obj));
    for (var prop in obj) {
      if (!obj.hasOwnProperty(prop))
        continue;
      if (prop.charAt(0) === '_')
        delete obj[prop];
      if (typeof obj[prop] === "object" && obj[prop] !== null)
        obj[prop] = stripPrivateProps(obj[prop]);
    }
    return obj;
  }

  function addEventToSpace(space, event, toStart) {
    space.events = space.events || [];
    if (event) {
      if (toStart)
        space.events.unshift(event);
      else
        space.events.push(event);
    }
  }

  function removeEventFromSpace(space, event) {
    if (!space || !event || !space.events)
      return;

    // Try to just splice a given reference.
    let eventIndex = space.events.indexOf(event);
    if (eventIndex !== -1) {
      space.events.splice(eventIndex, 1);
      return;
    }

    // Otherwise, try to search for essentially the same thing?
  }

  function applyTheme(board, name = "default") {
    const themePathPrefix = "img/themes/";

    if (board.otherbg.boardselect)
      board.otherbg.boardselect = themePathPrefix + name + "/boardselect.png";
    if (board.otherbg.boardselecticon)
      board.otherbg.boardselecticon = themePathPrefix + name + "/boardselecticon.png";
    if (board.otherbg.boardlogo)
      board.otherbg.boardlogo = themePathPrefix + name + "/boardlogo.png";
    if (board.otherbg.boardlogotext)
      board.otherbg.boardlogotext = themePathPrefix + name + "/boardlogotext.png";
    if (board.otherbg.largescene)
      board.otherbg.largescene = themePathPrefix + name + "/largescene.png";
    if (board.otherbg.conversation)
      board.otherbg.conversation = themePathPrefix + name + "/conversation.png";
    if (board.otherbg.splashscreen)
      board.otherbg.splashscreen = themePathPrefix + name + "/splashscreen.png";
    switch (board.game) {
      case 1:
        board.bg.src = themePathPrefix + name + "/bg.png";
        break;
      case 2:
      case 3:
        board.bg.src = themePathPrefix + name + "/bg2.png";
        break;
    }
  }

  return {
    getCurrentBoard,

    getCurrentBoardIndex: function() {
      return currentBoard;
    },

    setCurrentBoard,

    currentBoardIsROM: function() {
      return !!getCurrentBoard()._rom;
    },

    boardIsROM,

    getBoardCount: function() {
      return boards.length;
    },

    getBoards: function() {
      return boards;
    },

    getROMBoards: function() {
      return boards.filter(board => {
        return boardIsROM(board);
      });
    },

    setBG: function(bg, board = getCurrentBoard()) {
      board.bg.src = bg;
    },

    addAnimBG: function(bg, board = getCurrentBoard()) {
      board.animbg = board.animbg || [];
      board.animbg.push(bg);
    },

    removeAnimBG: function(index, board = getCurrentBoard()) {
      if (!board.animbg || board.animbg.length <= index || index < 0)
        return;

      board.animbg.splice(index, 1);
    },

    addBoard,

    deleteBoard: function(boardIdx) {
      if (isNaN(boardIdx) || boardIdx < 0 || boardIdx >= boards.length)
        return;

      if (boards.length === 1)
        addBoard(); // Can never be empty.

      boards.splice(boardIdx, 1);

      if (currentBoard > boardIdx)
        setCurrentBoard(currentBoard - 1);
      else if (boards.length === 1)
        setCurrentBoard(0); // We deleted the last remaining board
      else if (currentBoard === boardIdx && currentBoard === boards.length)
        setCurrentBoard(currentBoard - 1); // We deleted the end and current entry.

      PP64.app.boardsChanged();
      PP64.app.currentBoardChanged();
    },

    copyCurrentBoard: function() {
      let source = boards[currentBoard];
      let copy = JSON.parse(JSON.stringify(source));
      delete copy._rom;
      copy.name = "Copy of " + copy.name;
      boards.splice(currentBoard + 1, 0, copy);

      PP64.app.boardsChanged();
    },

    addSpace: function(x, y, type, subtype, board = getCurrentBoard()) {
      let newSpace = {
        x,
        y,
        z: 0,
        type: type
      };

      if (subtype !== undefined)
        newSpace.subtype = subtype;

      let adapter = PP64.adapters.getAdapter(board.game || 1);
      if (adapter)
        adapter.hydrateSpace(newSpace);

      for (let i = 0; i < board.spaces.length; i++) {
        if (board.spaces === null) {
          board.spaces[i] = newSpace;
          return i;
        }
      }

      board.spaces.push(newSpace);
      return board.spaces.length - 1;
    },

    removeSpace: function(index, board = getCurrentBoard()) {
      if (index < 0 || index >= board.spaces.length)
        return;

      // Remove any attached connections.
      _removeConnections(index, board);

      // Remove the actual space.
      let oldSpaceLen = board.spaces.length;
      board.spaces.splice(index, 1);

      function _adjust(oldIdx) {
        return parseInt(oldIdx) > parseInt(index) ? oldIdx - 1 : oldIdx;
      }

      // Update the links that are at a greater index.
      let start, end;
      for (let i = 0; i < oldSpaceLen; i++) {
        if (!board.links.hasOwnProperty(i))
          continue;

        start = _adjust(i);
        end = board.links[i];
        if (start !== i)
          delete board.links[i];
        if (Array.isArray(end))
          board.links[start] = end.map(_adjust);
        else
          board.links[start] = _adjust(end);
      }
    },

    getSpaceIndex: function(space, board = getCurrentBoard()) {
      return board.spaces.indexOf(space);
    },

    getStartSpace: function(board) {
      let spaces = board.spaces;
      for (let i = 0; i < spaces.length; i++) {
        if (!spaces[i])
          continue;
        if (spaces[i].type === PP64.types.Space.START)
          return i;
      }
      return null;
    },

    getSpacesOfSubType: function(subtype, board = getCurrentBoard()) {
      let spaces = board.spaces;
      let subtypeSpaces = [];
      for (let i = 0; i < spaces.length; i++) {
        if (!spaces[i])
          continue;
        if (spaces[i].subtype === subtype)
          subtypeSpaces.push(i);
      }
      return subtypeSpaces;
    },

    hasConnection,

    addConnection: function(startIdx, endIdx, board = getCurrentBoard()) {
      if (startIdx === endIdx || hasConnection(startIdx, endIdx, board))
        return;

      board.links = board.links || {};
      if (Array.isArray(board.links[startIdx]))
        board.links[startIdx].push(endIdx);
      else if (!isNaN(board.links[startIdx]))
        board.links[startIdx] = [board.links[startIdx], endIdx];
      else if (endIdx >= 0)
        board.links[startIdx] = endIdx;
    },

    addAssociation: function(startIdx, endIdx, board = getCurrentBoard()) { // TODO: WHAT IS THIS
      board.associations = board.associations || {};
      let startIsSubtype = isNaN(board.spaces[startIdx].subtype);
      let endIsSubtype = isNaN(board.spaces[endIdx].subtype);

      // Cannot associate two subtype spaces or two regular spaces.
      if (startIsSubtype === endIsSubtype)
        return;
    },

    addEventByIndex: function(board, spaceIdx, event, toStart) {
      let space = board.spaces[spaceIdx];
      addEventToSpace(space, event, toStart);
    },

    addEventToSpace,

    removeEventFromSpace,

    loadBoardsFromROM: function() {
      let adapter = PP64.adapters.getROMAdapter();
      if (!adapter)
        return;

      let gameBoards = adapter.loadBoards();
      for (let i = 0; i < gameBoards.length; i++) {
        gameBoards[i]._rom = true;
        boards.push(gameBoards[i]);
      }

      PP64.app.boardsChanged();
    },

    clearBoardsFromROM: function() {
      for (let i = boards.length - 1; i >= 0; i--) {
        if (boards[i]._rom)
          boards.splice(i, 1);
      }

      if (!boards.length)
        addBoard(); // Can never be empty.
    }
  };
})();
