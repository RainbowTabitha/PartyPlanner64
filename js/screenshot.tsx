namespace PP64.screenshot {
  interface ITakeScreenyOpts {
    renderConnections?: boolean;
    renderCharacters?: boolean;
    renderHiddenSpaces?: boolean;
    renderBadges?: boolean;
  }

  function takeScreeny(opts: ITakeScreenyOpts = {}) {
    let curBoard = PP64.boards.getCurrentBoard();
    let screenCtx = PP64.utils.canvas.createContext(curBoard.bg.width, curBoard.bg.height);

    let bgImage = PP64.renderer.external.getBGImage();
    screenCtx.drawImage(bgImage, 0, 0, curBoard.bg.width, curBoard.bg.height);

    // Disable debug temporarily for the render
    let origDebug = $$debug;
    $$debug = false;

    if (opts.renderConnections)
      PP64.renderer.external.renderConnections(screenCtx.canvas, screenCtx, curBoard, false);

    PP64.renderer.external.renderSpaces(screenCtx.canvas, screenCtx, curBoard, false, {
      skipCharacters: !opts.renderCharacters,
      skipHiddenSpaces: !opts.renderHiddenSpaces,
      skipBadges: !opts.renderBadges,
    });

    $$debug = origDebug;

    return screenCtx.canvas.toDataURL();
  }

  interface IScreenshotProps {
    onAccept: (dataUri: string) => any;
  }

  interface IScreenshotState {
    renderConnections?: boolean;
    renderCharacters?: boolean;
    renderHiddenSpaces?: boolean;
    renderBadges?: boolean;
  }

  export const Screenshot = class Screenshot extends React.Component<IScreenshotProps, IScreenshotState> {
    state = {
      renderConnections: true,
      renderCharacters: true,
      renderHiddenSpaces: true,
      renderBadges: true,
    }

    takeScreenshot = () => {
      let dataUri = takeScreeny({
        renderConnections: this.state.renderConnections,
        renderCharacters: this.state.renderCharacters,
        renderHiddenSpaces: this.state.renderHiddenSpaces,
        renderBadges: this.state.renderBadges,
      });
      if (this.props.onAccept)
        this.props.onAccept(dataUri);
    }

    onCheckChanged = (id: any) => {
      let partialState: any = {};
      partialState[id] = !(this as any).state[id]
      this.setState(partialState);
    }

    render() {
      const Button = PP64.controls.Button;
      return (
        <div className="screenshotContainer">
          <label className="nbLabel">Screenshot Options</label>
          <br />
          <Checkbox id="renderConnections" text="Render connections"
            checked={this.state.renderConnections} onChange={this.onCheckChanged} />
          <Checkbox id="renderCharacters" text="Render characters"
            checked={this.state.renderCharacters} onChange={this.onCheckChanged} />
          <Checkbox id="renderHiddenSpaces" text="Render hidden spaces"
            checked={this.state.renderHiddenSpaces} onChange={this.onCheckChanged} />
          <Checkbox id="renderBadges" text="Render badges"
            checked={this.state.renderBadges} onChange={this.onCheckChanged} />
          <br />
          <Button onClick={this.takeScreenshot} css="ssCreate">Take Screenshot</Button>
        </div>
      );
    }
  };

  interface ICheckboxProps {
    onChange: Function;
    id: string;
    css?: string;
    text?: string;
    checked?: boolean;
  }

  const Checkbox = class Checkbox extends React.Component<ICheckboxProps> {
    state = {
    }

    onChange = () => {
      this.props.onChange(this.props.id);
    }

    render() {
      let css = "ssCheck";
      if (this.props.css)
        css += " " + this.props.css;
      return (
        <label className={css} title="">
          <input type="checkbox" onChange={this.onChange} checked={this.props.checked} />
          {this.props.text}
        </label>
      );
    }
  };
}
