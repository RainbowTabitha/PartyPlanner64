PP64.newboard = (function() {
  const Themes = [
    { name: "Blank", id: "default" }
  ];

  const NewBoard = class NewBoard extends React.Component {
    state = {
      version: 1,
      theme: 0,
    }

    onVersionChange = (version) => {
      this.setState({ version });
    }

    onThemeChange = (theme) => {
      this.setState({ theme });
    }

    submit = () => {
      let fn = this.props.onAccept;
      if (fn)
        fn(this.state.version, Themes[this.props.theme]);
    }

    render() {
      const Button = PP64.controls.Button;
      return (
        <div className="newBoardContainer">
          <NewBoardVersionSelect onVersionChange={this.onVersionChange} />
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
