PP64.renderer = (function() {
  const _isKnownSpaceType = PP64.types.isKnownSpaceType;

  function getEditorContentTransform(board, editor) {
    let board_offset_x = Math.floor((editor.offsetWidth - board.bg.width) / 2);
    board_offset_x = Math.max(0, board_offset_x);
    let board_offset_y = Math.floor((editor.offsetHeight - board.bg.height) / 2);
    board_offset_y = Math.max(0, board_offset_y);

    return "translateX(" + board_offset_x + "px) translateY(" + board_offset_y + "px)";
  }

  function renderConnections(lineCanvas, lineCtx, board, clear = true) {
    if (clear)
      lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

    // Draw connecting lines.
    board.links = board.links || {};
    for (let startSpace in board.links) {
      let x1 = board.spaces[startSpace].x;
      let y1 = board.spaces[startSpace].y;

      let endLinks = board.links[startSpace];
      let x2, y2;
      let bidirectional = false;
      if (Array.isArray(endLinks)) {
        for (let i = 0; i < endLinks.length; i++) {
          x2 = board.spaces[endLinks[i]].x;
          y2 = board.spaces[endLinks[i]].y;
          bidirectional = _isConnectedTo(board.links, endLinks[i], startSpace);
          if (bidirectional && startSpace > endLinks[i])
            continue;
          drawConnection(lineCtx, x1, y1, x2, y2, bidirectional);
        }
      } else {
        x2 = board.spaces[endLinks].x;
        y2 = board.spaces[endLinks].y;
        bidirectional = _isConnectedTo(board.links, endLinks, startSpace);
        if (bidirectional && startSpace > endLinks)
          continue;
        drawConnection(lineCtx, x1, y1, x2, y2, bidirectional);
      }
    }
  }

  function _isConnectedTo(links, start, end) {
    let startLinks = links[start];
    if (Array.isArray(startLinks))
      return startLinks.indexOf(parseInt(end)) >= 0;
    else
      return startLinks == end; // Can be string vs int
  }

  // opts:
  //   skipHiddenSpaces: true to not render start, invisible spaces
  //   skipBadges: false to skip event and star badges
  function renderSpaces(spaceCanvas, spaceCtx, board, clear = true, opts = {}) {
    if (clear)
      spaceCtx.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);

    let game = board.game || 1;

    // Draw spaces
    for (let index = 0; index < board.spaces.length; index++) {
      let space = board.spaces[index];
      if (space === null)
        continue;
      space.z = space.z || 0;

      drawSpace(spaceCtx, space, game, opts);
    }
  }

  function drawSpace(spaceCtx, space, game, opts = {}) {
    let x = space.x;
    let y = space.y;
    let type = space.type;
    let subtype = space.subtype;

    switch (type) {
      case $spaceType.OTHER:
        if (opts.skipHiddenSpaces)
          break;
        if (game === 3)
          PP64.spaces.drawOther3(spaceCtx, x, y);
        else
          PP64.spaces.drawOther(spaceCtx, x, y);
        break;
      case $spaceType.BLUE:
        if (game === 3)
          PP64.spaces.drawBlue3(spaceCtx, x, y);
        else
          PP64.spaces.drawBlue(spaceCtx, x, y);
        break;
      case $spaceType.RED:
        if (game === 3)
          PP64.spaces.drawRed3(spaceCtx, x, y);
        else
          PP64.spaces.drawRed(spaceCtx, x, y);
        break;
      case $spaceType.MINIGAME:
        PP64.spaces.drawMiniGame(spaceCtx, x, y);
        break;
      case $spaceType.HAPPENING:
        if (game === 3)
          PP64.spaces.drawHappening3(spaceCtx, x, y);
        else
          PP64.spaces.drawHappening(spaceCtx, x, y);
        break;
      case $spaceType.STAR:
        if (game === 3)
          PP64.spaces.drawStar3(spaceCtx, x, y);
        else
          PP64.spaces.drawStar(spaceCtx, x, y);
        break;
      case $spaceType.CHANCE:
        if (game === 3)
          PP64.spaces.drawChance3(spaceCtx, x, y);
        else if (game === 2)
          PP64.spaces.drawChance2(spaceCtx, x, y);
        else
          PP64.spaces.drawChance(spaceCtx, x, y);
        break;
      case $spaceType.START:
        if (opts.skipHiddenSpaces)
          break;
        if (game === 3)
          PP64.spaces.drawStart3(spaceCtx, x, y);
        else
          PP64.spaces.drawStart(spaceCtx, x, y);
        break;
      case $spaceType.SHROOM:
        PP64.spaces.drawShroom(spaceCtx, x, y);
        break;
      case $spaceType.BOWSER:
        if (game === 3)
          PP64.spaces.drawBowser3(spaceCtx, x, y);
        else
          PP64.spaces.drawBowser(spaceCtx, x, y);
        break;
      case $spaceType.ITEM:
        if (game === 3)
          PP64.spaces.drawItem3(spaceCtx, x, y);
        else
          PP64.spaces.drawItem2(spaceCtx, x, y);
        break;
      case $spaceType.BATTLE:
        if (game === 3)
          PP64.spaces.drawBattle3(spaceCtx, x, y);
        else
          PP64.spaces.drawBattle2(spaceCtx, x, y);
        break;
      case $spaceType.BANK:
        if (game === 3)
          PP64.spaces.drawBank3(spaceCtx, x, y);
        else
          PP64.spaces.drawBank2(spaceCtx, x, y);
        break;
      case $spaceType.ARROW:
        PP64.spaces.drawArrow(spaceCtx, x, y, game);
        break;
      case $spaceType.BLACKSTAR:
        PP64.spaces.drawBlackStar2(spaceCtx, x, y);
        break;
      case $spaceType.GAMEGUY:
        PP64.spaces.drawGameGuy3(spaceCtx, x, y);
        break;
      default:
        PP64.spaces.drawUnknown(spaceCtx, x, y);
        break;
    }

    if (!opts.skipCharacters) {
      drawCharacters(spaceCtx, x, y, subtype, game);
    }

    if (!opts.skipBadges) {
      let offset = game === 3 ? 5 : 2;
      let startOffset = game === 3 ? 16 : 12
      if (space.events && space.events.length) {
        let iconY = y + offset;
        if (type === $spaceType.START)
          iconY -= startOffset;
        spaceCtx.drawImage(PP64.images.get("eventImg"), x + offset, iconY);
      }

      if (space.star) {
        let iconY = y + offset;
        if (type === $spaceType.START)
          iconY -= startOffset;
        spaceCtx.drawImage(PP64.images.get("starImg"), x - offset - 9, iconY);
      }

      if (space.subtype === $spaceSubType.GATE) {
        let iconX = x - offset - 9;
        let iconY = y + offset - 5;
        spaceCtx.drawImage(PP64.images.get("gateImg"), iconX, iconY);
      }
    }

    if ($$debug) {
      // Draw the space's index.
      spaceCtx.save();
      let index = PP64.boards.getSpaceIndex(space);
      spaceCtx.fillStyle = "white";
      spaceCtx.strokeStyle = "black";
      spaceCtx.lineWidth = 2;
      spaceCtx.font = "bold 6pt Courier New";
      spaceCtx.textAlign = "center";
      let text = index.toString();
      spaceCtx.strokeText(text, x, y - 2);
      spaceCtx.fillText(text, x, y - 2);
      text = $$hex(index);
      spaceCtx.strokeText(text, x, y + 8);
      spaceCtx.fillText(text, x, y + 8);
      spaceCtx.restore();
    }
  }

  function drawCharacters(spaceCtx, x, y, subtype, game) {
    // Draw the standing Toad.
    if (subtype === $spaceSubType.TOAD) {
      if (game === 3)
        spaceCtx.drawImage(PP64.images.get("mstarImg"), x - 15, y - 22);
      else
        spaceCtx.drawImage(PP64.images.get("toadImg"), x - 9, y - 22);
    }

    // Draw the standing Bowser.
    if (subtype === $spaceSubType.BOWSER) {
      spaceCtx.drawImage(PP64.images.get("bowserImg"), x - 27, y - 45);
    }

    // Draw the standing Koopa Troopa.
    if (subtype === $spaceSubType.KOOPA) {
      spaceCtx.drawImage(PP64.images.get("koopaImg"), x - 12, y - 22);
    }

    // Draw the standing Boo.
    if (subtype === $spaceSubType.BOO) {
      spaceCtx.drawImage(PP64.images.get("booImg"), x - 13, y - 17);
    }

    // Draw the standing Goomba.
    if (subtype === $spaceSubType.GOOMBA) {
      spaceCtx.drawImage(PP64.images.get("goombaImg"), x - 8, y - 12);
    }

    // Draw the bank.
    if (subtype === $spaceSubType.BANK) {
      if (game === 2)
        spaceCtx.drawImage(PP64.images.get("bank2Img"), x - 9, y - 10);
      else
        spaceCtx.drawImage(PP64.images.get("bank3Img"), x - 17, y - 20);
    }

    // Draw the bank coin.
    if (subtype === $spaceSubType.BANKCOIN) {
      spaceCtx.drawImage(PP64.images.get("bankcoinImg"), x - 10, y - 9);
    }

    // Draw the item shop.
    if (subtype === $spaceSubType.ITEMSHOP) {
      if (game === 2)
        spaceCtx.drawImage(PP64.images.get("itemShop2Img"), x - 9, y - 10);
      else
        spaceCtx.drawImage(PP64.images.get("itemShop3Img"), x - 16, y - 20);
    }
  }

  const _PIOver1 = (Math.PI / 1);
  function drawConnection(lineCtx, x1, y1, x2, y2, bidirectional) {
    lineCtx.save();
    lineCtx.beginPath();
    lineCtx.strokeStyle = "rgba(255, 185, 105, 0.75)";
    lineCtx.lineCap = "round";
    lineCtx.lineWidth = 8;
    lineCtx.moveTo(x1, y1);
    lineCtx.lineTo(x2, y2);
    lineCtx.stroke();

    // Draw the little triangle arrow on top at halfway.
    let midX = (x1 + x2) / 2;
    let midY = (y1 + y2) / 2;
    lineCtx.translate(midX, midY);
    lineCtx.rotate(-Math.atan2(x1 - midX, y1 - midY) + _PIOver1);
    lineCtx.fillStyle = "#A15000";
    let adjust = bidirectional ? 3 : 0;
    lineCtx.moveTo(-4, -2 + adjust);
    lineCtx.lineTo(0, 2 + adjust);
    lineCtx.lineTo(4, -2 + adjust);
    lineCtx.fill();

    if (bidirectional) {
      lineCtx.moveTo(-4, 2 - adjust);
      lineCtx.lineTo(0, -2 - adjust);
      lineCtx.lineTo(4, 2 - adjust);
      lineCtx.fill();
    }

    lineCtx.restore();
  }

  function drawAssociation(lineCtx, x1, y1, x2, y2) {
    lineCtx.save();
    lineCtx.beginPath();
    lineCtx.strokeStyle = "rgba(211, 211, 211, 0.75)";
    lineCtx.setLineDash([1, 6]);
    lineCtx.lineCap = "round";
    lineCtx.lineWidth = 4;
    lineCtx.moveTo(x1, y1);
    lineCtx.lineTo(x2, y2);
    lineCtx.stroke();
    lineCtx.restore();
  }

  function renderCurrentSpace(canvas, context, space) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (space) {
      context.save();
      context.beginPath();
      let radius = PP64.boards.getCurrentBoard().game === 3 ? 16 : 10;
      context.arc(space.x, space.y, radius, 0, 2 * Math.PI);
      context.shadowColor = "rgba(225, 225, 225, 1)";
      context.shadowBlur = 2;
      context.fillStyle = "rgba(225, 225, 225, 0.5)";
      context.fill();
      context.restore();
    }
  }

  let _boardBG;
  const BoardBG = class BoardBG extends React.Component {
    state = {}

    componentDidMount() {
      this.renderContent();
      _boardBG = this;
    }

    componentWillUnmount() {
      _boardBG = null;
    }

    componentDidUpdate() {
      this.renderContent();
    }

    renderContent() {
      let board = this.props.board;
      let bgImg = this.getImage();
      let editor = bgImg.parentElement;
      let transformStyle = getEditorContentTransform(board, editor);
      bgImg.style.transform = transformStyle;

      // Update the background image.
      if (bgImg._src !== board.bg.src || bgImg.width !== board.bg.width || bgImg.height !== board.bg.height) {
        bgImg.width = board.bg.width;
        bgImg.height = board.bg.height;
        this.setSource(board.bg.src, bgImg);
      }
    }

    getImage() {
      return ReactDOM.findDOMNode(this);
    }

    setSource(src, bgImg = this.getImage()) {
      bgImg.src = src;
      bgImg._src = src; // src can change after setting, and trick the renderContent check.
    }

    render() {
      return (
        <img className="editor_bg" />
      );
    }
  };

  let _boardLines;
  let BoardLines = class BoardLines extends React.Component {
    state = {}

    componentDidMount() {
      this.renderContent();
      _boardLines = this;
    }

    componentWillUnmount() {
      _boardLines = null;
    }

    componentDidUpdate() {
      this.renderContent();
    }

    renderContent() {
      // Update lines connecting spaces
      let lineCanvas = ReactDOM.findDOMNode(this);
      let editor = lineCanvas.parentElement;
      let board = this.props.board;
      let transformStyle = getEditorContentTransform(board, editor);
      lineCanvas.style.transform = transformStyle;
      if (lineCanvas.width !== board.bg.width || lineCanvas.height !== board.bg.height) {
        lineCanvas.width = board.bg.width;
        lineCanvas.height = board.bg.height;
      }
      renderConnections(lineCanvas, lineCanvas.getContext("2d"), board);
    }

    render() {
      return (
        <canvas className="editor_line_canvas"></canvas>
      );
    }
  };

  let _boardCurrentSpace;
  const BoardCurrentSpace = class BoardCurrentSpace extends React.Component {
    state = {}

    componentDidMount() {
      this.renderContent();
      _boardCurrentSpace = this;
    }

    componentWillUnmount() {
      _boardCurrentSpace = null;
    }

    componentDidUpdate() {
      this.renderContent();
    }

    renderContent() {
      // Update the current space indication
      let currentSpaceCanvas = ReactDOM.findDOMNode(this);
      let editor = currentSpaceCanvas.parentElement;
      let board = this.props.board;
      let transformStyle = getEditorContentTransform(board, editor);
      currentSpaceCanvas.style.transform = transformStyle;
      if (currentSpaceCanvas.width !== board.bg.width || currentSpaceCanvas.height !== board.bg.height) {
        currentSpaceCanvas.width = board.bg.width;
        currentSpaceCanvas.height = board.bg.height;
      }
      renderCurrentSpace(currentSpaceCanvas, currentSpaceCanvas.getContext("2d"), this.props.currentSpace);
    }

    render() {
      return (
        <canvas className="editor_current_space_canvas"></canvas>
      );
    }
  };

  let _boardSpaces;
  const BoardSpaces = class BoardSpaces extends React.Component {
    state = {}

    componentDidMount() {
      let canvas = ReactDOM.findDOMNode(this);
      PP64.interaction.attachToCanvas(canvas);

      this.renderContent();
      _boardSpaces = this;
    }

    componentWillUnmount() {
      let canvas = ReactDOM.findDOMNode(this);
      PP64.interaction.detachFromCanvas(canvas);
      _boardSpaces = null;
    }

    componentDidUpdate() {
      this.renderContent();
    }

    renderContent() {
      // Update spaces
      let spaceCanvas = ReactDOM.findDOMNode(this);
      let editor = spaceCanvas.parentElement;
      let board = this.props.board;
      let transformStyle = getEditorContentTransform(board, editor);
      spaceCanvas.style.transform = transformStyle;
      if (spaceCanvas.width !== board.bg.width || spaceCanvas.height !== board.bg.height) {
        spaceCanvas.width = board.bg.width;
        spaceCanvas.height = board.bg.height;
      }
      renderSpaces(spaceCanvas, spaceCanvas.getContext("2d"), board);
    }

    render() {
      return (
        <canvas className="editor_space_canvas" tabIndex="-1"
          onDragOver={this.preventDefault} onDrop={this.onDrop}></canvas>
      );
    }
  };

  // Right-click menu overlay
  let _boardOverlay;
  const BoardOverlay = class BoardOverlay extends React.Component {
    state = {
      rightClickSpace: null
    }

    componentDidMount() {
      this.renderContent();
      _boardOverlay = this;
    }

    componentWillUnmount() {
      _boardOverlay = null;
    }

    componentDidUpdate() {
      this.renderContent();
    }

    renderContent() {
      let overlay = ReactDOM.findDOMNode(this);
      let editor = overlay.parentElement;
      let transformStyle = getEditorContentTransform(this.props.board, editor);
      overlay.style.transform = transformStyle;
    }

    setRightClickMenu(space) {
      this.setState({rightClickSpace: space});
    }

    rightClickOpen() {
      return !!this.state.rightClickSpace;
    }

    render() {
      let menu;
      if (this.rightClickOpen())
        menu = <PP64.rightclick.RightClickMenu space={this.state.rightClickSpace} />;
      return (
        <div className="editor_menu_overlay">
          {menu}
        </div>
      );
    }
  };

  const Editor = class Editor extends React.Component {
    state = {}

    componentDidMount() {
      window.addEventListener("resize", PP64.renderer.render, false);
    }

    componentWillUnmount() {
      window.removeEventListener("resize", PP64.renderer.render);
    }

    componentDidUpdate() {}

    render() {
      return (
        <div className="editor">
          <BoardBG board={this.props.board} />
          <BoardLines board={this.props.board} />
          <BoardCurrentSpace board={this.props.board} currentSpace={this.props.currentSpace} />
          <BoardSpaces board={this.props.board} />
          <BoardOverlay board={this.props.board} />
        </div>
      );
    }
  };

  return {
    render: function() {
      if (_boardBG)
        _boardBG.renderContent();
      if (_boardLines)
        _boardLines.renderContent();
      if (_boardCurrentSpace)
        _boardCurrentSpace.renderContent();
      if (_boardSpaces)
        _boardSpaces.renderContent();
    },
    renderBG: function() {
      if (_boardBG)
        _boardBG.renderContent();
    },
    renderConnections: function() {
      if (_boardLines)
        _boardLines.renderContent();
    },
    renderCurrentSpace: function() {
      if (_boardCurrentSpace)
        _boardCurrentSpace.renderContent();
    },
    renderSpaces: function() {
      if (_boardSpaces)
        _boardSpaces.renderContent();
    },
    updateRightClickMenu: function(space) {
      if (_boardOverlay)
        _boardOverlay.setRightClickMenu(space);
    },
    rightClickOpen: function() {
      if (_boardOverlay)
        return _boardOverlay.rightClickOpen();
      return false;
    },
    drawConnection: function(x1, y1, x2, y2) {
      if (!_boardLines)
        return;
      let lineCtx = ReactDOM.findDOMNode(_boardLines).getContext("2d");
      drawConnection(lineCtx, x1, y1, x2, y2);
    },
    drawAssociation,
    external: {
      getBGImage: function() {
        return _boardBG.getImage();
      },
      setBGImage: function(src) {
        _boardBG.setSource(src);
      },
      renderConnections: renderConnections,
      renderSpaces: renderSpaces
    },
    Editor,
  };
})();
