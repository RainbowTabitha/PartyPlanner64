// This is the top level of the application, and includes the root React view.
PP64.app = new class app {
  constructor(body = document.getElementById("body")) {
    let PP64App = class PP64App extends React.Component {
      state = {
        currentView: window.PP64.types.View.EDITOR,
        boards: window.PP64.boards.getBoards(),
        currentBoard: window.PP64.boards.getCurrentBoard(),
        romLoaded: false,
        currentAction: window.PP64.types.Action.MOVE,
        selectedSpaces: null,
        blocked: false,
        message: "",
        messageHTML: "",
        error: false,
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
              <pre>{this.state.errorInfo.componentStack}></pre>
            </div>
          );
        }

        window.PP64.utils.browser.updateWindowTitle(this.state.currentBoard.name);
        let mainView;
        switch (this.state.currentView) {
          case window.PP64.types.View.EDITOR:
            mainView = <window.PP64.renderer.Editor board={this.state.currentBoard} selectedSpaces={this.state.selectedSpaces} />;
            break;
          case window.PP64.types.View.DETAILS:
            mainView = <window.PP64.details.Details board={this.state.currentBoard} />;
            break;
          case window.PP64.types.View.SETTINGS:
            mainView = <window.PP64.settings.Settings />;
            break;
          case window.PP64.types.View.ABOUT:
            mainView = <window.PP64.about.About />;
            break;
          case window.PP64.types.View.MODELS:
            mainView = <window.PP64.models.ModelViewer />;
            break;
          case window.PP64.types.View.EVENTS:
            mainView = <window.PP64.events.EventsView />;
            break;
          case window.PP64.types.View.CREATEEVENT:
            mainView = <window.PP64.events.CreateEventView />;
            break;
          case window.PP64.types.View.STRINGS:
            mainView = <window.PP64.strings.StringsViewer />;
            break;
          case window.PP64.types.View.PATCHES:
            mainView = [<window.PP64.patches.PatchView key="PatchView" />];
            if (PP64.patches.gameshark.romSupportsCheats()) {
               mainView.push(<window.PP64.patches.gameshark.GamesharkView key="GamesharkView" />);
            }
            break;
        }

        let sidebar;
        switch (this.state.currentView) {
          case window.PP64.types.View.EDITOR:
          case window.PP64.types.View.DETAILS:
            sidebar = (
              <div className="sidebar">
                <window.PP64.boardmenu.BoardMenu boards={this.state.boards} currentBoard={this.state.currentBoard} />
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
            <window.PP64.header.Header view={this.state.currentView} romLoaded={this.state.romLoaded} board={this.state.currentBoard} />
            <div className="content">
              {sidebar}
              <div className="main">
                {mainView}
                <div id="dragZone"></div>
              </div>
              <div className="mainOverlay">
                <window.PP64.toolwindow.ToolWindow name="Toolbox" position="TopRight"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <window.PP64.toolbar.Toolbar currentAction={this.state.currentAction}
                    gameVersion={this.state.currentBoard.game}
                    boardType={this.state.currentBoard.type} />
                </window.PP64.toolwindow.ToolWindow>
                <window.PP64.toolwindow.ToolWindow name="Space Properties" position="BottomRight"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <window.PP64.properties.SpaceProperties selectedSpaces={this.state.selectedSpaces}
                    gameVersion={this.state.currentBoard.game}
                    boardType={this.state.currentBoard.type} />
                </window.PP64.toolwindow.ToolWindow>
                <window.PP64.toolwindow.ToolWindow name="Board Properties" position="BottomLeft"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <window.PP64.properties.BoardProperties currentBoard={this.state.currentBoard} />
                </window.PP64.toolwindow.ToolWindow>
              </div>
            </div>
            {blocked}
          </div>
        );
      }

      componentDidCatch(error, errorInfo) {
        this.setState({
          error,
          errorInfo,
        });
        console.error(error, errorInfo);
      }
    };

    this._instance = ReactDOM.render(<PP64App />, body);
  }

  changeView(view) {
    this._instance.setState({ currentView: view });
  }

  currentBoardChanged() {
    this._instance.setState({
      currentBoard: window.PP64.boards.getCurrentBoard(),
      selectedSpaces: null,
      currentAction: PP64.types.Action.MOVE
    });
  }

  boardsChanged() {
    this._instance.setState({ boards: window.PP64.boards.getBoards() });
  }

  romLoadedChanged() {
    this._instance.setState({ romLoaded: window.PP64.romhandler.romIsLoaded() });
  }

  changeCurrentAction(action) {
    this._instance.setState({ currentAction: action });
  }

  getCurrentAction() {
    return this._instance.state.currentAction;
  }

  changeSelectedSpaces(selectedSpaces) {
    this._instance.setState({ selectedSpaces });
  }

  getSelectedSpaces() {
    return this._instance.state.selectedSpaces;
  }

  changeCurrentEvent(event) {
    this._instance.setState({ currentEvent: event });
  }

  getCurrentEvent() {
    return this._instance.state.currentEvent;
  }

  blockUI(blocked) {
    this._instance.setState({ blocked: !!blocked });
  }

  showMessage = (message) => {
    this._instance.setState({ blocked: !!message, message: message || "", messageHTML: "" });
  }

  showMessageHTML = (html) => {
    this._instance.setState({ blocked: !!html, message: "", messageHTML: html || "" });
  }

  refresh() {
    this._instance.forceUpdate();
  }
}();
