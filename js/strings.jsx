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

      let strCount = PP64.fs.strings.getStringCount();
      for (let s = 0; s < strCount; s++) {
        let str = PP64.fs.strings.read(s);
        strings.push(<PP64.texteditor.MPEditor
          value={str}
          onValueChange={(id, val) => {
            // let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(PP64.fs.strings._strToBytes(val));
            // PP64.fs.strings.write(index, strBuffer);
          }} />
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