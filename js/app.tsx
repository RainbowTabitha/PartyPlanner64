// This is the top level of the application, and includes the root React view.
namespace PP64.app {
  interface IPP64AppState {
    currentView: PP64.types.View,
    boards: PP64.boards.IBoard[],
    currentBoard: PP64.boards.IBoard,
    currentEvent: PP64.adapters.events.IEvent | null,
    romLoaded: boolean,
    currentAction: PP64.types.Action,
    selectedSpaces: PP64.boards.ISpace[] | null,
    blocked: boolean,
    message: string,
    messageHTML: string,
    error: Error | null,
    errorInfo: React.ErrorInfo | null,
  }

  class PP64App extends React.Component<{}, IPP64AppState> {
    state: IPP64AppState = {
      currentView: PP64.types.View.EDITOR,
      boards: PP64.boards.getBoards(),
      currentBoard: PP64.boards.getCurrentBoard(),
      currentEvent: null,
      romLoaded: false,
      currentAction: PP64.types.Action.MOVE,
      selectedSpaces: null,
      blocked: false,
      message: "",
      messageHTML: "",
      error: null,
      errorInfo: null,
    }

    render() {
      if (this.state.error) {
        return (
          <div className="errorDiv selectable">
            <h2>Hey, it seeems like something's wrong in&nbsp;
              <span className="errorStrikeoutText">Mushroom Village</span>&nbsp;
              PartyPlanner64.</h2>
            <p>Please &nbsp;
              <a href="https://github.com/PartyPlanner64/PartyPlanner64/issues" target="_blank">
                file an issue
              </a>
              &nbsp; with the following details, and refresh the page.
            </p>
            <pre>{this.state.error.toString()}</pre>
            {this.state.error.stack ? <React.Fragment>
                <div>Stack Error Details:</div>
                <pre>{this.state.error.stack}</pre>
              </React.Fragment>
              : null
            }
            <div>Component Stack Error Details:</div>
            <pre>{this.state.errorInfo!.componentStack}></pre>
          </div>
        );
      }

      PP64.utils.browser.updateWindowTitle(this.state.currentBoard.name);
      let mainView;
      switch (this.state.currentView) {
        case PP64.types.View.EDITOR:
          mainView = <PP64.renderer.Editor board={this.state.currentBoard} selectedSpaces={this.state.selectedSpaces} />;
          break;
        case PP64.types.View.DETAILS:
          mainView = <PP64.details.Details board={this.state.currentBoard} />;
          break;
        case PP64.types.View.SETTINGS:
          mainView = <PP64.settings.Settings />;
          break;
        case PP64.types.View.ABOUT:
          mainView = <PP64.about.About />;
          break;
        case PP64.types.View.MODELS:
          mainView = <PP64.models.ModelViewer />;
          break;
        case PP64.types.View.EVENTS:
          mainView = <PP64.events.EventsView />;
          break;
        case PP64.types.View.CREATEEVENT:
          mainView = <PP64.events.CreateEventView />;
          break;
        case PP64.types.View.STRINGS:
          mainView = <PP64.strings.StringsViewer />;
          break;
        case PP64.types.View.PATCHES:
          mainView = [<PP64.patches.PatchView key="PatchView" />];
          if (PP64.patches.gameshark.romSupportsCheats()) {
            mainView.push(<PP64.patches.gameshark.GamesharkView key="GamesharkView" />);
          }
          break;
      }

      let sidebar;
      switch (this.state.currentView) {
      case PP64.types.View.EDITOR:
      case PP64.types.View.DETAILS:
        sidebar = (
          <div className="sidebar">
            <PP64.boardmenu.BoardMenu
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
              <button onClick={() => { PP64.app.showMessage(); }}>OK</button>
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
      if (this.state.currentAction === $actType.ERASE)
        bodyClass += " eraser";

      return (
        <div className={bodyClass}>
          <PP64.header.Header view={this.state.currentView} romLoaded={this.state.romLoaded} board={this.state.currentBoard} />
          <div className="content">
            {sidebar}
            <div className="main">
              {mainView}
              <div className="mainOverlay">
                <PP64.toolwindow.ToolWindow name="Toolbox" position="TopRight"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <PP64.toolbar.Toolbar currentAction={this.state.currentAction}
                    gameVersion={this.state.currentBoard.game}
                    boardType={this.state.currentBoard.type} />
                </PP64.toolwindow.ToolWindow>
                <PP64.toolwindow.ToolWindow name="Space Properties" position="BottomRight"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <PP64.properties.SpaceProperties selectedSpaces={this.state.selectedSpaces}
                    gameVersion={this.state.currentBoard.game}
                    boardType={this.state.currentBoard.type} />
                </PP64.toolwindow.ToolWindow>
                <PP64.toolwindow.ToolWindow name="Board Properties" position="BottomLeft"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <PP64.properties.BoardProperties currentBoard={this.state.currentBoard} />
                </PP64.toolwindow.ToolWindow>
              </div>
              <div id="dragZone"></div>
            </div>
          </div>
          {blocked}
        </div>
      );
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      this.setState({
        error,
        errorInfo,
      });
      console.error(error, errorInfo);
    }
  };

  const body = document.getElementById("body");
  let _instance = ReactDOM.render(<PP64App />, body) as PP64App;

  export function changeView(view: PP64.types.View) {
    _instance.setState({ currentView: view });
  }

  export function currentBoardChanged() {
    _instance.setState({
      currentBoard: PP64.boards.getCurrentBoard(),
      selectedSpaces: null,
      currentAction: PP64.types.Action.MOVE
    });
  }

  export function boardsChanged() {
    _instance.setState({ boards: PP64.boards.getBoards() });
  }

  export function romLoadedChanged() {
    _instance.setState({ romLoaded: PP64.romhandler.romIsLoaded() });
  }

  export function changeCurrentAction(action: PP64.types.Action) {
    _instance.setState({ currentAction: action });
  }

  export function getCurrentAction() {
    return _instance.state.currentAction;
  }

  export function changeSelectedSpaces(selectedSpaces: PP64.boards.ISpace[]) {
    _instance.setState({ selectedSpaces });
  }

  export function getSelectedSpaces() {
    return _instance.state.selectedSpaces;
  }

  export function changeCurrentEvent(event: PP64.adapters.events.IEvent | null) {
    _instance.setState({ currentEvent: event });
  }

  export function getCurrentEvent() {
    return _instance.state.currentEvent;
  }

  export function blockUI(blocked: boolean) {
    _instance.setState({ blocked: !!blocked });
  }

  export function showMessage(message?: string) {
    _instance.setState({ blocked: !!message, message: message || "", messageHTML: "" });
  }

  export function showMessageHTML(html: string) {
    _instance.setState({ blocked: !!html, message: "", messageHTML: html || "" });
  }

  export function refresh() {
    _instance.forceUpdate();
  }
}
