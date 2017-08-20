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
        currentSpace: null,
        blocked: false,
        message: "",
      }

      render() {
        window.PP64.utils.browser.updateWindowTitle(this.state.currentBoard.name);
        let mainView;
        switch (this.state.currentView) {
          case window.PP64.types.View.EDITOR:
            mainView = <window.PP64.renderer.Editor board={this.state.currentBoard} currentSpace={this.state.currentSpace} />;
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
          case window.PP64.types.View.PATCHES:
            mainView = [<window.PP64.patches.PatchView />];
            if (PP64.patches.gameshark.romSupportsCheats()) {
               mainView.push(<window.PP64.patches.gameshark.GamesharkView />);
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
          if (this.state.message) {
            content = (
              <div className="loadingMsg">
                <span className="loadingMsgTxt selectable">{this.state.message}</span>
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
                  <window.PP64.toolbar.Toolbar currentAction={this.state.currentAction} gameVersion={this.state.currentBoard.game} />
                </window.PP64.toolwindow.ToolWindow>
                <window.PP64.toolwindow.ToolWindow name="Space Properties" position="BottomRight"
                  visible={this.state.currentView === $viewType.EDITOR}>
                  <window.PP64.properties.SpaceProperties currentSpace={this.state.currentSpace} gameVersion={this.state.currentBoard.game} />
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
    };

    this._instance = ReactDOM.render(<PP64App />, body);
  }

  changeView(view) {
    this._instance.setState({ currentView: view });
  }

  currentBoardChanged() {
    this._instance.setState({
      currentBoard: window.PP64.boards.getCurrentBoard(),
      currentSpace: null,
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

  changeCurrentSpace(space) {
    this._instance.setState({ currentSpace: space });
  }

  getCurrentSpace() {
    return this._instance.state.currentSpace;
  }

  blockUI(blocked) {
    this._instance.setState({ blocked: !!blocked });
  }

  showMessage = (message) => {
    this._instance.setState({ blocked: !!message, message: message || "" });
  }

  refresh() {
    this._instance.forceUpdate();
  }
}();
