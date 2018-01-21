// Rich text editor for strings in Mario Party.
PP64.texteditor = (function() {
  const {Editor, EditorState, ContentState, SelectionState, Modifier, RichUtils, Entity, CompositeDecorator} = Draft;

  class MPEditor extends React.Component {
    constructor(props) {
      super(props);

      let editorState;
      if (props.value) {
        editorState = MPEditorStringAdapter.stringToEditorState(props.value);
      }
      else {
        editorState = EditorState.createEmpty();
      }
      this.state = {editorState};
    }

    componentWillReceiveProps = (nextProps) => {
      const oldValue = MPEditorStringAdapter.editorStateToString(this.state.editorState);
      if (oldValue !== nextProps.value) {
        const newEditorState = MPEditorStringAdapter.stringToEditorState(nextProps.value);
        this.setState({ editorState: newEditorState });
      }
    }

    render() {
      const {editorState} = this.state;
      const displayMode = this.props.displayMode || MPEditorDisplayMode.Edit;

      let toolbar;
      const showToolbar = this.props.showToolbar;
      if (showToolbar && displayMode === MPEditorDisplayMode.Edit) {
        toolbar = (
          <MPEditorToolbar onItemClick={this.onToolbarClick} />
        );
      }

      const toolbarPlacement = this.props.toolbarPlacement || MPEditorToolbarPlacement.Top;

      let className = "mpEditor";
      if (displayMode === MPEditorDisplayMode.Display)
        className += " mpDisplay";
      if (toolbar) {
        if (toolbarPlacement === MPEditorToolbarPlacement.Bottom)
          className += " mpEditorShowToolbarBottom";
        else
          className += " mpEditorShowToolbarTop";
      }

      return (
        <div className={className}>
          {toolbarPlacement === MPEditorToolbarPlacement.Top && toolbar}
          <div className="mpEditorWrapper">
            <Editor ref="editor"
              editorState={editorState}
              stripPastedStyles={true}
              readOnly={displayMode !== MPEditorDisplayMode.Edit}
              customStyleMap={colorStyleMap}
              onChange={this.onChange}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              handleReturn={this.handleReturn} />
          </div>
          {toolbarPlacement === MPEditorToolbarPlacement.Bottom && toolbar}
        </div>
      );
    }

    focus = () => {
      this.refs.editor.focus();
    }

    onChange = editorState => {
      this.setState({editorState});
      this.setState((prevState, props) => {
        if (props.onValueChange)
          props.onValueChange(props.id, MPEditorStringAdapter.editorStateToString(prevState.editorState));
      });
    }

    handleReturn = (e, editorState) => {
      if (this.props.maxlines) {
        let text = editorState.getCurrentContent().getPlainText();

        // = because Return would create an additional line
        if (text.split("\n").length >= this.props.maxlines)
          return "handled";
      }

      return "not-handled";
    }

    onFocus = event => {
      if (this.props.onFocus)
        this.props.onFocus(event);
    }

    onBlur = event => {
      if (this.props.onBlur)
        this.props.onBlur(event);
    }

    onToolbarClick = item => {
      switch (item.type) {
        case "COLOR":
          this.toggleColor(item.key);
          break;
        case "IMAGE":
          this.addImage(item.char);
          break;
      }

      setTimeout(() => {
        this.focus();
      }, 0);
    }

    toggleColor = toggledColor => {
      const {editorState} = this.state;
      const selection = editorState.getSelection();
      const prevContentState = editorState.getCurrentContent();

      // Let's just allow one color at a time. Turn off all active colors.
      const nextContentState = Object.keys(colorStyleMap).reduce((contentState, color) => {
        return Modifier.removeInlineStyle(contentState, selection, color)
      }, prevContentState);

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

    addImage = char => {
      const {editorState} = this.state;
      const selection = editorState.getSelection();

      // Insert a character that will be styled into an image.
      const nextContentState = Modifier.replaceText(
        editorState.getCurrentContent(),
        selection,
        char
      );

      let nextEditorState = EditorState.push(
        editorState,
        nextContentState,
        "insert-characters"
      );

      this.onChange(nextEditorState);
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
    PURPLE: {
      color: "#E847CD",
    },
    YELLOW: {
      color: '#FFEA38',
    },
  };

  const _ToolbarItems = [
    { key: "COLOR", type: "SUBMENU", icon: "img/richtext/default.png", desc: "Font color",
      items: [
        { key: "DEFAULT", type: "COLOR", icon: "img/richtext/default.png", desc: "Default" },
        { key: "WHITE", type: "COLOR", icon: "img/richtext/white.png", desc: "White" },
        { key: "RED", type: "COLOR", icon: "img/richtext/red.png", desc: "Red" },
        { key: "GREEN", type: "COLOR", icon: "img/richtext/green.png", desc: "Green" },
        { key: "BLUE", type: "COLOR", icon: "img/richtext/blue.png", desc: "Blue" },
        { key: "PURPLE", type: "COLOR", icon: "img/richtext/purple.png", desc: "Purple" },
        { key: "YELLOW", type: "COLOR", icon: "img/richtext/yellow.png", desc: "Yellow" },
      ],
    },
    { key: "IMAGE", type: "SUBMENU", icon: "img/richtext/A.png", desc: "Insert image",
      items: [
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
      ],
    },
    // { key: "PAUSE", type: "IMAGE", icon: "img/richtext/pause.png", desc: "Pause to continue", "char": "\u3015" },
    // { key: "FEED", type: "IMAGE", icon: "img/richtext/feed.png", desc: "Feed new page", "char": "\u3014" },
  ];

  function _getToolbarItem(key) {
    return _ToolbarItems.filter(item => item.key === key)[0];
  }

  let _ToolbarCharToKey = {};
  let _ToolbarKeyToChar = {};
  _ToolbarItems.forEach(_populateItemMaps);
  function _populateItemMaps(item) {
    if (item.items) {
      item.items.forEach(_populateItemMaps);
    }
    if (item.char) {
      _ToolbarCharToKey[item["char"]] = item.key;
      _ToolbarKeyToChar[item.key] = item["char"];
    }
  }

  function _toolbarItemToComponent(item) {
    // if (item.type === "SEP") {
    //   return (
    //     <MPEditorToolbarSeparator key={key} />
    //   );
    // }

    switch (item.type) {
      case "SUBMENU":
        return (
          <MPEditorToolbarSubmenu key={item.key}
            item={item}
            onItemClick={this.onItemClick}
            items={item.items} />
        );

      default:
        return (
          <MPEditorToolbarButton key={item.key}
            item={item}
            onItemClick={this.onItemClick} />
        );
    }
  }

  class MPEditorToolbar extends React.Component {
    state = {}

    render() {
      let keyint = 0;
      let items = _ToolbarItems.map(_toolbarItemToComponent.bind(this));
      return (
        <div className="mpEditorToolbar">
          {items}
        </div>
      );
    }

    onItemClick = item => {
      if (this.props.onItemClick)
        this.props.onItemClick(item);
    }
  };

  class MPEditorToolbarSubmenu extends React.Component {
    state = {
      expanded: false,
    }

    render() {
      const item = this.props.item;

      let expansion;
      if (this.state.expanded) {
        const submenuItems = this.props.items.map(_toolbarItemToComponent.bind(this));
        expansion = (
          <div ref={(expMenu => { this.expMenu = expMenu; })}
            className="mpEditorToolbarSubmenuExp"
            tabIndex={-1}
            onBlur={this.onBlur}>
            {submenuItems}
          </div>
        );
      }
      return (
        <div className="mpEditorToolbarButton" title={item.desc} onClick={this.onClick}>
          <img src={item.icon} alt={item.desc}></img>
          <img src={"img/richtext/divot.png"}></img>
          {expansion}
        </div>
      );
    }

    componentDidMount() {
      if (this.state.expanded)
        this.expMenu.focus();
    }

    componentDidUpdate() {
      if (this.state.expanded)
        this.expMenu.focus();
    }

    onBlur = () => {
      this.setState({ expanded: false });
    }

    onClick = () => {
      this.setState({ expanded: !this.state.expanded });
    }

    onItemClick = item => {
      if (this.props.onItemClick)
        this.props.onItemClick(item);
    }
  };

  class MPEditorToolbarButton extends React.Component {
    state = {}

    onClick = () => {
      this.props.onItemClick(this.props.item);
    }

    render() {
      const item = this.props.item;
      return (
        <div className="mpEditorToolbarButton" title={item.desc} onClick={this.onClick}>
          <img src={item.icon} alt={item.desc}></img>
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

  /**
   * Converts between game strings and Draft.js editor state.
   */
  const MPEditorStringAdapter = new class MPEditorStringAdapter {
    editorStateToString(editorState) {
      let contentState = editorState.getCurrentContent();
      return contentState.getPlainText();
    }

    stringToEditorState(str) {
      let contentState = ContentState.createFromText(str);

      // Go through each block (line) and convert color tags to Draft.js inline styles.
      let contentBlocks = contentState.getBlocksAsArray();
      for (let i = 0; i < contentBlocks.length; i++) {
        let contentBlock = contentBlocks[i];
        let text = contentBlock.getText();

        let [styleTag, tagStartIndex, tagEndIndex] = _getNextStyleTag(text);
        while (styleTag) {
          // Create a "selection" around the <tag>
          let contentBlockKey = contentBlock.getKey();
          let selection = SelectionState.createEmpty(contentBlock.getKey());
          selection = selection.merge({
            anchorOffset: tagStartIndex,
            focusKey: contentBlockKey,
            focusOffset: tagEndIndex,
          });

          // Remove the <tag>
          contentState = Modifier.replaceText(contentState, selection, "");
          contentBlocks = contentState.getBlocksAsArray();
          contentBlock = contentBlocks[i];
          text = contentBlock.getText();

          // Make the "selection" go to the end of the entire string
          const lastContentBlock = contentBlocks[contentBlocks.length - 1];
          selection = selection.merge({
            focusKey: lastContentBlock.getKey(),
            focusOffset: lastContentBlock.getText().length,
          });

          // Remove any pre-existing colors from the tag index to end of string.
          contentState = Object.keys(colorStyleMap).reduce((contentState, color) => {
            return Modifier.removeInlineStyle(contentState, selection, color)
          }, contentState);

          // Apply the new tag.
          contentState = Modifier.applyInlineStyle(contentState, selection, styleTag);

          contentBlocks = contentState.getBlocksAsArray();
          contentBlock = contentBlocks[i];
          text = contentBlock.getText();
          [styleTag, tagStartIndex, tagEndIndex] = _getNextStyleTag(text);
        }
      }

      return EditorState.createWithContent(contentState, MPCompositeDecorator);
    }
  }

  function _getNextStyleTag(rawString) {
    let startingIndex = 0;
    while (startingIndex < rawString.length) {
      let styleStart = rawString.indexOf("<", startingIndex) + 1;
      if (!styleStart) // indexOf yielded -1
        return [];

      let styleEnd = rawString.indexOf(">", styleStart);
      if (styleEnd === -1)
        return [];

      const styleTag = rawString.substring(styleStart, styleEnd);
      if (!colorStyleMap[styleTag]) {
        // Could be something like "<<BLUE>"
        startingIndex = styleStart;
        continue;
      }

      return [styleTag, styleStart - 1, styleEnd + 1];
    }

    return [];
  }

  const MPEditorDisplayMode = {
    Edit: 0,
    Readonly: 1,
    Display: 2,
  };

  const MPEditorToolbarPlacement = {
    Top: 0,
    Bottom: 1,
  };

  return {
    MPEditor,
    MPCompositeDecorator,
    MPEditorStringAdapter,
    MPEditorDisplayMode,
    MPEditorToolbarPlacement,
  };
})();
