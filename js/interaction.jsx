PP64.interaction = (function() {
  let selectedSpaceIndices = {};
  let startX = -1;
  let startY = -1;
  let lastX = -1;
  let lastY = -1;

  let canvasRect = null;

  function onEditorMouseDown(event) {
    const canvas = event.currentTarget;
    _onEditorDown(canvas, event.clientX, event.clientY, event.ctrlKey);
  }

  function onEditorTouchStart(event) {
    if (event.touches.length !== 1)
      return;

    const touch = event.touches[0];

    const canvas = event.currentTarget;
    _onEditorDown(canvas, touch.clientX, touch.clientY, event.ctrlKey);
  }

  /** mousedown or touchstart */
  function _onEditorDown(canvas, clientX, clientY, ctrlKey) {
    canvasRect = canvas.getBoundingClientRect();

    const clickX = clientX - canvasRect.left;
    const clickY = clientY - canvasRect.top;

    startX = lastX = clickX;
    startY = lastY = clickY;

    const clickedSpaceIndex = _getClickedSpace(lastX, lastY);
    $$log(`Clicked space: ${$$hex(clickedSpaceIndex)} (${clickedSpaceIndex})`,
      PP64.boards.getCurrentBoard().spaces[clickedSpaceIndex]);

    const spaceWasClicked = clickedSpaceIndex !== -1;

    // ROM boards cannot be edited, so create a copy right now and switch to it.
    if (PP64.boards.currentBoardIsROM() && spaceWasClicked) {
      PP64.app.changeCurrentAction($actType.MOVE); // Avoid destructive actions like delete.
      PP64.boards.copyCurrentBoard();
      PP64.boards.setCurrentBoard(PP64.boards.getCurrentBoardIndex() + 1);
    }

    const curAction = PP64.app.getCurrentAction();
    switch (curAction) {
      case $actType.MOVE:
        if (spaceWasClicked) {
          if (ctrlKey) {
            _addSelectedSpace(clickedSpaceIndex);
          }
          else if (!_spaceIsSelected(clickedSpaceIndex)) {
            _setSelectedSpace(clickedSpaceIndex);
          }
        }
        else {
          _clearSelectedSpaces();
        }
        break;
      case $actType.ADD_OTHER:
      case $actType.ADD_BLUE:
      case $actType.ADD_RED:
      case $actType.ADD_MINIGAME:
      case $actType.ADD_HAPPENING:
      case $actType.ADD_STAR:
      case $actType.ADD_BLACKSTAR:
      case $actType.ADD_START:
      case $actType.ADD_CHANCE:
      case $actType.ADD_SHROOM:
      case $actType.ADD_BOWSER:
      case $actType.ADD_ITEM:
      case $actType.ADD_BATTLE:
      case $actType.ADD_BANK:
      case $actType.ADD_GAMEGUY:
      case $actType.ADD_ARROW:
      case $actType.MARK_STAR:
      case $actType.MARK_GATE:
      case $actType.ADD_TOAD_CHARACTER:
      case $actType.ADD_BOWSER_CHARACTER:
      case $actType.ADD_KOOPA_CHARACTER:
      case $actType.ADD_BOO_CHARACTER:
      case $actType.ADD_BANK_SUBTYPE:
      case $actType.ADD_BANKCOIN_SUBTYPE:
      case $actType.ADD_ITEMSHOP_SUBTYPE:
        if (spaceWasClicked) {
          if (ctrlKey) {
            _addSelectedSpace(clickedSpaceIndex);
          }
          else if (!_spaceIsSelected(clickedSpaceIndex)) {
            _setSelectedSpace(clickedSpaceIndex);
          }
        }
        else if (!ctrlKey) {
          _clearSelectedSpaces();
        }
        break;
      case $actType.LINE:
      case $actType.LINE_STICKY:
        if (spaceWasClicked) {
          _setSelectedSpace(clickedSpaceIndex);
        }
        else {
          _clearSelectedSpaces();
        }
        break;
      case $actType.ERASE:
        _clearSelectedSpaces();
        break;
    }

    const selectedSpaces = _getSelectedSpaces();
    const curBoard = PP64.boards.getCurrentBoard();
    const clickedSpace = curBoard.spaces[clickedSpaceIndex];

    switch (curAction) {
      case $actType.LINE:
        if (selectedSpaces.length === 1) {
          let space = selectedSpaces[0];

          // Draw a line from the start space to the current location.
          PP64.renderer.renderConnections();
          PP64.renderer.drawConnection(space.x, space.y, clickX, clickY);

          if (PP64.renderer.rightClickOpen()) {
            PP64.renderer.updateRightClickMenu(null);
          }
        }
        break;

      case $actType.LINE_STICKY:
        if (selectedSpaces.length === 1) {
          let space = selectedSpaces[0];

          // Make a connection if we are in sticky mode and have reached a new space.
          if (clickedSpace && clickedSpace !== space) {
            const selectedSpaceIndex = PP64.boards.getSpaceIndex(space, curBoard);
            PP64.boards.addConnection(selectedSpaceIndex, clickedSpaceIndex);
            _setSelectedSpace(clickedSpaceIndex);
            PP64.renderer.renderConnections();
          }
          else {
            // Draw a line from the start space to the current location.
            PP64.renderer.renderConnections();
            PP64.renderer.drawConnection(space.x, space.y, clickX, clickY);
          }
        }
        break;

      case $actType.ERASE:
        if (clickedSpaceIndex !== -1 && _canRemoveSpaceAtIndex(curBoard, clickedSpaceIndex)) {
          PP64.boards.removeSpace(clickedSpaceIndex);
          PP64.app.changeSelectedSpaces([]);
          PP64.renderer.render();
        }
        else {
          _eraseLines(clickX, clickY); // Try to slice some lines!
        }
        break;

      case $actType.ADD_OTHER:
      case $actType.ADD_BLUE:
      case $actType.ADD_RED:
      case $actType.ADD_MINIGAME:
      case $actType.ADD_HAPPENING:
      case $actType.ADD_STAR:
      case $actType.ADD_BLACKSTAR:
      case $actType.ADD_START:
      case $actType.ADD_CHANCE:
      case $actType.ADD_SHROOM:
      case $actType.ADD_BOWSER:
      case $actType.ADD_ITEM:
      case $actType.ADD_BATTLE:
      case $actType.ADD_BANK:
      case $actType.ADD_GAMEGUY:
      case $actType.ADD_ARROW:
      case $actType.MARK_STAR:
      case $actType.MARK_GATE:
      case $actType.ADD_TOAD_CHARACTER:
      case $actType.ADD_BOWSER_CHARACTER:
      case $actType.ADD_KOOPA_CHARACTER:
      case $actType.ADD_BOO_CHARACTER:
      case $actType.ADD_BANK_SUBTYPE:
      case $actType.ADD_BANKCOIN_SUBTYPE:
      case $actType.ADD_ITEMSHOP_SUBTYPE:
        if (_addSpace(curAction, clickX, clickY, clickedSpace, false, ctrlKey)) {
          _addSelectedSpace(clickedSpaceIndex !== -1 ? clickedSpaceIndex : curBoard.spaces.length - 1);
        }
        break;

      case $actType.MOVE:
      default:
        if (PP64.renderer.rightClickOpen()) {
          PP64.renderer.updateRightClickMenu(selectedSpaces[0]);
        }
        break;
    }
  }

  function onEditorTouchMove(event) {
    let clickX, clickY;

    if (event.touches.length !== 1)
      return;

    if (!_hasAnySelectedSpace())
      return;

    event.preventDefault(); // Don't drag around the board.

    let touch = event.touches[0];

    clickX = touch.clientX - canvasRect.left;
    clickY = touch.clientY - canvasRect.top;

    _onEditorMove(clickX, clickY);
  }

  function onEditorMouseMove(event) {
    let clickX, clickY;

    if (!canvasRect || event.buttons !== 1)
      return;

    clickX = event.clientX - canvasRect.left;
    clickY = event.clientY - canvasRect.top;

    _onEditorMove(clickX, clickY);
  }

  function _onEditorMove(clickX, clickY) {
    if (PP64.boards.currentBoardIsROM())
      return;

    const curAction = PP64.app.getCurrentAction();
    if (!_hasAnySelectedSpace() && curAction !== $actType.ERASE) {
      lastX = clickX;
      lastY = clickY;
      return;
    }

    const selectedSpaces = _getSelectedSpaces();
    const curBoard = PP64.boards.getCurrentBoard();
    const clickedSpaceIndex = _getClickedSpace(clickX, clickY);

    switch (curAction) {
      case $actType.LINE:
        if (selectedSpaces.length === 1) {
          let space = selectedSpaces[0];

          // Draw a line from the start space to the current location.
          PP64.renderer.renderConnections();
          PP64.renderer.drawConnection(space.x, space.y, clickX, clickY);

          if (PP64.renderer.rightClickOpen()) {
            PP64.renderer.updateRightClickMenu(null);
          }
        }
        break;

      case $actType.LINE_STICKY:
        if (selectedSpaces.length === 1) {
          let space = selectedSpaces[0];

          // Make a connection if we are in sticky mode and have reached a new space.
          let endSpace = curBoard.spaces[clickedSpaceIndex];
          if (endSpace && endSpace !== space) {
            const selectedSpaceIndex = PP64.boards.getSpaceIndex(space, curBoard);
            PP64.boards.addConnection(selectedSpaceIndex, clickedSpaceIndex);
            _setSelectedSpace(clickedSpaceIndex);
            PP64.renderer.renderConnections();
          }
          else {
            // Draw a line from the start space to the current location.
            PP64.renderer.renderConnections();
            PP64.renderer.drawConnection(space.x, space.y, clickX, clickY);
          }
        }
        break;

      case $actType.ERASE:
        if (clickedSpaceIndex !== -1 && _canRemoveSpaceAtIndex(curBoard, clickedSpaceIndex)) {
          PP64.boards.removeSpace(clickedSpaceIndex);
          PP64.app.changeSelectedSpaces([]);
          PP64.renderer.render();
        }
        else {
          _eraseLines(clickX, clickY); // Try to slice some lines!
        }
        break;

      case $actType.MOVE:
      case $actType.ADD_OTHER:
      case $actType.ADD_BLUE:
      case $actType.ADD_RED:
      case $actType.ADD_MINIGAME:
      case $actType.ADD_HAPPENING:
      case $actType.ADD_STAR:
      case $actType.ADD_BLACKSTAR:
      case $actType.ADD_START:
      case $actType.ADD_CHANCE:
      case $actType.ADD_SHROOM:
      case $actType.ADD_BOWSER:
      case $actType.ADD_ITEM:
      case $actType.ADD_BATTLE:
      case $actType.ADD_BANK:
      case $actType.ADD_GAMEGUY:
      case $actType.ADD_ARROW:
      case $actType.MARK_STAR:
      case $actType.MARK_GATE:
      case $actType.ADD_TOAD_CHARACTER:
      case $actType.ADD_BOWSER_CHARACTER:
      case $actType.ADD_KOOPA_CHARACTER:
      case $actType.ADD_BOO_CHARACTER:
      case $actType.ADD_BANK_SUBTYPE:
      case $actType.ADD_BANKCOIN_SUBTYPE:
      case $actType.ADD_ITEMSHOP_SUBTYPE:
      default:
        // Move the space(s)
        let deltaX = clickX - lastX;
        let deltaY = clickY - lastY;

        selectedSpaces.forEach(space => {
          const newX = space.x + deltaX;
          space.x = Math.max(0, Math.min(newX, curBoard.bg.width));

          const newY = space.y + deltaY;
          space.y = Math.max(0, Math.min(newY, curBoard.bg.height));
        });

        renderConnectionsOnTimeout();
        renderSpacesOnTimeout();

        if (PP64.renderer.rightClickOpen()) {
          PP64.renderer.updateRightClickMenu(selectedSpaces[0]);
        }
        break;
    }

    //$$log("dX: " + deltaX + ", dY: " + deltaY);

    lastX = clickX;
    lastY = clickY;
  }

  function onEditorMouseUp(event) {
    if (event.button !== 0)
      return;

    _onEditorUp();
  }

  function onEditorTouchEnd(event) {
    if (event.touches.length !== 1)
      return;

    _onEditorUp();
  }

  function _onEditorUp() {
    if (PP64.boards.currentBoardIsROM())
      return;

    if (!_hasAnySelectedSpace())
      return;

    const selectedSpaces = _getSelectedSpaces();
    const curAction = PP64.app.getCurrentAction();
    if (curAction === $actType.LINE) {
      let endSpaceIdx = _getClickedSpace(lastX, lastY);
      if (endSpaceIdx !== -1 && selectedSpaces.indexOf(endSpaceIdx) === -1) {
        for (let index in selectedSpaceIndices) {
          PP64.boards.addConnection(parseInt(index), endSpaceIdx);
        }
      }

      PP64.renderer.renderConnections();
    }
  }

  function onEditorClick(event) {
    //console.log("onEditorClick", event);
    if (PP64.boards.currentBoardIsROM())
      return;

    const moved = Math.abs(startX - lastX) > 5 || Math.abs(startY - lastY) > 5;
    const movedAtAll = Math.abs(startX - lastX) > 0 || Math.abs(startY - lastY) > 0;

    const selectedSpaces = _getSelectedSpaces();

    startX = lastX = -1;
    startY = lastY = -1;

    const ctrlKey = event.ctrlKey;
    const clickX = event.clientX - canvasRect.left;
    const clickY = event.clientY - canvasRect.top;
    let clickedSpaceIdx = _getClickedSpace(clickX, clickY);

    const curBoard = PP64.boards.getCurrentBoard();
    const clickedSpace = clickedSpaceIdx === -1 ? null : curBoard.spaces[clickedSpaceIdx];

    if (event.button !== 0)
      return;

    const curAction = PP64.app.getCurrentAction();
    switch (curAction) {
      case $actType.MOVE:
      case $actType.ADD_OTHER:
      case $actType.ADD_BLUE:
      case $actType.ADD_RED:
      case $actType.ADD_MINIGAME:
      case $actType.ADD_HAPPENING:
      case $actType.ADD_STAR:
      case $actType.ADD_BLACKSTAR:
      case $actType.ADD_START:
      case $actType.ADD_CHANCE:
      case $actType.ADD_SHROOM:
      case $actType.ADD_BOWSER:
      case $actType.ADD_ITEM:
      case $actType.ADD_BATTLE:
      case $actType.ADD_BANK:
      case $actType.ADD_GAMEGUY:
      case $actType.ADD_ARROW:
      case $actType.MARK_GATE:
      case $actType.ADD_TOAD_CHARACTER:
      case $actType.ADD_BOWSER_CHARACTER:
      case $actType.ADD_KOOPA_CHARACTER:
      case $actType.ADD_BOO_CHARACTER:
      case $actType.ADD_BANK_SUBTYPE:
      case $actType.ADD_BANKCOIN_SUBTYPE:
      case $actType.ADD_ITEMSHOP_SUBTYPE:
        if (!movedAtAll && !ctrlKey) {
          if (!clickedSpace) {
            _clearSelectedSpaces();
          }
          else {
            _setSelectedSpace(clickedSpaceIdx);
          }
        }
        break;

      case $actType.MARK_STAR:
        if (!moved) {
          _toggleHostsStar(selectedSpaces);
        }
        break;

      case $actType.LINE:
      case $actType.LINE_STICKY:
        PP64.renderer.renderConnections();
        break;

      case $actType.ERASE:
        break;
    }
  }

  function onEditorRightClick(event) {
    //console.log("onEditorRightClick", event);

    event.preventDefault();
    event.stopPropagation();

    const selectedSpaces = _getSelectedSpaces();
    const space = selectedSpaces.length !== 1 ? null : selectedSpaces[0];
    PP64.renderer.updateRightClickMenu(space);
  };

  function onEditorDrop(event) {
    event.preventDefault();

    if (PP64.boards.currentBoardIsROM())
      return;

    if (PP64.renderer.rightClickOpen())
      PP64.renderer.updateRightClickMenu(null);

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text"));
    } catch (e) { return; }

    _clearSelectedSpaces();

    if (typeof data === "object" && data.action) {
      let canvas = event.currentTarget;
      canvasRect = canvas.getBoundingClientRect();
      let clickX = event.clientX - canvasRect.left;
      let clickY = event.clientY - canvasRect.top;
      let droppedOnSpaceIdx = _getClickedSpace(clickX, clickY);
      let curBoard = PP64.boards.getCurrentBoard();
      let curSpace = droppedOnSpaceIdx === -1 ? null : curBoard.spaces[droppedOnSpaceIdx];
      _addSpace(data.action.type, clickX, clickY, curSpace, false, false);
    }
  }

  function onEditorKeyDown(event) {
    const selectedSpaces = PP64.app.getSelectedSpaces();
    if (!selectedSpaces || !selectedSpaces.length)
      return;

    const board = PP64.boards.getCurrentBoard();

    if (event.keyCode === 38) { // up arrow
      selectedSpaces.forEach(space => {
        space.y = Math.max(space.y - 1, 0);
      });
      PP64.app.changeSelectedSpaces(selectedSpaces);
    }
    else if (event.keyCode === 40) { // down arrow
      selectedSpaces.forEach(space => {
        space.y = Math.min(space.y + 1, board.bg.height);
      });
      PP64.app.changeSelectedSpaces(selectedSpaces);
    }
    else if (event.keyCode === 37) { // left arrow
      selectedSpaces.forEach(space => {
        space.x = Math.max(space.x - 1, 0);
      });
      PP64.app.changeSelectedSpaces(selectedSpaces);
    }
    else if (event.keyCode === 39) { // right arrow
      selectedSpaces.forEach(space => {
        space.x = Math.min(space.x + 1, board.bg.width);
      });
      PP64.app.changeSelectedSpaces(selectedSpaces);
    }
    else if (event.keyCode === 46) { // delete
      // If any characters are on the spaces, first press just deletes them.
      // If there are no characters, selected spaces are deleted.
      let onlySubtype = false
      selectedSpaces.forEach(space => {
        if (space.subtype !== undefined) {
          onlySubtype = true;
        }
      });
      selectedSpaces.forEach(space => {
        // Delete the character(s) off first.
        if (onlySubtype) {
          if (space.subtype !== undefined) {
            delete space.subtype;
          }
        }
        else {
          let index = PP64.boards.getSpaceIndex(space, board);
          if (_canRemoveSpaceAtIndex(board, index)) {
            PP64.boards.removeSpace(index, board);
          }
        }
      });
      if (onlySubtype) {
        PP64.app.changeSelectedSpaces(selectedSpaces);
      }
      else {
        PP64.app.changeSelectedSpaces([]);
      }
    }
  }

  let _renderConnectionsTimer;
  function renderConnectionsOnTimeout() {
    if (!_renderConnectionsTimer) {
      _renderConnectionsTimer = setTimeout(_renderConnectionsTimeoutFn, 10);
    }
  }
  function _renderConnectionsTimeoutFn() {
    PP64.renderer.renderConnections();
    _renderConnectionsTimer = null;
  }

  let _renderSpacesTimer;
  function renderSpacesOnTimeout() {
    if (!_renderSpacesTimer) {
      _renderSpacesTimer = setTimeout(_renderSpacesTimeoutFn, 10);
    }
  }
  function _renderSpacesTimeoutFn() {
    PP64.renderer.renderSpaces();
    PP64.renderer.renderSelectedSpaces();
    _renderSpacesTimer = null;
  }

  function _clearSelectedSpaces() {
    selectedSpaceIndices = {};
    PP64.app.changeSelectedSpaces([]);
  }

  function _changeSelectedSpaces() {
    PP64.app.changeSelectedSpaces(_getSelectedSpaces());
  }

  function _getSelectedSpaces() {
    const curBoard = PP64.boards.getCurrentBoard();
    const selectedSpaces = [];
    for (let index in selectedSpaceIndices) {
      let space = curBoard.spaces[index];
      selectedSpaces.push(space);
    }
    return selectedSpaces;
  }

  function _hasAnySelectedSpace() {
    for (let index in selectedSpaceIndices) {
      return true;
    }
    return false;
  }

  function _spaceIsSelected(spaceIndex) {
    return !!selectedSpaceIndices[spaceIndex];
  }

  function _addSelectedSpace(spaceIndex) {
    if (!selectedSpaceIndices) {
      selectedSpaceIndices = {};
    }
    selectedSpaceIndices[spaceIndex] = true;
    _changeSelectedSpaces();
  }

  function _setSelectedSpace(spaceIndex) {
    selectedSpaceIndices = {
      [spaceIndex]: true,
    };
    _changeSelectedSpaces();
  }

  function _getClickedSpace(x, y) {
    const curBoard = PP64.boards.getCurrentBoard();
    const spaceRadius = curBoard.game === 3 ? 14 : 8;

    // Search for the last space that could be clicked. (FIXME: consider circular shape.)
    let spaceIdx = -1;
    for (let index = 0; index < curBoard.spaces.length; index++) {
      let space = curBoard.spaces[index];
      if (!space)
        continue;

      if (Math.abs(space.x - x) <= spaceRadius && Math.abs(space.y - y) <= spaceRadius)
        spaceIdx = index;
    }

    return spaceIdx;
  }

  function _canRemoveSpaceAtIndex(board, spaceIndex) {
    const space = board.spaces[spaceIndex];
    if (!space)
      return false;

    // Don't allow removing the last start space, since in
    // non-advanced mode you can't add it back.
    if (space.type === $spaceType.START) {
      const startSpaces = PP64.boards.getSpacesOfType($spaceType.START, board);
      return startSpaces.length > 1;
    }

    return true;
  }

  function _addSpace(action, x, y, clickedSpace, moved, ctrlKey) {
    let spaceType = _getSpaceTypeFromAction(action);
    let spaceSubType = _getSpaceSubTypeFromAction(action);
    let shouldChangeSelection = false;
    if (clickedSpace) {
      // If we are clicking a space, the only "add" action could be to toggle subtype.
      if (spaceSubType !== undefined && !moved) {
        if (clickedSpace.type !== $spaceType.OTHER && spaceSubType === $spaceSubType.GATE) {
          // Don't add gate to non-invisible space.
        }
        else if (clickedSpace.subtype === spaceSubType)
          delete clickedSpace.subtype;
        else
          clickedSpace.subtype = spaceSubType;

        PP64.app.changeSelectedSpaces([clickedSpace]);
        shouldChangeSelection = true;
      }
    }
    else {
      const curBoard = PP64.boards.getCurrentBoard();
      const newSpaceIdx = PP64.boards.addSpace(x, y, spaceType, spaceSubType);
      const newSpace = curBoard.spaces[newSpaceIdx];

      if (ctrlKey) {
        const selectedSpaces = PP64.app.getSelectedSpaces() || [];
        selectedSpaces.push(newSpace);
        PP64.app.changeSelectedSpaces(selectedSpaces);
      }
      else {
        PP64.app.changeSelectedSpaces([newSpace]);
      }
      shouldChangeSelection = true;
    }

    PP64.renderer.renderSpaces();
    return shouldChangeSelection;
  }

  function _toggleHostsStar(selectedSpaces) {
    if (!selectedSpaces || !selectedSpaces.length)
      return;

    selectedSpaces.forEach(space => {
      space.star = !space.star;
    });

    PP64.renderer.renderSpaces();
    PP64.app.changeSelectedSpaces(selectedSpaces); // Refresh because .star changed
  }

  function _eraseLines(x, y) {
    let board = PP64.boards.getCurrentBoard();
    let spaces = board.spaces;
    let links = board.links;
    let somethingErased = false;
    for (let startIdx in links) {
      let startSpace = spaces[startIdx];
      let endSpace;
      let endLinks = links[startIdx];
      if (Array.isArray(endLinks)) {
        let i = 0;
        while (i < endLinks.length) {
          endSpace = spaces[endLinks[i]];
          if (_shouldEraseLine(startSpace, endSpace, x, y)) {
            endLinks.splice(i, 1);
            somethingErased = true;
          }
          else i++;
        }
        if (endLinks.length === 1)
          endLinks = endLinks[0];
        else if (!endLinks.length)
          delete links[startIdx];
      }
      else {
        endSpace = spaces[endLinks];
        if (_shouldEraseLine(startSpace, endSpace, x, y)) {
          delete links[startIdx];
          somethingErased = true;
        }
      }
    }
    if (somethingErased)
      PP64.renderer.renderConnections();
  }

  function _shouldEraseLine(startSpace, endSpace, targetX, targetY) {
    if (targetX > startSpace.x && targetX > endSpace.x)
      return false;
    if (targetX < startSpace.x && targetX < endSpace.x)
      return false;
    if (targetY > startSpace.y && targetY > endSpace.y)
      return false;
    if (targetY < startSpace.y && targetY < endSpace.y)
      return false;
    return $$number.lineDistance(targetX, targetY, startSpace.x, startSpace.y, endSpace.x, endSpace.y) <= 4;
  }

  function _getSpaceTypeFromAction(action) {
    let spaceType = $spaceType.OTHER;
    if (action === $actType.ADD_BLUE) spaceType = $spaceType.BLUE;
    else if (action === $actType.ADD_RED) spaceType = $spaceType.RED;
    else if (action === $actType.ADD_HAPPENING) spaceType = $spaceType.HAPPENING;
    else if (action === $actType.ADD_STAR) spaceType = $spaceType.STAR;
    else if (action === $actType.ADD_BLACKSTAR) spaceType = $spaceType.BLACKSTAR;
    else if (action === $actType.ADD_MINIGAME) spaceType = $spaceType.MINIGAME;
    else if (action === $actType.ADD_CHANCE) spaceType = $spaceType.CHANCE;
    else if (action === $actType.ADD_START) spaceType = $spaceType.START;
    else if (action === $actType.ADD_SHROOM) spaceType = $spaceType.SHROOM;
    else if (action === $actType.ADD_BOWSER) spaceType = $spaceType.BOWSER;
    else if (action === $actType.ADD_ITEM) spaceType = $spaceType.ITEM;
    else if (action === $actType.ADD_BATTLE) spaceType = $spaceType.BATTLE;
    else if (action === $actType.ADD_BANK) spaceType = $spaceType.BANK;
    else if (action === $actType.ADD_ARROW) spaceType = $spaceType.ARROW;
    else if (action === $actType.ADD_GAMEGUY) spaceType = $spaceType.GAMEGUY;
    return spaceType;
  }

  function _getSpaceSubTypeFromAction(action) {
    let spaceSubType;
    if (action === $actType.ADD_TOAD_CHARACTER) spaceSubType = $spaceSubType.TOAD;
    else if (action === $actType.ADD_BOWSER_CHARACTER) spaceSubType = $spaceSubType.BOWSER;
    else if (action === $actType.ADD_KOOPA_CHARACTER) spaceSubType = $spaceSubType.KOOPA;
    else if (action === $actType.ADD_BOO_CHARACTER) spaceSubType = $spaceSubType.BOO;
    else if (action === $actType.ADD_BANK_SUBTYPE) spaceSubType = $spaceSubType.BANK;
    else if (action === $actType.ADD_BANKCOIN_SUBTYPE) spaceSubType = $spaceSubType.BANKCOIN;
    else if (action === $actType.ADD_ITEMSHOP_SUBTYPE) spaceSubType = $spaceSubType.ITEMSHOP;
    else if (action === $actType.MARK_GATE) spaceSubType = $spaceSubType.GATE;
    return spaceSubType;
  }

  function _getSpaceSubTypeFromAction(action) {
    let spaceSubType;
    if (action === $actType.ADD_TOAD_CHARACTER) spaceSubType = $spaceSubType.TOAD;
    else if (action === $actType.ADD_BOWSER_CHARACTER) spaceSubType = $spaceSubType.BOWSER;
    else if (action === $actType.ADD_KOOPA_CHARACTER) spaceSubType = $spaceSubType.KOOPA;
    else if (action === $actType.ADD_BOO_CHARACTER) spaceSubType = $spaceSubType.BOO;
    else if (action === $actType.ADD_BANK_SUBTYPE) spaceSubType = $spaceSubType.BANK;
    else if (action === $actType.ADD_BANKCOIN_SUBTYPE) spaceSubType = $spaceSubType.BANKCOIN;
    else if (action === $actType.ADD_ITEMSHOP_SUBTYPE) spaceSubType = $spaceSubType.ITEMSHOP;
    else if (action === $actType.MARK_GATE) spaceSubType = $spaceSubType.GATE;
    return spaceSubType;
  }

  function preventDefault(event) { event.preventDefault(); }
  return {
    attachToCanvas: function(canvas) {
      canvas.addEventListener("contextmenu", onEditorRightClick, false);
      canvas.addEventListener("click", onEditorClick, false);
      canvas.addEventListener("mousedown", onEditorMouseDown, false);
      canvas.addEventListener("mousemove", onEditorMouseMove, false);
      canvas.addEventListener("mouseup", onEditorMouseUp, false);
      canvas.addEventListener("touchstart", onEditorTouchStart, false);
      canvas.addEventListener("touchmove", onEditorTouchMove, false);
      canvas.addEventListener("touchend", onEditorTouchEnd, false);
      canvas.addEventListener("drop", onEditorDrop, false);
      canvas.addEventListener("dragover", preventDefault, false);
      canvas.addEventListener("keydown", onEditorKeyDown, false);
    },
    detachFromCanvas: function(canvas) {
      canvas.removeEventListener("contextmenu", onEditorRightClick);
      canvas.removeEventListener("click", onEditorClick);
      canvas.removeEventListener("mousedown", onEditorMouseDown);
      canvas.removeEventListener("mousemove", onEditorMouseMove);
      canvas.removeEventListener("mouseup", onEditorMouseUp);
      canvas.removeEventListener("touchstart", onEditorTouchStart);
      canvas.removeEventListener("touchmove", onEditorTouchMove);
      canvas.removeEventListener("touchend", onEditorTouchEnd);
      canvas.removeEventListener("drop", onEditorDrop);
      canvas.removeEventListener("dragover", preventDefault);
      canvas.removeEventListener("keydown", onEditorKeyDown);
    }
  };
})();
