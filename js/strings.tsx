namespace PP64.strings {
  interface IStringsViewerState {
    hasError: boolean;
  }

  export class StringsViewer extends React.Component<{}, IStringsViewerState> {
    constructor(props: {}) {
      super(props);

      this.state = {
        hasError: false
      };
    }

    render() {
      if (this.state.hasError) {
        return (
          <p>An error was encountered.</p>
        );
      }

      let strings = [];
      let strCount;
      let game = PP64.romhandler.getGameVersion();
      if (game === 3)
        strCount = PP64.fs.strings3.getStringCount("en", 0); // TODO
      else
        strCount = PP64.fs.strings.getStringCount();
      for (let s = 0; s < strCount; s++) {
        strings.push(
          <StringEditWrapper strIndex={s} />
        );
      }

      return (
        <div className="stringViewerContainer">
          <p>This is an experimental strings editor, probably doesn't work yet.</p>
          {strings}
        </div>
      );
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      this.setState({ hasError: true });
      console.error(error);
    }
  }

  interface IStringEditWrapperProps {
    strIndex: number;
  }

  class StringEditWrapper extends React.Component<IStringEditWrapperProps> {
    private editor: PP64.texteditor.MPEditor | null = null;

    state = {
      hasFocus: false,
    }

    render() {
      let str;
      let game = PP64.romhandler.getGameVersion();
      if (game === 3)
        str = PP64.fs.strings3.read("en", 0, this.props.strIndex); // TODO
      else
        str = PP64.fs.strings.read(this.props.strIndex);

      return (
        <PP64.texteditor.MPEditor
          ref={(editor) => { this.editor = editor; }}
          value={str}
          displayMode={PP64.texteditor.MPEditorDisplayMode.Edit}
          showToolbar={true}
          toolbarPlacement={PP64.texteditor.MPEditorToolbarPlacement.Top}
          onValueChange={this.onValueChanged}
          onFocus={this.onFocus}
          onBlur={this.onBlur} />
      );
    }

    componentDidMount() {
      if (this.state.hasFocus)
        this.editor!.focus();
    }

    componentDidUpdate() {
      if (this.state.hasFocus)
        this.editor!.focus();
    }

    onValueChanged = (id: any, val: string) => {
      let game = PP64.romhandler.getGameVersion()!;
      if (game === 3)
        return;
      else {
        let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(PP64.fs.strings._strToBytes(val));
        PP64.fs.strings.write(this.props.strIndex, strBuffer);
      }
    }

    onFocus = () => {
      this.setState({ hasFocus: true });
    }

    onBlur = () => {
      this.setState({ hasFocus: false });
    }
  }

  class StringEditorToolbar extends React.Component {
    state = {}

    render() {
      return (
        <div className="stringEditorToolbar">

        </div>
      );
    }
  }
}
