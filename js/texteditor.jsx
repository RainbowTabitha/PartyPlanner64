// Rich text editor for strings in Mario Party.
PP64.texteditor = (function() {
  const {Editor, EditorState, ContentState, Modifier, RichUtils, Entity, CompositeDecorator} = Draft;

  class MPEditor extends React.Component {
    constructor(props) {
      super(props);
      this.focus = () => this.refs.editor.focus();

      let editorState;
      if (props.value) {
        editorState = EditorState.createWithContent(ContentState.createFromText(props.value), MPCompositeDecorator);
      }
      else {
        editorState = EditorState.createEmpty();
      }
      this.state = {editorState};
    }

    componentWillReceiveProps = (nextProps) => {
      const oldValue = MPEditorStringAdapter.editorStateToString(this.state.editorState);
      if (oldValue !== nextProps.value) {
        let editorState = EditorState.createWithContent(ContentState.createFromText(nextProps.value), MPCompositeDecorator);
        this.setState({editorState});
      }
    }

    // shouldComponentUpdate = (nextProps, nextState) => {
    //   return nextProps.value !== this.props.value;
    // }

    onChange = editorState => {
      if (this.props.maxlines) {
        let text = editorState.getCurrentContent().getPlainText();
        if (text.split("\n").length > this.props.maxlines)
          return;
      }

      this.setState({editorState});
      this.setState((prevState, props) => {
        if (props.onValueChange)
          props.onValueChange(props.id, MPEditorStringAdapter.editorStateToString(prevState.editorState));
      });
    }

    onToolbarClick = key => {
      let item = _getToolbarItem(key);
      switch (item.type) {
        case "COLOR":
          this.toggleColor(key);
          break;
        case "IMAGE":
          this.addImage(key);
          break;
      }
    }

    toggleColor = toggledColor => {
      const {editorState} = this.state;
      const selection = editorState.getSelection();

      // Let's just allow one color at a time. Turn off all active colors.
      const nextContentState = Object.keys(colorStyleMap).reduce((contentState, color) => {
        return Modifier.removeInlineStyle(contentState, selection, color)
      }, editorState.getCurrentContent());

      let nextEditorState = EditorState.push(
        editorState,
        nextContentState,
        'change-inline-style'
      );

      const currentStyle = editorState.getCurrentInlineStyle();

      // Unset style override for current color.
      if (selection.isCollapsed()) {
        nextEditorState = currentStyle.reduce((state, color) => {
          return RichUtils.toggleInlineStyle(state, color);
        }, nextEditorState);
      }

      // If the color is being toggled on, apply it.
      if (!currentStyle.has(toggledColor)) {
        nextEditorState = RichUtils.toggleInlineStyle(
          nextEditorState,
          toggledColor
        );
      }

      this.onChange(nextEditorState);
    }

    addImage = key => {
      const {editorState} = this.state;
      const selection = editorState.getSelection();

      // Let's just allow one color at a time. Turn off all active colors.
      const nextContentState = Modifier.replaceText(
        editorState.getCurrentContent(),
        selection,
        _ToolbarKeyToChar[key]
      );

      let nextEditorState = EditorState.push(
        editorState,
        nextContentState,
        "insert-characters"
      );

      this.onChange(nextEditorState);
    }

    render() {
      const {editorState} = this.state;
      const displayMode = this.props.displayMode || MPEditorDisplayMode.Edit;

      let toolbar;
      let readonly = displayMode !== MPEditorDisplayMode.Edit || this.props.readonly;
      if (!readonly && false) { // FIXME: Make toolbar better
        toolbar = (
          <MPEditorToolbar onItemClick={this.onToolbarClick} />
        );
      }

      let className = "mpEditor";
      if (displayMode === MPEditorDisplayMode.Display)
        className += " mpDisplay";
      if (displayMode === MPEditorDisplayMode.Readonly || this.props.readonly || true) // FIXME
        className += " mpReadonly";

      return (
        <div className={className}>
          {toolbar}
          <div className="mpEditorWrapper">
            <Editor ref="editor"
              editorState={editorState}
              readOnly={readonly}
              customStyleMap={colorStyleMap}
              onChange={this.onChange} />
          </div>
        </div>
      );
    }
  };

  function imageStrategy(contentBlock, callback) {
    const text = contentBlock.getText();
    for (let i = 0; i < text.length; i++) {
      if (_ToolbarCharToKey[text.charAt(i)])
        callback(i, i + 1);
    }
  }

  const MPImageComponent = (props) => {
    let ch = props.children[0].props.text; // 1337 draft.js h4x
    let className = "mpImage";
    let key = _ToolbarCharToKey[ch];
    className += " mpImageKey-" + key;
    return (
      <span {...props} className={className}>
        <span className="mpImageTextWrapper">{props.children}</span>
      </span>
    );
  };

  const MPCompositeDecorator = new CompositeDecorator([
    {
      strategy: imageStrategy,
      component: MPImageComponent,
    }
  ]);

  const colorStyleMap = {
    DEFAULT: {
      color: "#200E71",
    },
    WHITE: {
      color: '#FFFFFF',
    },
    RED: {
      color: '#E70014',
    },
    GREEN: {
      color: '#00AB29',
    },
    BLUE: {
      color: "#003EF9",
    },
    YELLOW: {
      color: '#FFEA38',
    },
  };

  const _ToolbarItems = [
    // { key: "DEFAULT", type: "COLOR", icon: "img/richtext/default.png", desc: "Default" },
    // { key: "WHITE", type: "COLOR", icon: "img/richtext/white.png", desc: "White" },
    // { key: "RED", type: "COLOR", icon: "img/richtext/red.png", desc: "Red" },
    // { key: "GREEN", type: "COLOR", icon: "img/richtext/green.png", desc: "Green" },
    // { key: "BLUE", type: "COLOR", icon: "img/richtext/blue.png", desc: "Blue" },
    // { key: "YELLOW", type: "COLOR", icon: "img/richtext/yellow.png", desc: "Yellow" },
    // { type: "SEP" },
    { key: "A", type: "IMAGE", icon: "img/richtext/A.png", desc: "A button", "char": "\u3000" },
    { key: "B", type: "IMAGE", icon: "img/richtext/B.png", desc: "B button", "char": "\u3001" },
    { key: "S", type: "IMAGE", icon: "img/richtext/S.png", desc: "Start button", "char": "\u3010" },
    { key: "CUP", type: "IMAGE", icon: "img/richtext/Cup.png", desc: "C-up button", "char": "\u3002" },
    { key: "CDOWN", type: "IMAGE", icon: "img/richtext/Cdown.png", desc: "C-down button", "char": "\u3005" },
    { key: "CLEFT", type: "IMAGE", icon: "img/richtext/Cleft.png", desc: "C-left button", "char": "\u3004" },
    { key: "CRIGHT", type: "IMAGE", icon: "img/richtext/Cright.png", desc: "C-right button", "char": "\u3003" },
    { key: "Z", type: "IMAGE", icon: "img/richtext/Z.png", desc: "Z button", "char": "\u3006" },
    { key: "R", type: "IMAGE", icon: "img/richtext/R.png", desc: "R button", "char": "\u3011" },
    { key: "ANALOG", type: "IMAGE", icon: "img/richtext/analog.png", desc: "Analog stick", "char": "\u3007" },
    { key: "COIN", type: "IMAGE", icon: "img/richtext/coin.png", desc: "Coin", "char": "\u3008" },
    { key: "STAR", type: "IMAGE", icon: "img/richtext/star.png", desc: "Star", "char": "\u3009" },
    // { key: "PAUSE", type: "IMAGE", icon: "img/richtext/pause.png", desc: "Pause to continue", "char": "\u3015" },
    // { key: "FEED", type: "IMAGE", icon: "img/richtext/feed.png", desc: "Feed new page", "char": "\u3014" },
  ];

  function _getToolbarItem(key) {
    return _ToolbarItems.filter(item => item.key === key)[0];
  }

  let _ToolbarCharToKey = {};
  let _ToolbarKeyToChar = {};
  _ToolbarItems.forEach(item => {
    if (item.char) {
      _ToolbarCharToKey[item["char"]] = item.key;
      _ToolbarKeyToChar[item.key] = item["char"];
    }
  });

  class MPEditorToolbar extends React.Component {
    state = {}

    render() {
      let keyint = 0;
      let items = _ToolbarItems.map(item => {
        if (item.type === "SEP") {
          return (
            <MPEditorToolbarSeparator key={"key" + keyint++} />
          );
        }

        return (
          <MPEditorToolbarButton key={item.key} id={item.key} title={item.desc}
            src={item.icon} onClick={this.props.onItemClick} />
        );
      });
      return (
        <div className="mpEditorToolbar">
          {items}
        </div>
      );
    }
  };

  class MPEditorToolbarButton extends React.Component {
    state = {}

    onClick = () => {
      this.props.onClick(this.props.id);
    }

    render() {
      return (
        <div className="mpEditorToolbarButton" title={this.props.title} onClick={this.onClick}>
          <img src={this.props.src} alt={this.props.title}></img>
        </div>
      );
    }
  };

  class MPEditorToolbarSeparator extends React.Component {
    state = {}

    render() {
      return (
        <div className="mpEditorToolbarSeparator"></div>
      );
    }
  };

  const MPEditorStringAdapter = new class MPEditorStringAdapter {
    editorStateToString(editorState) {
      let contentState = editorState.getCurrentContent();
      return contentState.getPlainText();
    }

    stringToEditorState(str) {
      EditorState.createWithContent(ContentState.createFromText(str), MPCompositeDecorator);
    }
  }

  const MPEditorDisplayMode = {
    Edit: 0,
    Readonly: 1,
    Display: 2,
  };

  return {
    MPEditor,
    MPCompositeDecorator,
    MPEditorStringAdapter,
    MPEditorDisplayMode
  };
})();
