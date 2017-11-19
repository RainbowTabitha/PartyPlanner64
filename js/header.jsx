PP64.header = (function() {
  const actions_norom = [
    { "name": "Load ROM", "icon": "img/header/romcart.png", "type": $actType.ROM_LOAD, "details": "Load a ROM image and read its boards" },
    { "name": "New board", "icon": "img/header/newboard.png",
      "type": $actType.BOARD_NEW, "details": "Create a new board",
      "dropdownFn": newboardDropdown
    },
    { "name": "Import board", "icon": "img/header/loadboard.png", "type": $actType.BOARD_LOAD, "details": "Import a board file into the editor" },
    { "name": "Export board", "icon": "img/header/saveboard.png", "type": $actType.BOARD_SAVE, "details": "Export a board file for distribution" },
    //{ "name": "Copy", "icon": "img/header/copyboard.png", "type": $actType.BOARD_COPY, "details": "Create a copy of this board" },
    // { "name": "Edit Details", "icon": "img/header/editdetails.png", "type": $actType.BOARD_DETAILS, "details": "View and edit various board details" },
    // { "name": "Set BG", "icon": "img/header/setbg.png", "type": $actType.SET_BG, "details": "Change the board background image" },
    { "name": "Screenshot", "icon": "img/header/screenshot.png",
      "type": $actType.SCREENSHOT, "details": "Take a screenshot of the current board",
      "dropdownFn": screenshotDropdown
    },
    { "name": "Settings", "icon": "img/header/settings.png", "type": $actType.SETTINGS, "details": "Editor settings" },
    { "name": "About", "icon": "img/header/about.png", "type": $actType.ABOUT, "details": "About PartyPlanner64" },
  ];

  const actions_rom_romboard = [
    { "name": "Close ROM", "icon": "img/header/romclose.png", "type": $actType.ROM_UNLOAD, "details": "Close the ROM file and remove its boards" },
    { "name": "Save ROM", "icon": "img/header/romsave.png", "type": $actType.ROM_SAVE, "details": "Save changes out to a ROM file" },
    { "name": "New board", "icon": "img/header/newboard.png",
      "type": $actType.BOARD_NEW, "details": "Create a new board",
      "dropdownFn": newboardDropdown
    },
    { "name": "Import board", "icon": "img/header/loadboard.png", "type": $actType.BOARD_LOAD, "details": "Import a board file into the editor" },
    { "name": "Export board", "icon": "img/header/saveboard.png", "type": $actType.BOARD_SAVE, "details": "Export a board file for distribution" },
    { "name": "Import file dump", "icon": "img/header/dump.png", "type": $actType.DUMP_LOAD, "details": "Import and overwrite with a dump of ROM data", "advanced": true },
    { "name": "Export file dump", "icon": "img/header/dump.png", "type": $actType.DUMP_SAVE, "details": "Export a zip of all the ROM file data", "advanced": true },
    //{ "name": "Copy", "icon": "img/header/copyboard.png", "type": $actType.BOARD_COPY, "details": "Create a copy of this board" },
    // { "name": "View Details", "icon": "img/header/editdetails.png", "type": $actType.BOARD_DETAILS, "details": "View various board details" },
    { "name": "Screenshot", "icon": "img/header/screenshot.png",
      "type": $actType.SCREENSHOT, "details": "Take a screenshot of the current board",
      "dropdownFn": screenshotDropdown
    },
    { "name": "Patches", "icon": "img/header/rompatch.png", "type": $actType.PATCHES, "details": "Apply patches to the ROM", "advanced": true },
    { "name": "Settings", "icon": "img/header/settings.png", "type": $actType.SETTINGS, "details": "Editor settings" },
    { "name": "About", "icon": "img/header/about.png", "type": $actType.ABOUT, "details": "About PartyPlanner64" },
  ];

  const actions_rom_normalboard = [
    { "name": "Close ROM", "icon": "img/header/romclose.png", "type": $actType.ROM_UNLOAD, "details": "Close the ROM file and remove its boards" },
    { "name": "Save ROM", "icon": "img/header/romsave.png", "type": $actType.ROM_SAVE, "details": "Save changes out to a ROM file" },
    {
      "name": "Overwrite", "icon": "img/header/romoverwrite.png",
      "type": $actType.BOARD_WRITE, "details": "Overwrite a ROM board with the current board",
      "dropdownFn": overwriteDropdown
    },
    { "name": "New board", "icon": "img/header/newboard.png",
      "type": $actType.BOARD_NEW, "details": "Create a new board",
      "dropdownFn": newboardDropdown
    },
    { "name": "Import board", "icon": "img/header/loadboard.png", "type": $actType.BOARD_LOAD, "details": "Import a board file into the editor" },
    { "name": "Export board", "icon": "img/header/saveboard.png", "type": $actType.BOARD_SAVE, "details": "Export a board file for distribution" },
    { "name": "Import file dump", "icon": "img/header/dump.png", "type": $actType.DUMP_LOAD, "details": "Import and overwrite with a dump of ROM data", "advanced": true },
    { "name": "Export file dump", "icon": "img/header/dump.png", "type": $actType.DUMP_SAVE, "details": "Export a zip of all the ROM file data", "advanced": true },
    { "name": "Model Viewer", "icon": "img/header/modelviewer.png", "type": $actType.MODEL_VIEWER, "details": "View 3D model data in the ROM", "advanced": true },
    //{ "name": "Copy", "icon": "img/header/copyboard.png", "type": $actType.BOARD_COPY, "details": "Create a copy of this board" },
    // { "name": "Edit Details", "icon": "img/header/editdetails.png", "type": $actType.BOARD_DETAILS, "details": "View and edit various board details" },
    // { "name": "Set BG", "icon": "img/header/setbg.png", "type": $actType.SET_BG, "details": "Change the board background image" },
    { "name": "Screenshot", "icon": "img/header/screenshot.png",
      "type": $actType.SCREENSHOT, "details": "Take a screenshot of the current board",
      "dropdownFn": screenshotDropdown
    },
    { "name": "Patches", "icon": "img/header/rompatch.png", "type": $actType.PATCHES, "details": "Apply patches to the ROM", "advanced": true },
    { "name": "Settings", "icon": "img/header/settings.png", "type": $actType.SETTINGS, "details": "Editor settings" },
    { "name": "About", "icon": "img/header/about.png", "type": $actType.ABOUT, "details": "About PartyPlanner64" },
  ];

  const actions_back = [
    { "name": "Back to editor", "icon": "img/header/board.png", "type": $actType.BOARD_EDITOR, "details": "Return to the board editor" },
  ];

  //const action_overflow = { "name": "", "icon": "img/header/more.png", "type": "MORE", "details": "More options" };
  const action_overflow = { "name": "", "type": "MORE", "details": "More options" };

  function _handleAction(action) {
    switch(action) {
      case $actType.ROM_LOAD:
        PP64.utils.input.openFile(".z64,.v64,.rom,.n64", romSelected);
        break;
      case $actType.ROM_UNLOAD:
        PP64.romhandler.clear();
        PP64.boards.clearBoardsFromROM();
        PP64.app.boardsChanged();
        PP64.boards.setCurrentBoard(0);
        PP64.app.romLoadedChanged();
        break;
      case $actType.ROM_SAVE:
        PP64.app.blockUI(true);
        setTimeout(() => {
          PP64.romhandler.saveROM();
          PP64.app.blockUI(false);

          setTimeout(() => {
            PP64.app.showMessageHTML(`Before trying the game, review
              <a href="https://github.com/PartyPlanner64/PartyPlanner64/wiki/Emulator-Setup" target="_blank">emulator setup instructions</a>.`);
          }, 0);
        }, 0);
        break;
      case $actType.BOARD_LOAD:
        PP64.utils.input.openFile(".json", boardSelected);
        break;
      case $actType.BOARD_SAVE:
        let curBoard = PP64.boards.getCurrentBoard(true);
        let boardBlob = new Blob([JSON.stringify(curBoard)]);
        saveAs(boardBlob, curBoard.name + ".json");
        break;
      case $actType.BOARD_COPY:
        PP64.boards.copyCurrentBoard();
        break;
      case $actType.BOARD_DETAILS:
        PP64.app.changeView($viewType.DETAILS);
        break;
      case $actType.BOARD_EDITOR:
        PP64.app.changeView($viewType.EDITOR);
        break;
      case $actType.SETTINGS:
        PP64.app.changeView($viewType.SETTINGS);
        break;
      case $actType.ABOUT:
        PP64.app.changeView($viewType.ABOUT);
        break;
      case $actType.MODEL_VIEWER:
        PP64.app.changeView($viewType.MODELS);
        break;
      case $actType.PATCHES:
        PP64.app.changeView($viewType.PATCHES);
        break;
      case $actType.SET_BG:
        PP64.utils.input.openFile("image/*", bgSelected);
        break;
      case $actType.DUMP_LOAD:
        PP64.utils.input.openFile(".zip", dumpSelected);
        break;
      case $actType.DUMP_SAVE:
        PP64.app.blockUI(true);
        PP64.utils.dump.create(dumpCreated);
        break;
      default:
        break;
    }
  }

  function romSelected(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    PP64.app.blockUI(true);
    let reader = new FileReader();
    reader.onload = e => {
      if (!e.target.result) {
        PP64.app.blockUI(false);
        return;
      }

      let promise = PP64.romhandler.setROMBuffer(e.target.result);
      if (!promise)
        return; // The ROM handler showed a message, so we don't need to unblock UI

      promise.then(value => {
        PP64.app.romLoadedChanged();
        PP64.boards.loadBoardsFromROM();
        PP64.app.blockUI(false);
        $$log("ROM loaded");
      }, reason => {
        $$log(`Error loading ROM: ${reason}`);
        PP64.app.showMessage("Error loading the ROM file.");
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function boardSelected(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    let reader = new FileReader();
    reader.onload = e => {
      let board;
      try {
        board = JSON.parse(e.target.result);
      } catch (e) {
        alert("Board could not be parsed.");
        return;
      }
      let boardIndex = PP64.boards.addBoard(board);
      PP64.boards.setCurrentBoard(boardIndex);
    };
    reader.readAsText(file);
  }

  function bgSelected(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    let reader = new FileReader();
    reader.onload = error => {
      PP64.boards.setBG(reader.result);
      PP64.renderer.render();
    };
    reader.readAsDataURL(file);
  }

  function dumpSelected(event) {
    let file = event.target.files[0];
    if (!file)
      return;

    let reader = new FileReader();
    reader.onload = error => {
      // Extract the dump and replace ROM files.
      PP64.utils.dump.load(reader.result);
    };
    reader.readAsArrayBuffer(file);
  }

  function dumpCreated(blob) {
    saveAs(blob, `mp${PP64.romhandler.getGameVersion()}-files.zip`);
    PP64.app.blockUI(false);
  }

  function getActions(view, board, romLoaded) {
    // Pick the set of actions based on the state.
    let actions;
    if (view !== $viewType.EDITOR)
      actions = actions_back;
    else if (!romLoaded)
      actions = actions_norom;
    else if (PP64.boards.boardIsROM(board))
      actions = actions_rom_romboard;
    else
      actions = actions_rom_normalboard;

    if (!PP64.settings.get($setting.uiAdvanced)) {
      actions = actions.filter(a => !a.advanced);
    }

    return actions;
  }

  const Header = class Header extends React.Component {
    constructor(props) {
      super(props);

      const actions = getActions(props.view, props.board, props.romLoaded);
      this.state = {
        actions: actions,
        totalActions: actions, // Array of actions that never changes despite overflow
        overflow: []
      };
    }

    componentWillReceiveProps = (nextProps) => {
      const newActions = getActions(nextProps.view, nextProps.board, nextProps.romLoaded);

      if (!PP64.utils.arrays.equal(this.state.totalActions, newActions)) {
        this.setState({
          actions: newActions,
          totalActions: newActions,
          overflow: []
        });
      }
    }

    refresh() {
      const actions = getActions(this.props.view, this.props.board, this.props.romLoaded);
      this.setState({
        actions: actions,
        totalActions: actions,
        overflow: []
      });
    }

    render() {
      let actionsList = this.state.actions;
      let i = 0;
      let actions = actionsList.map(item => {
        if (item.dropdownFn) {
          return (
            <HeaderDropdown key={item.type} action={item} fn={item.dropdownFn} index={i++} />
          );
        }
        return (
          <HeaderButton key={item.type} action={item} index={i++} />
        );
      });
      let overflowAction;
      if (this.state.overflow.length) {
        overflowAction = <HeaderDropdown key={action_overflow.type} action={action_overflow} overflow={this.state.overflow} fn={moreDropdown} index={i++} />;
      }
      return (
        <div className="header" role="toolbar">
          <HeaderLogo />
          <div className="headerActions" ref={(actionsEl => { this.actionsEl = actionsEl; })}>
            {actions}
            {overflowAction}
          </div>
        </div>
      );
    }

    componentDidMount() {
      window.addEventListener("resize", this.refresh.bind(this), false);
      setTimeout(() => {
        window.requestAnimationFrame(this.handleOverflow.bind(this));
      }, 0);
    }

    componentDidUpdate() {
      setTimeout(() => {
        window.requestAnimationFrame(this.handleOverflow.bind(this));
      }, 0);
    }

    componentWillUnmount() {
      $$log("Why did Header unmount?");
    }

    handleOverflow() {
      let actions = this.state.actions.slice();
      let hasOverflow = this.state.overflow.length;
      let overflow = this.state.overflow.slice();
      let el = ReactDOM.findDOMNode(this);
      let actionsEl = this.actionsEl;
      while (actionsEl.offsetWidth > (el.offsetWidth - 215 - (hasOverflow ? 0 : 80))) { // Cut out logo and more if existing
        let lastAction = actionsEl.children[actions.length - (hasOverflow ? 2 : 1)]; // Skip more
        if (!lastAction)
          break;
        lastAction.style.display = "none";
        overflow.unshift(actions.pop());
      }
      for (let i = 0; i < actionsEl.children.length - (hasOverflow ? 2 : 1); i++) {
        let actionEl = actionsEl.children[i];
        actionEl.style.display = "";
      }
      if (actions.length === this.state.actions.length && overflow.length === this.state.overflow.length)
        return;
      // $$log("Header.handleOverflow -> setState" + actions.length + ", " + overflow.length);
      this.setState({ actions, overflow });
    }
  };

  const HeaderLogo = class HeaderLogo extends React.Component {
    render() {
      return (
        <a href=".">
          <img className="headerLogo" src="img/header/logo.png" alt="PartyPlanner64 Logo" />
        </a>
      );
    }
  };

  const HeaderButton = class HeaderButton extends React.Component {
    handleClick = () => {
      _handleAction(this.props.action.type);
    }

    render() {
      let iconImg;
      if (this.props.action.icon) {
        iconImg = <img className="headerButtonIcon" src={this.props.action.icon}></img>;
      }
      return (
        <div className="headerButton" onClick={this.handleClick} title={this.props.action.details}
          role="button" tabIndex="0">
          {iconImg}
          <span className="headerButtonText">{this.props.action.name}</span>
        </div>
      );
    }
  };

  const HeaderDropdown = class HeaderDropdown extends React.Component {
    state = { opened: false }

    globalClickHandler = event => {
      if (this.elementIsWithin(event.target))
        return;
      this.close();
    }

    addGlobalHandler() {
      document.addEventListener("click", this.globalClickHandler);
    }

    removeGlobalHandler() {
      document.removeEventListener("click", this.globalClickHandler);
    }

    elementIsWithin(el) {
      if (!this.refs || !this.refs.dropdown)
        return true;
      return this.refs.dropdown.contains(el);
    }

    componentDidMount() {
      this.addGlobalHandler();
      window.addEventListener("resize", this.close, false);
    }

    componentWillUnmount() {
      this.removeGlobalHandler();
      window.removeEventListener("resize", this.close);
    }

    onButtonClick = (event) => {
      if (this.state.opened) {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
      }
      this.setState({ opened: !this.state.opened });
    }

    onDropdownClick = (event) => {
      event.stopPropagation(); // So that clicking inside the dropdown doesn't call onButtonClick.
    }

    close = () => {
      if (this.state.opened)
        this.setState({ opened: false });
    }

    render() {
      let btnClass = "headerButton";
      let dropdownContent = null;
      if (this.state.opened) {
        btnClass += " headerButtonExpanded";
        let contents = this.props.fn(this.close, this.props);
        dropdownContent = (
          <div className="headerDropdown" onClick={this.onDropdownClick}>
            {contents}
          </div>
        );
      }
      let iconImg;
      if (this.props.action.icon) {
        iconImg = <img className="headerButtonIcon" src={this.props.action.icon}></img>;
      }
      return (
        <div className={btnClass} title={this.props.action.details} ref="dropdown"
          onClick={this.onButtonClick} tabIndex="0" role="button" aria-haspopup="true">
          {iconImg}
          <span className="headerButtonText">{this.props.action.name}</span>
          <div className="headerDropdownArrow">▾</div>
          {dropdownContent}
        </div>
      );
    }
  };

  function overwriteDropdown(closeFn, props) {
    let validationResults = PP64.validation.validateCurrentBoardForOverwrite();
    if (!validationResults)
      return null;

    return validationResults.map(function(result, index) {
      return (
        <HeaderOverwriteBoardDropdownEntry
          name={result.name}
          errors={result.errors}
          warnings={result.warnings}
          unavailable={result.unavailable}
          closeCallback={closeFn}
          key={index}
          boardIndex={index} />
      );
    });
  }

  const HeaderOverwriteBoardDropdownEntry = class HeaderOverwriteBoardDropdownEntry extends React.Component {
    boardClicked = event => {
      // Links inside the errors messages should not cause overwrites from warnings.
      if (event.target && event.target.tagName.toUpperCase() === "A") {
        event.stopPropagation();
        return;
      }

      if (!this.hasErrors() && !this.props.unavailable) {
        this.props.closeCallback();

        let adapter = PP64.adapters.getROMAdapter();
        if (!adapter)
          return;
        PP64.app.blockUI(true);
        let currentBoard = PP64.boards.getCurrentBoard();
        let promise = adapter.overwriteBoard(this.props.boardIndex, currentBoard);
        promise.then(value => {
          $$log("Board overwritten");
          PP64.boards.clearBoardsFromROM();
          PP64.boards.loadBoardsFromROM();

          let newBoardIndex = PP64.boards.indexOf(currentBoard);
          if (newBoardIndex < 0)
            newBoardIndex = 0;

          PP64.boards.setCurrentBoard(newBoardIndex);

          PP64.app.blockUI(false);
        }, reason => {
          $$log(`Error overriding board: ${reason}`);
          PP64.app.showMessage("Error overwriting the board.");
        });
      }
    }

    hasErrors() {
      return !!this.props.errors.length;
    }

    hasWarnings() {
      return !!this.props.warnings.length;
    }

    render() {
      let ddClass = "overwriteBoardEntry";
      let tooltip = `Overwrite ${this.props.name} with the current board.`;

      let failNodes = [];
      if (this.props.unavailable) {
        ddClass += " unavailable";
        failNodes.push(
          <div className="overwriteBoardMessage" key="unavailable">Board cannot be overwritten currently.</div>
        );
      }
      else {
        if (this.hasErrors()) {
          ddClass += " failed";
          failNodes = failNodes.concat(this.props.errors.map((fail, idx) => {
            return (
              <div className="overwriteBoardMessage" key={idx + "e"}>
                <img src="img/header/boarderror.png" alt="" className="overwriteBoardIssueIcon" />
                <span dangerouslySetInnerHTML={{__html: fail}}></span>
              </div>
            );
          }));
        }
        if (this.hasWarnings()) {
          failNodes = failNodes.concat(this.props.warnings.map((fail, idx) => {
            return (
              <div className="overwriteBoardMessage" key={idx + "w"}>
                <img src="img/header/boardwarning.png" alt="" className="overwriteBoardIssueIcon" />
                <span dangerouslySetInnerHTML={{__html: fail}}></span>
              </div>
            );
          }));
        }
      }

      if (failNodes.length) {
        tooltip = "Issues with the current board.";
        return (
          <div className={ddClass} onClick={this.boardClicked} title={tooltip}>
            <span className="overwriteBoardName">{this.props.name}</span>
            <br />
            {failNodes}
          </div>
        );
      }

      return (
        <div className={ddClass} onClick={this.boardClicked} title={tooltip}>
          <span className="overwriteBoardName">{this.props.name}</span>
        </div>
      );
    }
  };

  function moreDropdown(closeFn, props) {
    let overflowItems = props.overflow;
    if (!overflowItems.length)
      return null;

    return overflowItems.map(item => {
      if (item.dropdownFn) {
        return (
          <HeaderDropdown key={item.type} action={item} fn={item.dropdownFn} />
        );
      }
      return (
        <HeaderButton key={item.type} action={item} />
      );
    });
  }

  function newboardDropdown(closeFn, props) {
    function onAccept(gameVersion, theme) {
      closeFn();
      let newBoardIdx = PP64.boards.addBoard(null, { game: gameVersion });
      PP64.boards.setCurrentBoard(newBoardIdx);
    }
    return (
      <PP64.newboard.NewBoard onAccept={onAccept} />
    );
  }

  function screenshotDropdown(closeFn, props) {
    function onAccept(dataUri) {
      let win = window.open();
      if (win) {
        let doc = win.document;

        // Normally we can get a document.
        if (doc) {
          doc.write('');
          doc.close();
          doc.body.appendChild(doc.createElement('img')).src = dataUri;
        }
        else if (win.eval) { // But in Electron, we have some stupid proxy object instead.
          win.eval("document.write(''); document.close(); document.body.appendChild(document.createElement('img')).src = \"" + dataUri + "\";");
        }
      }

      closeFn();
    }
    return (
      <PP64.screenshot.Screenshot onAccept={onAccept} />
    );
  }

  return {
    Header: Header
  };
})();
