PP64.boardmenu = new class BoardMenu {
  constructor() {
    this.BoardMenu = class BoardMenu extends React.Component {
      render() {
        let i = 0;
        let boards = this.props.boards.map(function(item) {
          let idx = i++;
          return (
            <Board key={idx} board={item} index={idx} />
          );
        });
        return (
          <div className="boardMenu" role="listbox">
            <div className="boardMenuInner" role="presentation">
              {boards}
            </div>
          </div>
        );
      }
    };

    const Board = class Board extends React.Component {
      handleClick = () => {
        PP64.boards.setCurrentBoard(this.props.index);
      }

      onDragStart = (event) => {
        // Cannot delete courses that are within the ROM.
        if (this.props.board._rom) {
          event.preventDefault();
          return;
        }

        PP64.utils.drag.showDragZone();
        event.nativeEvent.dataTransfer.setData("text/plain", this.props.index);
        PP64.utils.drag.setDropHandler(function(event) {
          event.preventDefault();
          var boardIdx = parseInt(event.dataTransfer.getData("text/plain"));
          if (isNaN(boardIdx))
            return;
          PP64.utils.drag.hideDragZone();
          PP64.boards.deleteBoard(boardIdx);
          PP64.renderer.render();
        });
      }

      onDragEnd = (event) => {
        PP64.utils.drag.hideDragZone();
      }

      onRightClick = (event) => {
        // Also in BoardOptions...
        event.preventDefault();
        let items = [
          { title: 'Copy', fn: this.onCopyBoard },
          { title: 'Delete', fn: this.onDeleteBoard, visible: !PP64.boards.boardIsROM(this.props.board) },
        ];
        basicContext.show(items, event.nativeEvent);
      }

      onDeleteBoard = () => {
        PP64.boards.deleteBoard(this.props.index);
        PP64.renderer.render();
      }

      onCopyBoard = () => {
        PP64.boards.copyCurrentBoard();
      }

      render() {
        let tooltip = `Open "${this.props.board.name}"`;
        let className = "boardEntry";
        if (PP64.boards.getCurrentBoardIndex() === this.props.index)
          className += " boardEntryCurrent";
        let boardImg = this.props.board.otherbg.boardlogo || "";
        let imgEl;
        if (boardImg) {
          imgEl = <img className="boardEntryImg" src={boardImg} width="200" height="88" />;
        }
        else {
          imgEl = <div className="boardEntryNoImg" />;
        }

        let boardName = this.props.board.name;
        let boardIsROM = PP64.boards.boardIsROM(this.props.board);
        let onKeyDown = PP64.utils.react.makeKeyClick(this.handleClick, this);
        return (
          <div className={className} title={tooltip} role="option" tabIndex="0"
            onClick={this.handleClick} onKeyDown={onKeyDown} onContextMenu={this.onRightClick}
            draggable="true" onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
            {imgEl}
            <BoardROMIcon rom={boardIsROM} />
            <BoardName name={boardName} />
            <BoardOptions rom={boardIsROM}
              onDeleteBoard={this.onDeleteBoard} onCopyBoard={this.onCopyBoard} />
          </div>
        );
      }
    };

    const BoardROMIcon = class BoardROMIcon extends React.Component {
      render() {
        if (!this.props.rom)
          return null;
        return (
          <div className="boardEntryRomIcon" title="Loaded from ROM">
            <img src="img/boardmenu/cart.png" width="26" height="26" />
          </div>
        );
      }
    };

    const BoardName = class BoardName extends React.Component {
      state = { "editing": false }

      handleClick = () => {
        this.setState({ "editing": !!this.state.editing });
      }

      render() {
        return (
          <div className="boardName">
            <PP64.texteditor.MPEditor
              value={this.props.name}
              displayMode={PP64.texteditor.MPEditorDisplayMode.Display} />
          </div>
        );
      }
    };

    const BoardOptions = class BoardOptions extends React.Component {
      handleClick = (event) => {
        event.preventDefault();
        let items = [
          { title: 'Copy', fn: this.props.onCopyBoard },
          { title: 'Delete', fn: this.props.onDeleteBoard, visible: !this.props.rom },
          // { title: 'Disabled', icon: 'ion-minus-circled', fn: this.onDeleteOption, disabled: true },
          // { title: 'Invisible', icon: 'ion-eye-disabled', fn: this.onDeleteOption, visible: false },
          // { },
          // { title: 'Logout', icon: 'ion-log-out', fn: this.onDeleteOption }
        ];
        basicContext.show(items, event.nativeEvent);
      }

      render() {
        return (
          <img className="boardMenuIcon" src="img/boardmenu/options.png" onClick={this.handleClick} />
        );
      }
    };
  }
}();
