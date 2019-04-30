// This is the top level of the application, and includes the root React view.

import { View, Action } from "./types";
import { IBoard, ISpace, getBoards, getCurrentBoard } from "./boards";
import * as React from "react";
import { IEvent } from "./events/events";
import { updateWindowTitle } from "./utils/browser";
import { Editor } from "./renderer";
import { Details } from "./details";
import { Settings } from "./settings";
import { About } from "./about";
import { ModelViewer } from "./models";
import { EventsView } from "./eventsview";
import { CreateEventView } from "./createevent";
import { StringsViewer } from "./strings";
import { GamesharkView } from "./gameshark";
import { BoardMenu } from "./boardmenu";
import { Notification, NotificationBar, NotificationButton, NotificationColor } from "./components/notifications";
import { Header } from "./header";
import { ToolWindow } from "./toolwindow";
import { Toolbar } from "./toolbar";
import { SpaceProperties } from "./spaceproperties";
import { BoardProperties } from "./boardproperties";
import * as ReactDOM from "react-dom";
import "./utils/onbeforeunload";
import "./events/builtin/events.common";
import "./events/builtin/MP1/events.MP1";
import "./events/builtin/MP2/events.MP2";
import "./events/builtin/MP3/events.MP3";
import { showMessage } from "./appControl";
import "file-saver";
import { DebugView } from "./debug";
import { AudioViewer } from "./audio";

interface IPP64AppState {
  currentView: View,
  boards: IBoard[],
  currentBoard: IBoard,
  currentEvent: IEvent | null,
  currentEventIsBoardEvent: boolean,
  romLoaded: boolean,
  currentAction: Action,
  selectedSpaces: ISpace[] | null,
  blocked: boolean,
  message: string,
  messageHTML: string,
  updateExists: boolean,
  updateHideNotification: boolean,
  notifications: React.ReactElement<Notification>[],
  error: Error | null,
  errorInfo: React.ErrorInfo | null,
}

export class PP64App extends React.Component<{}, IPP64AppState> {
  state: IPP64AppState = {
    currentView: View.EDITOR,
    boards: getBoards(),
    currentBoard: getCurrentBoard(),
    currentEvent: null,
    currentEventIsBoardEvent: false,
    romLoaded: false,
    currentAction: Action.MOVE,
    selectedSpaces: null,
    blocked: false,
    message: "",
    messageHTML: "",
    updateExists: false,
    updateHideNotification: false,
    notifications: [],
    error: null,
    errorInfo: null,
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorDisplay error={this.state.error} errorInfo={this.state.errorInfo}
          onClearError={() => {
            this.setState({ error: null, errorInfo: null });
          }}/>
      );
    }

    updateWindowTitle(this.state.currentBoard.name);
    let mainView;
    switch (this.state.currentView) {
      case View.EDITOR:
        mainView = <Editor board={this.state.currentBoard} selectedSpaces={this.state.selectedSpaces} />;
        break;
      case View.DETAILS:
        mainView = <Details board={this.state.currentBoard} />;
        break;
      case View.SETTINGS:
        mainView = <Settings />;
        break;
      case View.ABOUT:
        mainView = <About />;
        break;
      case View.MODELS:
        mainView = <ModelViewer />;
        break;
      case View.EVENTS:
        mainView = <EventsView board={this.state.currentBoard} />;
        break;
      case View.CREATEEVENT:
        mainView = <CreateEventView />;
        break;
      case View.STRINGS:
        mainView = <StringsViewer />;
        break;
      case View.PATCHES:
        mainView = <GamesharkView />;
        break;
      case View.DEBUG:
        mainView = <DebugView />;
        break;
      case View.AUDIO:
        mainView = <AudioViewer />;
        break;
    }

    let sidebar;
    switch (this.state.currentView) {
      case View.EDITOR:
      case View.DETAILS:
      case View.EVENTS:
        sidebar = (
          <div className="sidebar">
            <BoardMenu
              boards={this.state.boards} />
          </div>
        );
        break;
    }

    let blocked;
    if (this.state.blocked) {
      let content;
      if (this.state.message || this.state.messageHTML) {
        let messageSpan;
        if (this.state.message) {
          messageSpan = <span className="loadingMsgTxt selectable">{this.state.message}</span>
        }
        else { // messageHTML
          messageSpan = <span className="loadingMsgTxt selectable" dangerouslySetInnerHTML={{ __html: this.state.messageHTML }}></span>
        }

        content = (
          <div className="loadingMsg">
            {messageSpan}
            <br /><br />
            <button onClick={() => { showMessage(); }}>OK</button>
          </div>
        );
      }
      else {
        content = (
          <img className="loadingGif swing" src="img/pencil.png" alt="Loading" />
        );
      }
      blocked = (
        <div className="loading">
          <img className="loadingLogo" src="img/logoloading.png" alt="Loading" />
          <br />
          {content}
        </div>
      );
    }

    let bodyClass = "body";
    if (this.state.currentAction === Action.ERASE)
      bodyClass += " eraser";

    return (
      <div className={bodyClass}>
        <NotificationBar>
          {this.getNotifications()}
        </NotificationBar>
        <Header view={this.state.currentView} romLoaded={this.state.romLoaded} board={this.state.currentBoard} />
        <div className="content">
          {sidebar}
          <div className="main">
            {mainView}
            <div className="mainOverlay">
              <ToolWindow name="Toolbox" position="TopRight"
                visible={this.state.currentView === View.EDITOR}>
                <Toolbar currentAction={this.state.currentAction}
                  gameVersion={this.state.currentBoard.game}
                  boardType={this.state.currentBoard.type} />
              </ToolWindow>
              <ToolWindow name="Space Properties" position="BottomRight"
                visible={this.state.currentView === View.EDITOR}>
                <SpaceProperties selectedSpaces={this.state.selectedSpaces}
                  gameVersion={this.state.currentBoard.game}
                  boardType={this.state.currentBoard.type} />
              </ToolWindow>
              <ToolWindow name="Board Properties" position="BottomLeft"
                visible={this.state.currentView === View.EDITOR}>
                <BoardProperties currentBoard={this.state.currentBoard} />
              </ToolWindow>
            </div>
            <div id="dragZone"></div>
          </div>
        </div>
        {blocked}
      </div>
    );
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    _onError(this, error, errorInfo);
  }

  componentDidMount() {
    if (isElectron) {
      const ipcRenderer = (window as any).require("electron").ipcRenderer;
      ipcRenderer.on("update-check-hasupdate", this._onUpdateCheckHasUpdate);
      ipcRenderer.send("update-check-start");
    }
  }

  componentWillUnmount() {
    if (isElectron) {
      const ipcRenderer = (window as any).require("electron").ipcRenderer;
      ipcRenderer.removeListener("update-check-hasupdate", this._onUpdateCheckHasUpdate);
    }
  }

  _onUpdateCheckHasUpdate = () => {
    this.setState({ updateExists: true });
  }

  getNotifications(): React.ReactElement<Notification>[] {
    const notifications = this.state.notifications.slice();

    if (this.state.updateExists && !this.state.updateHideNotification) {
      notifications.push(
        <Notification key="update"
          color={NotificationColor.Blue}
          onClose={this._onUpdateNotificationClosed}>
          An update is available.
          <NotificationButton onClick={this._onUpdateNotificationInstallClicked}>
            Install
          </NotificationButton>
        </Notification>
      );
    }

    return notifications;
  }

  _onUpdateNotificationClosed = () => {
    this.setState({ updateHideNotification: true });
  }

  _onUpdateNotificationInstallClicked = () => {
    this.setState({
      updateHideNotification: true,
      blocked: true,
    });

    if (isElectron) {
      const ipcRenderer = (window as any).require("electron").ipcRenderer;
      ipcRenderer.send("update-check-doupdate");
    }
  }
};

const body = document.getElementById("body");
(window as any)._PP64instance = ReactDOM.render(<PP64App /> as any, body);

function _onError(app: PP64App, error: Error, errorInfo: React.ErrorInfo | null) {
  app.setState({
    error,
    errorInfo,
  });
  console.error(error, errorInfo);
}

// Capture errors that don't happen during rendering.
window.onerror = function (msg, url, lineNo, columnNo, error) {
  if (error) {
    _onError((window as any)._PP64instance, error, null);
  }
};

interface IErrorDisplayProps {
  error: Error,
  errorInfo: React.ErrorInfo | null,
  onClearError(): void;
}

function ErrorDisplay(props: IErrorDisplayProps) {
  const componentStack = props.errorInfo && props.errorInfo.componentStack;
  return (
    <div className="errorDiv selectable">
      <h2>Hey, it seeems like something's wrong in&nbsp;
        <span className="errorStrikeoutText">Mushroom Village</span>&nbsp;
        PartyPlanner64.</h2>
      <p>Please &nbsp;
        <a href="https://github.com/PartyPlanner64/PartyPlanner64/issues" target="_blank">
          file an issue
        </a>
        &nbsp; with the following details, and refresh the page. Or &nbsp;
        <a href="#" onClick={props.onClearError}>click here</a>&nbsp;
        to dismiss this error, but you may be in a bad state.
      </p>
      <pre>{props.error.toString()}</pre>
      {props.error.stack ? <React.Fragment>
          <div>Stack Error Details:</div>
          <pre>{props.error.stack}</pre>
        </React.Fragment>
        : null
      }
      <div>Component Stack Error Details:</div>
      <pre>{componentStack || "N/A"}</pre>
    </div>
  );
}