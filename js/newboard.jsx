PP64.newboard = (function() {
  const Themes = [
    { name: "Blank", id: "default" }
  ];

  const NewBoard = class NewBoard extends React.Component {
    state = {
      version: 1,
      type: PP64.types.BoardType.NORMAL,
      theme: 0,
    }

    onVersionChange = (version) => {
      this.setState({ version });
      if (version !== 3)
        this.setState({ type: PP64.types.BoardType.NORMAL });
    }

    onTypeChange = (type) => {
      this.setState({ type });
    }

    onThemeChange = (theme) => {
      this.setState({ theme });
    }

    submit = () => {
      if (this.state.type === PP64.types.BoardType.DUEL) {
        PP64.app.showMessage("Duel board support is partially finished, coming soon!");
        if (!$$debug)
          return;
      }
      let fn = this.props.onAccept;
      if (fn)
        fn(this.state.version, this.state.type, Themes[this.props.theme]);
    }

    render() {
      const Button = PP64.controls.Button;
      return (
        <div className="newBoardContainer">
          <NewBoardVersionSelect onVersionChange={this.onVersionChange} />
          {this.state.version === 3 ?
            <NewBoardTypeSelect type={this.state.type}
              onTypeChange={this.onTypeChange} />
            : null }
          <NewBoardThemeSelect onThemeChange={this.onThemeChange} />
          <Button onClick={this.submit} css="nbCreate">Create</Button>
        </div>
      );
    }
  };

  const NewBoardVersionSelect = class NewBoardVersionSelect extends React.Component {
    state = {
      version: 1,
    }

    onVersionChange = (id, pressed) => {
      this.setState({ version: id });
      this.props.onVersionChange(id);
    }

    render() {
      const ToggleButton = PP64.controls.ToggleButton;

      let gameVersions = (
        [
          <ToggleButton id={1} key={1} allowDeselect={false} onToggled={this.onVersionChange}
            pressed={this.state.version === 1}>
            <span className="newBoardVersion" title="Mario Party 1">MP1</span>
          </ToggleButton>
        ]
      );
      gameVersions.push(
        <ToggleButton id={2} key={2} allowDeselect={false} onToggled={this.onVersionChange}
          pressed={this.state.version === 2}>
          <span className="newBoardVersion" title="Mario Party 2">MP2</span>
        </ToggleButton>
      );
      gameVersions.push(
        <ToggleButton id={3} key={3} allowDeselect={false} onToggled={this.onVersionChange}
          pressed={this.state.version === 3}>
          <span className="newBoardVersion" title="Mario Party 3">MP3</span>
        </ToggleButton>
      );
      return (
        <div className="newBoardVersionSelect">
          <label className="nbLabel">Game Version</label>
          <br />
          {gameVersions}
        </div>
      );
    }
  };

  const NewBoardTypeSelect = class extends React.Component {
    onTypeChange = (type) => {
      this.props.onTypeChange(type);
    }

    render() {
      const ToggleButton = PP64.controls.ToggleButton;
      return (
        <div className="newBoardVersionSelect">
          <label className="nbLabel">Board Type</label>
          <br />
          <ToggleButton id={PP64.types.BoardType.NORMAL}
            allowDeselect={false}
            onToggled={this.onTypeChange}
            pressed={this.props.type === PP64.types.BoardType.NORMAL}>
            <span className="newBoardVersion" title="Normal party board">Normal</span>
          </ToggleButton>
          <ToggleButton id={PP64.types.BoardType.DUEL}
            allowDeselect={false}
            onToggled={this.onTypeChange}
            pressed={this.props.type === PP64.types.BoardType.DUEL}>
            <span className="newBoardVersion" title="Duel board">Duel</span>
          </ToggleButton>
        </div>
      );
    }
  };

  const NewBoardThemeSelect = class NewBoardThemeSelect extends React.Component {
    state = {
      theme: 0,
    }

    onThemeChange = (id, pressed) => {
      this.setState({ theme: id });
      this.props.onThemeChange(id);
    }

    render() {
      const ToggleButton = PP64.controls.ToggleButton;

      let themeEntries = Themes.map((theme, i) => {
        let previewUrl = `img/themes/${theme.id}/preview.png`;
        return (
          <ToggleButton id={i} key={i} allowDeselect={false} css="nbTheme"
            onToggled={this.onThemeChange} pressed={this.state.theme === i}>
            <img src={previewUrl} className="newBoardThemePreview" width="96" height="72" />
            <span className="newBoardTheme">
              <span className="newBoardThemeInner">{theme.name}</span>
            </span>
          </ToggleButton>
        );
      });
      return (
        <div className="NewBoardThemeSelect">
          <label className="nbLabel">Theme</label>
          <br />
          {themeEntries}
        </div>
      );
    }
  };

  return {
    NewBoard,
  };
})();
