// This is the top level of the application, and includes the root React view.

import { View, Action } from "../types";
import { getAdditionalBackgroundCode, setAdditionalBackgroundCode, getAudioSelectCode, setAudioSelectCode } from "../boards";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { updateWindowTitle } from "../utils/browser";
import { Editor } from "../renderer";
import { Details } from "../views/details";
import { Settings } from "../views/settings";
import { About } from "../views/about";
import { ModelViewer } from "../views/models";
import { EventsView } from "../views/eventsview";
import { CreateASMEventView } from "../views/createevent_asm";
import { CreateCEventView } from "../views/createevent_c";
import { StringsViewer } from "../views/strings";
import { GamesharkView } from "../views/gameshark";
import { BoardMenu } from "../boardmenu";
import { Notification, NotificationBar, NotificationButton, NotificationColor } from "../components/notifications";
import { Header } from "../header";
import { ToolWindow } from "../toolwindow";
import { Toolbar } from "../toolbar";
import { SpaceProperties } from "../spaceproperties";
import { BoardProperties } from "../boardproperties";
import "../utils/onbeforeunload";
import "../events/builtin/events.common";
import "../events/builtin/MP1/events.MP1";
import "../events/builtin/MP2/events.MP2";
import "../events/builtin/MP3/events.MP3";
import "file-saver";
import { DebugView } from "../views/debug";
import { AudioViewer } from "../views/audio";
import { BasicCodeEditorView } from "../views/basiccodeeditorview";
import { IDecisionTreeNode } from "../ai/aitrees";
import { DecisionTreeEditor } from "../ai/aieditor";
import { isElectron } from "../utils/electron";
import { blockUI, showMessage, changeDecisionTree } from "./appControl";
import { Blocker } from "../components/blocker";
import { killEvent } from "../utils/react";
import { getDefaultAdditionalBgCode, testAdditionalBgCodeAllGames } from "../events/additionalbg";
import { getDefaultGetAudioCode, testGetAudioCodeAllGames } from "../events/getaudiochoice";
import { SpriteView } from "../views/sprites";
import { store } from "./store";
import { selectCurrentAction, selectCurrentView, selectRomLoaded, selectUpdateExists, setHideUpdateNotification, setUpdateExistsAction } from "./appState";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { selectBlocked, selectConfirm, selectMessage, selectMessageHTML, selectOnBlockerFinished, selectPrompt } from "./blocker";
import { selectBoards, selectCurrentBoard } from "./boardState";
import { BasicErrorBoundary } from "../components/BasicErrorBoundary";

/* eslint-disable jsx-a11y/anchor-is-valid */

interface IPP64AppState {
  aiTree: IDecisionTreeNode[] | null;
  notifications: React.ReactElement<Notification>[];
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class PP64App extends React.Component<{}, IPP64AppState> {
  state: IPP64AppState = {
    aiTree: null,
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
            blockUI(false);
          }} />
      );
    }

    return <PP64AppInternal {...this.state} />;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    _onError(this, error, errorInfo);
  }

  componentDidMount() {
    if (isElectron) {
      try {
        const ipcRenderer = (window as any).require("electron").ipcRenderer;
        ipcRenderer.on("update-check-hasupdate", this._onUpdateCheckHasUpdate);
        ipcRenderer.send("update-check-start");
      }
      catch (e) {
        console.error("Auto update failed in componentDidMount: ", e);
      }
    }
  }

  componentWillUnmount() {
    if (isElectron) {
      try {
        const ipcRenderer = (window as any).require("electron").ipcRenderer;
        ipcRenderer.removeListener("update-check-hasupdate", this._onUpdateCheckHasUpdate);
      }
      catch (e) {
        console.error("Auto update failed in componentWillUnmount: ", e);
      }
    }
  }

  _onUpdateCheckHasUpdate = () => {
    store.dispatch(setUpdateExistsAction(true));
  }
};

interface PP64AppInternalProps {
  aiTree: IDecisionTreeNode[] | null;
  notifications: React.ReactElement<Notification>[];
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

function PP64AppInternal(props: PP64AppInternalProps) {
  const currentView = useAppSelector(selectCurrentView);
  const blocked = useAppSelector(selectBlocked);
  const boards = useAppSelector(selectBoards);
  const currentBoard = useAppSelector(selectCurrentBoard);
  const currentAction = useAppSelector(selectCurrentAction);
  const updateExists = useAppSelector(selectUpdateExists);
  const romLoaded = useAppSelector(selectRomLoaded);

  updateWindowTitle(currentBoard.name);

  let mainView;
  switch (currentView) {
    case View.EDITOR:
      mainView = <Editor />;
      break;
    case View.DETAILS:
      mainView = <Details board={currentBoard} />;
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
    case View.SPRITES:
      mainView = <SpriteView />;
      break;
    case View.EVENTS:
      mainView = (
        <BasicErrorBoundary>
          <EventsView />
        </BasicErrorBoundary>
      );
      break;
    case View.CREATEEVENT_ASM:
      mainView = <CreateASMEventView />;
      break;
    case View.CREATEEVENT_C:
      mainView = <CreateCEventView />;
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
    case View.ADDITIONAL_BGS:
      mainView = <BasicCodeEditorView board={currentBoard}
        title="Additional Background Configuration"
        getExistingCode={() => getAdditionalBackgroundCode(currentBoard)}
        getDefaultCode={lang => getDefaultAdditionalBgCode(lang)}
        onSetCode={(code, lang) => setAdditionalBackgroundCode(code, lang)}
        canSaveAndExit={(code, lang) => testAdditionalBgCodeAllGames(code, lang, currentBoard)} />;
      break;
    case View.AUDIO_SELECTION_CODE:
      mainView = <BasicCodeEditorView board={currentBoard}
        title="Background Music Selection Code"
        getExistingCode={() => getAudioSelectCode(currentBoard)}
        getDefaultCode={lang => getDefaultGetAudioCode(lang)}
        onSetCode={(code, lang) => setAudioSelectCode(code, lang)}
        canSaveAndExit={(code, lang) => testGetAudioCodeAllGames(code, lang, currentBoard)} />;
      break;
  }

  let sidebar;
  switch (currentView) {
    case View.EDITOR:
    case View.DETAILS:
    case View.EVENTS:
      sidebar = (
        <div className="sidebar">
          <BoardMenu
            boards={boards} />
        </div>
      );
      break;
  }

  let bodyClass = "body";
  if (currentAction === Action.ERASE)
    bodyClass += " eraser";

  return (
    <div className={bodyClass}>
      <PP64NotificationBar notifications={props.notifications}
        updateExists={updateExists} />
      <Header view={currentView} romLoaded={romLoaded} board={currentBoard} />
      <div className="content"
        onKeyDownCapture={blocked ? killEvent : undefined}>
        {sidebar}
        <div className="main">
          {mainView}
          <div className="mainOverlay">
            <ToolWindow name="Toolbox" position="TopRight"
              visible={currentView === View.EDITOR}>
              <Toolbar currentAction={currentAction}
                gameVersion={currentBoard.game}
                boardType={currentBoard.type} />
            </ToolWindow>
            <ToolWindow name="Space Properties" position="BottomRight"
              visible={currentView === View.EDITOR}>
              <SpaceProperties
                gameVersion={currentBoard.game}
                boardType={currentBoard.type} />
            </ToolWindow>
            <ToolWindow name="Board Properties" position="BottomLeft"
              visible={currentView === View.EDITOR}>
              <BoardProperties currentBoard={currentBoard} />
            </ToolWindow>
            {props.aiTree &&
              <ToolWindow name="AI Decision Tree" position="TopLeft"
                visible={currentView === View.EDITOR}
                canClose onCloseClick={() => changeDecisionTree(null)}>
                <DecisionTreeEditor root={props.aiTree} />
              </ToolWindow>
            }
          </div>
          <div id="dragZone"></div>
        </div>
      </div>
      <PP64Blocker />
    </div>
  );
}

interface PP64NotificationBarProps {
  updateExists: boolean;
  notifications: React.ReactElement<Notification>[];
}

function PP64NotificationBar(props: PP64NotificationBarProps) {
  const dispatch = useAppDispatch();

  const onUpdateNotificationClosed = useCallback(() => {
    dispatch(setHideUpdateNotification(true));
  }, [dispatch]);

  const onUpdateNotificationInstallClicked = useCallback(() => {
    dispatch(setHideUpdateNotification(true));
    blockUI(true);

    if (isElectron) {
      const ipcRenderer = (window as any).require("electron").ipcRenderer;
      ipcRenderer.send("update-check-doupdate");
    }
  }, [dispatch]);

  const updateHideNotification = useAppSelector(state => state.app.updateHideNotification);

  const notifications = props.notifications.slice();
  if (props.updateExists && !updateHideNotification) {
    notifications.push(
      <Notification key="update"
        color={NotificationColor.Blue}
        onClose={onUpdateNotificationClosed}>
        An update is available.
        <NotificationButton onClick={onUpdateNotificationInstallClicked}>
          Install
        </NotificationButton>
      </Notification>
    );
  }

  return (
    <NotificationBar>
      {notifications}
    </NotificationBar>
  );
}

function PP64Blocker() {
  const blocked = useAppSelector(selectBlocked);
  const message = useAppSelector(selectMessage);
  const messageHTML = useAppSelector(selectMessageHTML);
  const prompt = useAppSelector(selectPrompt);
  const confirm = useAppSelector(selectConfirm);
  const onBlockerFinished = useAppSelector(selectOnBlockerFinished);


  if (!blocked) {
    return null;
  }

  return <Blocker
    message={message}
    messageHTML={messageHTML}
    prompt={prompt}
    confirm={confirm}
    onAccept={(value?: string) => {
      showMessage();
      if (onBlockerFinished) {
        onBlockerFinished(value);
      }
    }}
    onCancel={() => {
      showMessage();
      if (onBlockerFinished) {
        onBlockerFinished();
      }
    }}
    onForceClose={() => blockUI(false)} />
}

// Capture errors that don't happen during rendering.
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const app = (window as any)._PP64instance;
  if (error) {
    if (app) {
      _onError(app, error, null);
    }
    else { // Occurred during ReactDOM.render?
      alert(error);
    }
  }
};

const body = document.getElementById("body");
ReactDOM.render(
  <Provider store={store}>
    <PP64App ref={app => (window as any)._PP64instance = app} />
  </Provider>,
  body
);

function _onError(app: PP64App, error: Error, errorInfo: React.ErrorInfo | null) {
  app.setState({
    error,
    errorInfo,
  });
  console.error(error, errorInfo);
}

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
        <a href="https://github.com/PartyPlanner64/PartyPlanner64/issues" target="_blank" rel="noopener noreferrer">
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
