PP64.ns("strings");

PP64.strings = Object.assign((function() {
  const StringsViewer = class StringsViewer extends React.Component {
    constructor(props) {
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
          {strings}
        </div>
      );
    }

    componentDidCatch(error, info) {
      this.setState({ hasError: true });
      console.error(error);
    }
  }

  const StringEditWrapper = class StringEditWrapper extends React.Component {
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
        this.editor.focus();
    }

    componentDidUpdate() {
      if (this.state.hasFocus)
        this.editor.focus();
    }

    onValueChanged = (id, val) => {
      // let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(PP64.fs.strings._strToBytes(val));
      // PP64.fs.strings.write(index, strBuffer);
    }

    onFocus = event => {
      this.setState({ hasFocus: true });
    }

    onBlur = event => {
      this.setState({ hasFocus: false });
    }
  }

  const StringEditorToolbar = class StringEditorToolbar extends React.Component {
    state = {}

    render() {
      return (
        <div className="stringEditorToolbar">

        </div>
      );
    }
  }

  return {
    StringsViewer,
  };
})());