import { Action, BoardType, View } from "./types";
import * as React from "react";
import { Screenshot } from "./screenshot";
import { NewBoard } from "./newboard";
import { setCurrentBoard, addBoard, clearBoardsFromROM, getCurrentBoard, loadBoardsFromROM, indexOfBoard, IBoard, boardIsROM, setBG, copyCurrentBoard, getBoards } from "./boards";
import { recordEvent } from "./utils/analytics";
import { $$log } from "./utils/debug";
import { getROMAdapter } from "./adapter/adapters";
import { validateCurrentBoardForOverwrite } from "./validation/validation";
import { makeKeyClick } from "./utils/react";
import * as ReactDOM from "react-dom";
import { equal } from "./utils/arrays";
import { get, $setting } from "./views/settings";
import { romhandler } from "./romhandler";
import { createCustomEvent } from "./events/customevents";
import { render } from "./renderer";
import { openFile } from "./utils/input";
import { refreshEventsView } from "./views/eventsview";
import { saveEvent, createEventPromptExit } from "./views/createevent";
import { changeView, blockUI, boardsChanged, romLoadedChanged, changeCurrentEvent, showMessage, addNotification, removeNotification } from "./appControl";
import { Notification, NotificationColor, NotificationButton } from "./components/notifications";
import { addEventToLibrary } from "./events/EventLibrary";
import { saveAdditionalBgCode, additionalBgViewPromptExit } from "./views/additionalbgview";

interface IHeaderActionItem {
  name: string;
  icon: string;
  type: Action;
  details: string;
  dropdownFn?: Function;
  advanced?: boolean;
  show?: () => boolean;
}

const actions_norom: IHeaderActionItem[] = [
  { "name": "Load ROM", "icon": "img/header/romcart.png", "type": Action.ROM_LOAD, "details": "Load a ROM image and read its boards" },
  { "name": "New board", "icon": "img/header/newboard.png",
    "type": Action.BOARD_NEW, "details": "Create a new board",
    "dropdownFn": newboardDropdown
  },
  { "name": "Import board", "icon": "img/header/loadboard.png", "type": Action.BOARD_LOAD, "details": "Import a board file into the editor" },
  { "name": "Export board", "icon": "img/header/saveboard.png", "type": Action.BOARD_SAVE, "details": "Export a board file for distribution" },
  { "name": "Debug", "icon": "img/header/debug.png", "type": Action.DEBUG, "details": "Debug functionality", "advanced": true },
  { "name": "Screenshot", "icon": "img/header/screenshot.png",
    "type": Action.SCREENSHOT, "details": "Take a screenshot of the current board",
    "dropdownFn": screenshotDropdown
  },
  { "name": "Events", "icon": "img/header/events.png", "type": Action.EVENTS, "details": "View and manage events", "advanced": true },
  { "name": "Settings", "icon": "img/header/settings.png", "type": Action.SETTINGS, "details": "Editor settings" },
  { "name": "About", "icon": "img/header/about.png", "type": Action.ABOUT, "details": "About PartyPlanner64" },
];

const actions_rom_romboard: IHeaderActionItem[] = [
  { "name": "Close ROM", "icon": "img/header/romclose.png", "type": Action.ROM_UNLOAD, "details": "Close the ROM file and remove its boards" },
  { "name": "Save ROM", "icon": "img/header/romsave.png", "type": Action.ROM_SAVE, "details": "Save changes out to a ROM file" },
  { "name": "New board", "icon": "img/header/newboard.png",
    "type": Action.BOARD_NEW, "details": "Create a new board",
    "dropdownFn": newboardDropdown
  },
  { "name": "Import board", "icon": "img/header/loadboard.png", "type": Action.BOARD_LOAD, "details": "Import a board file into the editor" },
  { "name": "Export board", "icon": "img/header/saveboard.png", "type": Action.BOARD_SAVE, "details": "Export a board file for distribution" },
  { "name": "Debug", "icon": "img/header/debug.png", "type": Action.DEBUG, "details": "Debug functionality", "advanced": true },
  { "name": "Screenshot", "icon": "img/header/screenshot.png",
    "type": Action.SCREENSHOT, "details": "Take a screenshot of the current board",
    "dropdownFn": screenshotDropdown
  },
  { "name": "Events", "icon": "img/header/events.png", "type": Action.EVENTS, "details": "View and manage events", "advanced": true },
  { "name": "Patches", "icon": "img/header/rompatch.png", "type": Action.PATCHES, "details": "Apply patches to the ROM", "advanced": true },
  { "name": "Model Viewer", "icon": "img/header/modelviewer.png", "type": Action.MODEL_VIEWER, "details": "View 3D model data in the ROM" },
  //{ "name": "Strings", "icon": "img/header/stringseditor.png", "type": Action.STRINGS_EDITOR, "details": "View and edit strings in the ROM" },
  { "name": "Audio", "icon": "img/header/audio.png", "type": Action.AUDIO, "details": "Game audio options", advanced: true },
  { "name": "Settings", "icon": "img/header/settings.png", "type": Action.SETTINGS, "details": "Editor settings" },
  { "name": "About", "icon": "img/header/about.png", "type": Action.ABOUT, "details": "About PartyPlanner64" },
];

const actions_rom_normalboard: IHeaderActionItem[] = [
  { "name": "Close ROM", "icon": "img/header/romclose.png", "type": Action.ROM_UNLOAD, "details": "Close the ROM file and remove its boards" },
  { "name": "Save ROM", "icon": "img/header/romsave.png", "type": Action.ROM_SAVE, "details": "Save changes out to a ROM file" },
  {
    "name": "Overwrite", "icon": "img/header/romoverwrite.png",
    "type": Action.BOARD_WRITE, "details": "Overwrite a ROM board with the current board",
    "dropdownFn": overwriteDropdown
  },
  { "name": "New board", "icon": "img/header/newboard.png",
    "type": Action.BOARD_NEW, "details": "Create a new board",
    "dropdownFn": newboardDropdown
  },
  { "name": "Import board", "icon": "img/header/loadboard.png", "type": Action.BOARD_LOAD, "details": "Import a board file into the editor" },
  { "name": "Export board", "icon": "img/header/saveboard.png", "type": Action.BOARD_SAVE, "details": "Export a board file for distribution" },
  { "name": "Debug", "icon": "img/header/debug.png", "type": Action.DEBUG, "details": "Debug functionality", "advanced": true },
  { "name": "Screenshot", "icon": "img/header/screenshot.png",
    "type": Action.SCREENSHOT, "details": "Take a screenshot of the current board",
    "dropdownFn": screenshotDropdown
  },
  { "name": "Events", "icon": "img/header/events.png", "type": Action.EVENTS, "details": "View and manage events", "advanced": true },
  { "name": "Patches", "icon": "img/header/rompatch.png", "type": Action.PATCHES, "details": "Apply patches to the ROM", "advanced": true },
  { "name": "Model Viewer", "icon": "img/header/modelviewer.png", "type": Action.MODEL_VIEWER, "details": "View 3D model data in the ROM" },
  //{ "name": "Strings", "icon": "img/header/stringseditor.png", "type": Action.STRINGS_EDITOR, "details": "View and edit strings in the ROM" },
  { "name": "Audio", "icon": "img/header/audio.png", "type": Action.AUDIO, "details": "Game audio options", advanced: true },
  { "name": "Settings", "icon": "img/header/settings.png", "type": Action.SETTINGS, "details": "Editor settings" },
  { "name": "About", "icon": "img/header/about.png", "type": Action.ABOUT, "details": "About PartyPlanner64" },
];

const actions_back: IHeaderActionItem[] = [
  { "name": "Back to editor", "icon": "img/header/back.png", "type": Action.BOARD_EDITOR, "details": "Return to the board editor" },
];

const actions_events: IHeaderActionItem[] = actions_back.concat([
  { "name": "Create Event", "icon": "img/header/add.png", "type": Action.CREATEEVENT, "details": "Create your own event code" },
  { "name": "Import Event", "icon": "img/header/eventload.png", "type": Action.EVENT_LOAD, "details": "Load event code from a file" },
]);

const actions_createevent: IHeaderActionItem[] = [
  { "name": "Back to event list", "icon": "img/header/back.png", "type": Action.BACK_TO_EVENTS, "details": "Return to the event list" },
  { "name": "Save", "icon": "img/header/save.png", "type": Action.SAVE_EVENT, "details": "Save the event" },
];

const actions_additionalbg: IHeaderActionItem[] = [
  { "name": "Back to editor", "icon": "img/header/back.png", "type": Action.ADDITIONALBG_BACK, "details": "Return to the board editor" },
  { "name": "Save", "icon": "img/header/save.png", "type": Action.SAVE_ADDITIONALBG, "details": "Save the code" },
];

//const action_overflow = { "name": "", "icon": "img/header/more.png", "type": "MORE", "details": "More options" };
const action_overflow: IHeaderActionItem = { "name": "", "icon": "", "type": "MORE" as any, "details": "More options" };

let _emulatorNotice: React.ReactElement<Notification> | null = null;

function _handleAction(action: Action) {
  switch(action) {
    case Action.ROM_LOAD:
      openFile(".z64,.v64,.rom,.n64", romSelected);
      break;
    case Action.ROM_UNLOAD:
      romhandler.clear();
      clearBoardsFromROM();
      boardsChanged(getBoards());
      setCurrentBoard(0);
      romLoadedChanged();
      break;
    case Action.ROM_SAVE:
      blockUI(true);
      setTimeout(() => {
        romhandler.saveROM();
        blockUI(false);
        _showEmulatorInstructionsNotification();
      }, 0);
      break;
    case Action.BOARD_LOAD:
      openFile(".json", boardSelected);
      break;
    case Action.BOARD_SAVE:
      let curBoard = getCurrentBoard(true);
      let boardBlob = new Blob([JSON.stringify(curBoard)]);
      saveAs(boardBlob, curBoard.name + ".json");
      break;
    case Action.BOARD_COPY:
      copyCurrentBoard();
      break;
    case Action.BOARD_DETAILS:
      changeView(View.DETAILS);
      break;
    case Action.BOARD_EDITOR:
      changeView(View.EDITOR);
      break;
    case Action.SETTINGS:
      changeView(View.SETTINGS);
      break;
    case Action.ABOUT:
      changeView(View.ABOUT);
      break;
    case Action.MODEL_VIEWER:
      changeView(View.MODELS);
      break;
    case Action.EVENTS:
      changeView(View.EVENTS);
      break;
    case Action.BACK_TO_EVENTS:
      if (createEventPromptExit()) {
        changeCurrentEvent(null);
        changeView(View.EVENTS);
      }
      break;
    case Action.EVENT_LOAD:
      openFile(".s", eventFileSelected);
      break;
    case Action.SAVE_EVENT:
      saveEvent();
      break;
    case Action.CREATEEVENT:
      changeView(View.CREATEEVENT);
      break;
    case Action.STRINGS_EDITOR:
      changeView(View.STRINGS);
      break;
    case Action.PATCHES:
      changeView(View.PATCHES);
      break;
    case Action.DEBUG:
      changeView(View.DEBUG);
      break;
    case Action.AUDIO:
      changeView(View.AUDIO);
      break;
    case Action.SET_BG:
      openFile("image/*", bgSelected);
      break;
    case Action.SAVE_ADDITIONALBG:
      saveAdditionalBgCode();
      break;
    case Action.ADDITIONALBG_BACK:
      if (additionalBgViewPromptExit()) {
        changeView(View.EDITOR);
      }
      break;
    default:
      break;
  }
}

function romSelected(event: any) {
  let file = event.target.files[0];
  if (!file)
    return;

  blockUI(true);
  let reader = new FileReader();
  reader.onload = (e: any) => {
    if (!e.target.result) {
      blockUI(false);
      return;
    }

    let promise = romhandler.setROMBuffer(e.target.result);
    if (!promise)
      return; // The ROM handler showed a message, so we don't need to unblock UI

    promise.then(value => {
      romLoadedChanged();
      loadBoardsFromROM();
      blockUI(false);
      $$log("ROM loaded");
    }, reason => {
      $$log(`Error loading ROM: ${reason}`);
      showMessage("Error loading the ROM file.");
    });
  };
  reader.readAsArrayBuffer(file);
}

function boardSelected(event: any) {
  let file = event.target.files[0];
  if (!file)
    return;

  const reader = new FileReader();
  reader.onload = () => {
    let board;
    try {
      board = JSON.parse(reader.result as string);
    } catch (e) {
      alert("Board could not be parsed.");
      return;
    }
    let boardIndex = addBoard(board);
    setCurrentBoard(boardIndex);
  };
  reader.readAsText(file);
}

function bgSelected(event: any) {
  let file = event.target.files[0];
  if (!file)
    return;

  let reader = new FileReader();
  reader.onload = () => {
    setBG(reader.result);
    render();
  };
  reader.readAsDataURL(file);
}

function eventFileSelected(event: any) {
  const files = event.target && event.target.files;
  if (!(files && files[0]))
    return;

  for (let i = 0; i < files.length; i++) {
    let reader = new FileReader();
    reader.onload = () => {
      try {
        const asm = reader.result as string;
        const customEvent = createCustomEvent(asm, true);
        addEventToLibrary(customEvent);
        refreshEventsView();
      } catch (e) {
        showMessage("Event file load failed. " + e.toString());
        return;
      }
    };
    reader.readAsText(files[i]);
  }
}

function getActions(view: View, board: IBoard, romLoaded: boolean) {
  // Pick the set of actions based on the state.
  let actions;
  if (view !== View.EDITOR) {
    if (view === View.EVENTS)
      actions = actions_events;
    else if (view === View.CREATEEVENT)
      actions = actions_createevent;
    else if (view === View.ADDITIONAL_BGS)
      actions = actions_additionalbg;
    else
      actions = actions_back;
  }
  else if (!romLoaded)
    actions = actions_norom;
  else if (boardIsROM(board))
    actions = actions_rom_romboard;
  else
    actions = actions_rom_normalboard;

  if (!get($setting.uiAdvanced)) {
    actions = actions.filter(a => !a.advanced);
  }

  actions = actions.filter(a => {
    return !a.show || a.show();
  });

  return actions;
}

function _showEmulatorInstructionsNotification() {
  if (!_emulatorNotice) {
    const removeNotificationHandler = () => {
      if (_emulatorNotice) {
        removeNotification(_emulatorNotice);
        _emulatorNotice = null;
      }
    }
    _emulatorNotice = (
      <Notification key="romSaveNotice"
        color={NotificationColor.Green}
        onClose={removeNotificationHandler}>
        Before trying the game, review{" "}
        <a href="https://github.com/PartyPlanner64/PartyPlanner64/wiki/Emulator-Setup" target="_blank">emulator setup instructions</a>.
        <NotificationButton onClick={removeNotificationHandler}>
          Got it
        </NotificationButton>
      </Notification>
    );
    addNotification(_emulatorNotice);
  }
}

interface IHeaderProps {
  view: View;
  board: IBoard;
  romLoaded: boolean;
}

interface IHeaderState {
  actions: IHeaderActionItem[];
  totalActions: IHeaderActionItem[];
  overflow: any[];
}

let _headerMounted: boolean = false;

export const Header = class Header extends React.Component<IHeaderProps, IHeaderState> {
  private actionsEl: HTMLElement | null = null;

  constructor(props: IHeaderProps) {
    super(props);

    const actions = getActions(props.view, props.board, props.romLoaded);
    this.state = {
      actions: actions,
      totalActions: actions, // Array of actions that never changes despite overflow
      overflow: []
    };
  }

  componentWillReceiveProps = (nextProps: IHeaderProps) => {
    const newActions = getActions(nextProps.view, nextProps.board, nextProps.romLoaded);

    if (!equal(this.state.totalActions, newActions)) {
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
          <HeaderDropdown key={item.type} action={item} fn={item.dropdownFn} />
        );
      }
      return (
        <HeaderButton key={item.type} action={item} />
      );
    });
    let overflowAction;
    if (this.state.overflow.length) {
      overflowAction = <HeaderDropdown key={action_overflow.type}
        action={action_overflow} overflow={this.state.overflow} fn={moreDropdown} />;
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
    _headerMounted = true;
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
    _headerMounted = false;
    $$log("Why did Header unmount?");
  }

  handleOverflow() {
    if (!_headerMounted)
      return;

    let actions = this.state.actions.slice();
    let hasOverflow = this.state.overflow.length;
    let overflow = this.state.overflow.slice();
    let el = ReactDOM.findDOMNode(this) as HTMLElement;
    let actionsEl = this.actionsEl!;
    while (actionsEl.offsetWidth > (el.offsetWidth - 215 - (hasOverflow ? 0 : 80))) { // Cut out logo and more if existing
      let lastAction = actionsEl.children[actions.length - (hasOverflow ? 2 : 1)] as HTMLElement; // Skip more
      if (!lastAction)
        break;
      lastAction.style.display = "none";
      overflow.unshift(actions.pop());
    }
    for (let i = 0; i < actionsEl.children.length - (hasOverflow ? 2 : 1); i++) {
      let actionEl = actionsEl.children[i] as HTMLElement;
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
      <img className="headerLogo" src="img/header/logo.png" alt="PartyPlanner64 Logo" />
    );
  }
};

interface IHeaderButtonProps {
  action: IHeaderActionItem;
}

const HeaderButton = class HeaderButton extends React.Component<IHeaderButtonProps> {
  handleClick = () => {
    _handleAction(this.props.action.type);
  }

  render() {
    let iconImg;
    if (this.props.action.icon) {
      iconImg = <img className="headerButtonIcon" src={this.props.action.icon}></img>;
    }
    return (
      <div className="headerButton" title={this.props.action.details}
        role="button" tabIndex={0}
        onClick={this.handleClick}
        onKeyDown={makeKeyClick(this.handleClick, this)}>
        {iconImg}
        <span className="headerButtonText">{this.props.action.name}</span>
      </div>
    );
  }
};

interface IHeaderDropdownProps {
  action: IHeaderActionItem;
  fn: Function;
  overflow?: any;
}

const HeaderDropdown = class HeaderDropdown extends React.Component<IHeaderDropdownProps> {
  private dropdown: HTMLElement | null = null;

  state = { opened: false }

  globalClickHandler = (event: any) => {
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

  elementIsWithin(el: HTMLElement) {
    if (!this.dropdown)
      return true;
    return this.dropdown.contains(el);
  }

  componentDidMount() {
    this.addGlobalHandler();
    window.addEventListener("resize", this.close, false);
  }

  componentWillUnmount() {
    this.removeGlobalHandler();
    window.removeEventListener("resize", this.close);
  }

  onButtonClick = (event: any) => {
    if (this.state.opened) {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }
    this.setState({ opened: !this.state.opened });
  }

  onDropdownClick = (event: any) => {
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
      <div className={btnClass} tabIndex={0} role="button" aria-haspopup="true"
        title={this.props.action.details}
        ref={(el) => this.dropdown = el}
        onClick={this.onButtonClick}>
        {iconImg}
        <span className="headerButtonText">{this.props.action.name}</span>
        <div className="headerDropdownArrow">▾</div>
        {dropdownContent}
      </div>
    );
  }
};

function overwriteDropdown(closeFn: any) {
  let validationResults = validateCurrentBoardForOverwrite();
  if (!validationResults)
    return null;

  return validationResults.map(function(result: any, index: number) {
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

interface IHeaderOverwriteBoardDropdownEntryProps {
  unavailable: boolean;
  boardIndex: number;
  closeCallback: Function;
  name: string;
  errors: string[];
  warnings: string[];
}

const HeaderOverwriteBoardDropdownEntry = class HeaderOverwriteBoardDropdownEntry extends React.Component<IHeaderOverwriteBoardDropdownEntryProps> {
  boardClicked = (event: any) => {
    // Links inside the errors messages should not cause overwrites from warnings.
    if (event.target && event.target.tagName.toUpperCase() === "A") {
      event.stopPropagation();
      return;
    }

    if (!this.hasErrors() && !this.props.unavailable) {
      this.props.closeCallback();

      let adapter = getROMAdapter();
      if (!adapter)
        return;
      blockUI(true);
      let currentBoard = getCurrentBoard();
      let promise = adapter.overwriteBoard(this.props.boardIndex, currentBoard);
      promise.then(() => {
        $$log("Board overwritten");
        clearBoardsFromROM();
        loadBoardsFromROM();

        let newBoardIndex = indexOfBoard(currentBoard);
        if (newBoardIndex < 0)
          newBoardIndex = 0;

        setCurrentBoard(newBoardIndex);

        recordEvent("board_write", {
          "event_category": "action",
          "event_label": currentBoard.name,
        });

        blockUI(false);
      }, (reason: any) => {
        $$log(`Error overriding board: ${reason}`);
        showMessage("Error overwriting the board.");
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

    let failNodes: any = [];
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

function moreDropdown(closeFn: Function, props: any) {
  let overflowItems = props.overflow;
  if (!overflowItems.length)
    return null;

  return overflowItems.map((item: IHeaderActionItem) => {
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

function newboardDropdown(closeFn: Function) {
  function onAccept(gameVersion: 1 | 2 | 3, type: BoardType, theme: any) {
    closeFn();
    const newBoardIdx = addBoard(null, {
      game: gameVersion,
      type: type,
    });
    setCurrentBoard(newBoardIdx);
  }
  return (
    <NewBoard onAccept={onAccept} />
  );
}

function screenshotDropdown(closeFn: Function) {
  function onAccept(dataUri: string, blobPromise: Promise<Blob>) {
    if (isElectron) {
      // Opening the window is sketchy in electron, just use saveAs instead.
      blobPromise.then((blob: Blob) => {
        saveAs(blob, "BoardScreenshot.png");
      });
    }
    else {
      let win = window.open();
      if (win) {
        let doc = win.document;

        // Normally we can get a document.
        if (doc) {
          doc.write('');
          doc.close();
          doc.body.appendChild(doc.createElement('img')).src = dataUri;
        }
      }
    }

    closeFn();
  }
  return (
    <Screenshot onAccept={onAccept} />
  );
}
