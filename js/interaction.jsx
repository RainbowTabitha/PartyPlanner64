PP64.interaction = (function() {
  let currentSpaceIdx = -1;
  let startX = -1;
  let startY = -1;
  let lastX = -1;
  let lastY = -1;

  let canvasRect = null;

  function getClickedSpace(x, y) {
    let cur_board = PP64.boards.getCurrentBoard();
    let spaceRadius = cur_board.game === 3 ? 14 : 8;

    // Search for the last space that could be clicked. (FIXME: consider circular shape.)
    let spaceIdx = -1;
    for (let index = 0; index < cur_board.spaces.length; index++) {
      let space = cur_board.spaces[index];
      if (space === null)
        continue;

      if (Math.abs(space.x - x) <= spaceRadius && Math.abs(space.y - y) <= spaceRadius)
        spaceIdx = index;
    }

    return spaceIdx;
  }

  function onEditorRightClick(event) {
    //console.log("onEditorRightClick", event);

    event.preventDefault();
    event.stopPropagation();

    let space = currentSpaceIdx === -1 ? null : PP64.boards.getCurrentBoard().spaces[currentSpaceIdx];
    PP64.renderer.updateRightClickMenu(space);

    currentSpaceIdx = -1;
  };

  function onEditorClick(event) {
    //console.log("onEditorClick", event);
    if (PP64.boards.currentBoardIsROM())
      return;

    let moved = Math.abs(startX - lastX) > 5 || Math.abs(startY - lastY) > 5;

    let curSpaceIdx = currentSpaceIdx;
    currentSpaceIdx = -1;
    startX = lastX = -1;
    startY = lastY = -1;

    let curBoard = PP64.boards.getCurrentBoard();
    let curSpace = curSpaceIdx === -1 ? null : curBoard.spaces[curSpaceIdx];

    PP64.app.changeCurrentSpace(curSpace);

    if (PP64.renderer.rightClickOpen() && !moved) {
      PP64.renderer.updateRightClickMenu(curSpace);
      if (curSpace) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.button !== 0)
      return;

    let curAction = PP64.app.getCurrentAction();
    let actionsHandledInEditorUp = [
      $actType.LINE,
      $actType.LINE_STICKY,
      //$actType.ASSOCIATE
      $actType.MOVE,
    ];
    if (actionsHandledInEditorUp.indexOf(curAction) >= 0)
      return;

    let clickX = event.clientX - canvasRect.left;
    let clickY = event.clientY - canvasRect.top;

    if (curAction === $actType.DELETE || curAction === $actType.ERASE) {
      if (curSpace && curSpace.type !== $spaceType.START) {
        PP64.boards.removeSpace(curSpaceIdx);
        PP64.app.changeCurrentSpace(null);
        PP64.renderer.render();
      }
      else {
        _eraseLines(clickX, clickY);
      }
    } else if (curAction === $actType.MARK_STAR) {
      _toggleHostsStar(curSpace);
    } else if (curAction === $actType.MARK_GATE) {
      _toggleGate(curSpace);
    } else {
      if (moved && getClickedSpace(clickX, clickY) >= 0)
        return; // Avoid placing over an existing space
      _addSpace(curAction, clickX, clickY, curSpace, moved);
    }
  }

  function _addSpace(action, x, y, curSpace, moved) {
    let spaceType = _getSpaceTypeFromAction(action);
    let spaceSubType = _getSpaceSubTypeFromAction(action);
    if (curSpace) {
      // If we are clicking a space, the only "add" action could be to toggle subtype.
      if (spaceSubType !== undefined && !moved) {
        if (curSpace.subtype === spaceSubType)
          delete curSpace.subtype;
        else
          curSpace.subtype = spaceSubType;
      }
      PP64.app.changeCurrentSpace(curSpace);
    }
    else {
      let newSpaceIdx = PP64.boards.addSpace(x, y, spaceType, spaceSubType);
      let curBoard = PP64.boards.getCurrentBoard();
      PP64.app.changeCurrentSpace(curBoard.spaces[newSpaceIdx]);
    }

    PP64.renderer.renderSpaces();
  }

  function _toggleHostsStar(curSpace) {
    if (!curSpace)
      return;

    curSpace.star = !curSpace.star;
    PP64.renderer.renderSpaces();
    PP64.app.changeCurrentSpace(curSpace); // Refresh because .star changed
  }

  function _toggleGate(curSpace) {
    if (!curSpace)
      return;
    if (curSpace.type !== $spaceType.OTHER)
      return;

    curSpace.gate = !curSpace.gate;
    PP64.renderer.renderSpaces();
    PP64.app.changeCurrentSpace(curSpace); // Refresh because .gate changed
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
    return spaceSubType;
  }

  function onEditorMouseDown(event) {
    let canvas = event.currentTarget;
    _onEditorDown(canvas, event.clientX, event.clientY)
  }

  function onEditorTouchStart(event) {
    let canvas = event.currentTarget;

    if (event.touches.length !== 1)
      return;

    let touch = event.touches[0];

    _onEditorDown(canvas, touch.clientX, touch.clientY)
  }

  function _onEditorDown(canvas, clientX, clientY) {
    canvasRect = canvas.getBoundingClientRect();

    startX = lastX = clientX - canvasRect.left;
    startY = lastY = clientY - canvasRect.top;

    currentSpaceIdx = getClickedSpace(lastX, lastY);

    // ROM boards cannot be edited, so create a copy right now and switch to it.
    if (PP64.boards.currentBoardIsROM() && currentSpaceIdx !== -1) {
      PP64.app.changeCurrentAction($actType.MOVE); // Avoid destructive actions like delete.
      PP64.boards.copyCurrentBoard();
      PP64.boards.setCurrentBoard(PP64.boards.getCurrentBoardIndex() + 1);
    }

    $$log(`Clicked space: ${$$hex(currentSpaceIdx)} (${currentSpaceIdx})`, PP64.boards.getCurrentBoard().spaces[currentSpaceIdx]);
  }

  let _renderConnectionsTimer;
  function renderConnectionsOnTimeout() {
    if (!_renderConnectionsTimer) {
      _renderConnectionsTimer = setTimeout(renderConnectionsTimeoutFn, 10);
    }
  }
  function renderConnectionsTimeoutFn() {
    PP64.renderer.renderConnections();
    _renderConnectionsTimer = null;
  }

  let _renderSpacesTimer;
  function renderSpacesOnTimeout() {
    if (!_renderSpacesTimer) {
      _renderSpacesTimer = setTimeout(renderSpacesTimeoutFn, 10);
    }
  }
  function renderSpacesTimeoutFn() {
    PP64.renderer.renderSpaces();
    PP64.renderer.renderCurrentSpace();
    _renderSpacesTimer = null;
  }

  function onEditorTouchMove(event) {
    let clickX, clickY;

    if (event.touches.length !== 1)
      return;

    if (currentSpaceIdx === -1)
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

    let curAction = PP64.app.getCurrentAction();
    if (currentSpaceIdx === -1 && curAction !== $actType.ERASE) {
      lastX = clickX;
      lastY = clickY;
      return;
    }

    let cur_board = PP64.boards.getCurrentBoard();
    let space = cur_board.spaces[currentSpaceIdx];
    if (curAction === $actType.LINE) {
      // Draw a line from the start space to the current location.
      PP64.renderer.renderConnections();
      PP64.renderer.drawConnection(space.x, space.y, clickX, clickY);

      if (PP64.renderer.rightClickOpen()) {
        PP64.renderer.updateRightClickMenu(null);
      }
    }
    else if (curAction === $actType.LINE_STICKY) {
      // Make a connection if we are in sticky mode and have reached a new space.
      let endSpaceIdx = getClickedSpace(clickX, clickY);
      if (endSpaceIdx !== -1 && endSpaceIdx !== currentSpaceIdx) {
        let endSpace = cur_board.spaces[endSpaceIdx];
        PP64.boards.addConnection(currentSpaceIdx, endSpaceIdx);
        currentSpaceIdx = endSpaceIdx;
        PP64.renderer.renderConnections();
      }
      else {
        // Draw a line from the start space to the current location.
        PP64.renderer.renderConnections();
        PP64.renderer.drawConnection(space.x, space.y, clickX, clickY);
      }
    }
    else if (curAction === $actType.ASSOCIATE) {
      // Association line from the start space to the current location.
      PP64.renderer.renderConnections();
      PP64.renderer.drawAssociation(space.x, space.y, clickX, clickY);
    }
    else if (curAction === $actType.ERASE) {
      let curSpaceIdx = getClickedSpace(clickX, clickY);
      if (curSpaceIdx !== -1 && cur_board.spaces[curSpaceIdx].type !== $spaceType.START) {
        PP64.boards.removeSpace(curSpaceIdx);
        PP64.app.changeCurrentSpace(null);
        PP64.renderer.render();
      }
      else {
        _eraseLines(clickX, clickY); // Try to slice some lines!
      }
    }
    else if (curAction !== $actType.DELETE) {
      // Move the space.
      let deltaX = clickX - lastX;
      let deltaY = clickY - lastY;

      space.x += deltaX;
      space.y += deltaY;

      renderConnectionsOnTimeout();
      renderSpacesOnTimeout();

      if (PP64.renderer.rightClickOpen()) {
        PP64.renderer.updateRightClickMenu(space);
      }
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

    if (currentSpaceIdx === -1)
      return;

    let curAction = PP64.app.getCurrentAction();
    let endSpaceIdx, endSpace;
    if (curAction === $actType.LINE) {
      endSpaceIdx = getClickedSpace(lastX, lastY);
      if (endSpaceIdx !== -1 && endSpaceIdx !== currentSpaceIdx) {
        endSpace = PP64.boards.getCurrentBoard().spaces[endSpaceIdx];
        PP64.boards.addConnection(currentSpaceIdx, endSpaceIdx);
      }

      PP64.renderer.renderConnections();
    }
    else if (curAction === $actType.ASSOCIATE) {
      endSpaceIdx = getClickedSpace(lastX, lastY);
      if (endSpaceIdx !== -1) {
        endSpace = PP64.boards.getCurrentBoard().spaces[endSpaceIdx];
        if (endSpace.subtype === undefined) {
          // PP64.boards.addConnection(currentSpaceIdx, endSpaceIdx);
        }
      }

      PP64.renderer.renderConnections();
    }
  }

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

    if (typeof data === "object" && data.action) {
      let canvas = event.currentTarget;
      canvasRect = canvas.getBoundingClientRect();
      let clickX = event.clientX - canvasRect.left;
      let clickY = event.clientY - canvasRect.top;
      let currentSpaceIdx = getClickedSpace(clickX, clickY);
      let curBoard = PP64.boards.getCurrentBoard();
      let curSpace = currentSpaceIdx === -1 ? null : curBoard.spaces[currentSpaceIdx];
      _addSpace(data.action.type, clickX, clickY, curSpace, false);
    }
  }
  function preventDefault(event) { event.preventDefault(); }

  function onEditorKeyDown(event) {
    let currentSpace = PP64.app.getCurrentSpace();
    if (!currentSpace)
      return;

    let board = PP64.boards.getCurrentBoard();

    if (event.keyCode == "38") { // up arrow
      currentSpace.y = Math.max(currentSpace.y - 1, 0);
      PP64.app.changeCurrentSpace(currentSpace);
    }
    else if (event.keyCode == "40") { // down arrow
      currentSpace.y = Math.min(currentSpace.y + 1, board.bg.height);
      PP64.app.changeCurrentSpace(currentSpace);
    }
    else if (event.keyCode == "37") { // left arrow
      currentSpace.x = Math.max(currentSpace.x - 1, 0);
      PP64.app.changeCurrentSpace(currentSpace);
    }
    else if (event.keyCode == "39") { // right arrow
      currentSpace.x = Math.min(currentSpace.x + 1, board.bg.width);
      PP64.app.changeCurrentSpace(currentSpace);
    }
    else if (event.keyCode == "46") { // delete
      if (currentSpace.subtype !== undefined) { // Delete the character off first.
        delete currentSpace.subtype;
        PP64.app.changeCurrentSpace(currentSpace);
      }
      else { // Otherwise remove the space.
        let index = PP64.boards.getSpaceIndex(currentSpace, board);
        PP64.boards.removeSpace(index, board);
        PP64.app.changeCurrentSpace(null);
      }
    }
    else {
      return;
    }

    //PP64.renderer.renderSpaces();
    //PP64.renderer.renderCurrentSpace();
  }

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
