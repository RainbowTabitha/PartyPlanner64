namespace PP64.details {
  interface IDetailsItemBase {
    type: string;
    id?: string;
    desc?: string;
    maxlines?: number;
    width?: number;
    height?: number;
  }

  const _details_mp1: IDetailsItemBase[] = [
    { type: "richtext", id: "detailBoardName", desc: "Board name", maxlines: 1 },
    { type: "richtext", id: "detailBoardDesc", desc: "Board description", maxlines: 2 },
    { type: "br" },
    { type: "image", id: "detailBoardSelectImg", desc: "Board select image", width: 128, height: 64 },
    { type: "image", id: "detailBoardLogoImg", desc: "Board logo", width: 250, height: 100 },
    { type: "audio", id: "detailBoardAudio", desc: "Background music" },
    { type: "difficulty", id: "detailBoardDifficulty", desc: "Difficulty" },
    { type: "br" },
    { type: "image", id: "detailBoardLargeSceneBg", desc: "Large scene background", width: 320, height: 240  },
    { type: "image", id: "detailBoardConversationBg", desc: "Conversation background", width: 320, height: 240  },
    { type: "image", id: "detailBoardSplashscreenBg", desc: "Splashscreen background", width: 320, height: 240  },
  ];

  const _details_mp2: IDetailsItemBase[] = [
    { type: "richtext", id: "detailBoardName", desc: "Board name", maxlines: 1 },
    { type: "richtext", id: "detailBoardDesc", desc: "Board description", maxlines: 2 },
    { type: "br" },
    { type: "image", id: "detailBoardSelectImg", desc: "Board select image", width: 64, height: 48 },
    { type: "image", id: "detailBoardSelectIcon", desc: "Board select icon", width: 32, height: 32 },
    { type: "image", id: "detailBoardLogoImg", desc: "Board logo", width: 260, height: 120 },
    { type: "audio", id: "detailBoardAudio", desc: "Background music" },
    { type: "difficulty", id: "detailBoardDifficulty", desc: "Difficulty" },
    { type: "br" },
    { type: "image", id: "detailBoardLargeSceneBg", desc: "Large scene background", width: 320, height: 240  },
  ];

  const _details_mp3: IDetailsItemBase[] = [
    { type: "richtext", id: "detailBoardName", desc: "Board name", maxlines: 1 },
    { type: "richtext", id: "detailBoardDesc", desc: "Board description", maxlines: 2 },
    { type: "br" },
    { type: "image", id: "detailBoardSelectImg", desc: "Board select image", width: 64, height: 64 },
    { type: "image", id: "detailBoardLogoImg", desc: "Board logo", width: 226, height: 120 },
    { type: "image", id: "detailBoardLogoTextImg", desc: "Board logo text", width: 226, height: 36 },
    { type: "audio", id: "detailBoardAudio", desc: "Background music" },
    { type: "difficulty", id: "detailBoardDifficulty", desc: "Difficulty" },
    { type: "br" },
    { type: "image", id: "detailBoardLargeSceneBg", desc: "Large scene background", width: 320, height: 240  },
  ];

  const _details_mp3_duel: IDetailsItemBase[] = [
    { type: "richtext", id: "detailBoardName", desc: "Board name", maxlines: 1 },
    { type: "richtext", id: "detailBoardDesc", desc: "Board description", maxlines: 2 },
    { type: "br" },
    { type: "image", id: "detailBoardSelectImg", desc: "Board select image", width: 64, height: 64 },
    { type: "image", id: "detailBoardLogoImg", desc: "Board logo", width: 226, height: 120 },
    { type: "image", id: "detailBoardLogoTextImg", desc: "Board logo text", width: 226, height: 36 },
    { type: "audio", id: "detailBoardAudio", desc: "Background music" },
    { type: "difficulty", id: "detailBoardDifficulty", desc: "Difficulty" },
  ];

  function _getGameDetails(): IDetailsItemBase[] {
    const board = PP64.boards.getCurrentBoard();
    const gameVersion = board.game;
    const boardType = board.type;
    switch (gameVersion) {
      case 1:
        return _details_mp1;
      case 2:
        return _details_mp2;
      case 3:
        switch (boardType) {
          case PP64.types.BoardType.DUEL:
            return _details_mp3_duel;
          default:
            return _details_mp3;
        }
    }
  }

  function _getValue(id: string | undefined, props: IDetailsProps) {
    switch (id) {
      case "detailBoardName":
        return props.board.name;
      case "detailBoardDesc":
        return props.board.description;
      case "detailBoardDifficulty":
        return props.board.difficulty;
      case "detailBoardSelectImg":
        return props.board.otherbg.boardselect;
      case "detailBoardSelectIcon":
        return props.board.otherbg.boardselecticon;
      case "detailBoardLogoImg":
        return props.board.otherbg.boardlogo;
      case "detailBoardLogoTextImg":
        return props.board.otherbg.boardlogotext;
      case "detailBoardAudio":
        return props.board.audioIndex;
      case "detailBoardLargeSceneBg":
        return props.board.otherbg.largescene;
      case "detailBoardConversationBg":
        return props.board.otherbg.conversation;
      case "detailBoardSplashscreenBg":
        return props.board.otherbg.splashscreen;
    }
    return "";
  }

  function _setValue(id: string, value: any, board: PP64.boards.IBoard) {
    switch (id) {
      case "detailBoardName":
        board.name = value;
        PP64.app.refresh();
        break;
      case "detailBoardDesc":
        board.description = value;
        break;
      case "detailBoardDifficulty":
        board.difficulty = value;
        break;
      case "detailBoardSelectImg":
        board.otherbg.boardselect = value;
        break;
      case "detailBoardSelectIcon":
        board.otherbg.boardselecticon = value;
        break;
      case "detailBoardLogoImg":
        board.otherbg.boardlogo = value;
        break;
      case "detailBoardLogoTextImg":
        board.otherbg.boardlogotext = value;
        break;
      case "detailBoardAudio":
        board.audioIndex = value;
        PP64.app.refresh();
        break;
      case "detailBoardLargeSceneBg":
        board.otherbg.largescene = value;
        break;
      case "detailBoardConversationBg":
        board.otherbg.conversation = value;
        break;
      case "detailBoardSplashscreenBg":
        board.otherbg.splashscreen = value;
        break;
    }
  }

  function _processImage(id: string, buffer: ArrayBuffer) {
    if (id === "detailBoardSelectImg" && PP64.boards.getCurrentBoard().game === 1) { // Apply masking
      let rgba32 = new Uint32Array(buffer);

      // Do the two full rows on each edge...
      for (let y = 0; y < 128; y++) {
        rgba32[y] = 0; // 1st row
        rgba32[y + 128] = 0; // 2nd row
        rgba32[y + (128 * 62)] = 0; // 2nd to last row
        rgba32[y + (128 * 63)] = 0; // last row
      }

      // Then round the corners
      for (let y = 0; y < 6; y++) {
        rgba32[y + (128 * 2)] = 0; // Upper left corner
        rgba32[y + (128 * 2) + 122] = 0; // Upper right corner
        rgba32[y + (128 * 61)] = 0; // Lower left corner
        rgba32[y + (128 * 61) + 122] = 0; // Lower right corner
      }
      for (let y = 0; y < 4; y++) {
        rgba32[y + (128 * 3)] = 0; // Upper left corner
        rgba32[y + (128 * 3) + 124] = 0; // Upper right corner
        rgba32[y + (128 * 60)] = 0; // Lower left corner
        rgba32[y + (128 * 60) + 124] = 0; // Lower right corner
      }
      for (let y = 0; y < 3; y++) {
        rgba32[y + (128 * 4)] = 0; // Upper left corner
        rgba32[y + (128 * 4) + 125] = 0; // Upper right corner
        rgba32[y + (128 * 59)] = 0; // Lower left corner
        rgba32[y + (128 * 59) + 125] = 0; // Lower right corner
      }
      for (let y = 0; y < 2; y++) {
        rgba32[y + (128 * 5)] = 0; // Upper left corner
        rgba32[y + (128 * 5) + 126] = 0; // Upper right corner
        rgba32[y + (128 * 58)] = 0; // Lower left corner
        rgba32[y + (128 * 58) + 126] = 0; // Lower right corner

        rgba32[y + (128 * 6)] = 0; // Upper left corner
        rgba32[y + (128 * 6) + 126] = 0; // Upper right corner
        rgba32[y + (128 * 57)] = 0; // Lower left corner
        rgba32[y + (128 * 57) + 126] = 0; // Lower right corner
      }
      rgba32[(128 * 7)] = 0; // Upper left corner
      rgba32[(128 * 7) + 127] = 0; // Upper right corner
      rgba32[(128 * 56)] = 0; // Lower left corner
      rgba32[(128 * 56) + 127] = 0; // Lower right corner

      rgba32[(128 * 8)] = 0; // Upper left corner
      rgba32[(128 * 8) + 127] = 0; // Upper right corner
      rgba32[(128 * 55)] = 0; // Lower left corner
      rgba32[(128 * 55) + 127] = 0; // Lower right corner

      // Validate that the image meets the color limits
      // Technically this is 256 colors when split into 4 tiles
      let colors: { [color: number]: boolean } = {};
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
          colors[rgba32[(y * 128) + x]] = true;
        }
      }
      let colors2: { [color: number]: boolean } = {};
      for (let y = 0; y < 32; y++) {
        for (let x = 64; x < 128; x++) {
          colors2[rgba32[(y * 128) + 64 + x]] = true;
        }
      }
      let colors3: { [color: number]: boolean } = {};
      for (let y = 32; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          colors3[rgba32[(y * 128) + x]] = true;
        }
      }
      let colors4: { [color: number]: boolean } = {};
      for (let y = 32; y < 64; y++) {
        for (let x = 64; x < 128; x++) {
          colors4[rgba32[(y * 128) + 64 + x]] = true;
        }
      }

      if (Object.keys(colors).length > 256 || Object.keys(colors2).length > 256 ||
          Object.keys(colors3).length > 256 || Object.keys(colors4).length > 256) {
        PP64.app.showMessage(`Sorry, but the palette limit for this image is 256 unique colors. For now, the image has been reduced to 8-bit, but most image editors should be able to reduce the palette for you with higher quality.`);
        PP64.utils.img.RGBA32.make8Bit(rgba32, 128, 64);
      }
    }
    return buffer;
  }

  interface IDetailsProps {
    board: PP64.boards.IBoard;
  }

  export class Details extends React.Component<IDetailsProps> {
    state = {}

    onTextChange = (id: string, event: any) => {
      _setValue(id, event.target.value, this.props.board);
      this.forceUpdate();
    }

    onRichTextChange = (id: string, value: any) => {
      _setValue(id, value, this.props.board);
      this.forceUpdate();
    }

    onValueChange = (id: string, value: any) => {
      _setValue(id, value, this.props.board);
      this.forceUpdate();
    }

    render() {
      if (!this.props.board)
        return null;
      let keyId = 0;
      let readonly = PP64.boards.boardIsROM(this.props.board);
      let formEls = _getGameDetails().map(detail => {
        let value = _getValue(detail.id, this.props);
        switch (detail.type) {
          case "text":
            return (
              <DetailsTextInput id={detail.id!} desc={detail.desc!} readonly={readonly}
                value={value} onTextChange={this.onTextChange} key={detail.id} />
            );
            break;
          case "richtext":
            const displayMode = readonly
              ? PP64.texteditor.MPEditorDisplayMode.Readonly
              : PP64.texteditor.MPEditorDisplayMode.Edit;
            return (
              <div className="detailRichTextContainer" key={detail.id}>
                <label htmlFor={detail.id}>{detail.desc}</label>
                <PP64.texteditor.MPEditor id={detail.id}
                  value={value}
                  showToolbar={!readonly}
                  displayMode={displayMode}
                  maxlines={detail.maxlines || 0}
                  itemBlacklist={["COLOR", "ADVANCED", "DARKLIGHT"]}
                  onValueChange={this.onRichTextChange} />
              </div>
            );
            break;
          case "image":
            return (
              <DetailsImage id={detail.id!} desc={detail.desc!} readonly={readonly}
                value={value} key={detail.id} onImageSelected={this.onValueChange}
                width={detail.width!} height={detail.height!} />
            );
            break;
          case "audio":
            return (
              <DetailsAudio id={detail.id!} desc={detail.desc!} readonly={readonly}
                value={value} key={detail.id} onAudioSelected={this.onValueChange} />
            );
            break;
          case "difficulty":
            return (
              <DetailsDifficulty id={detail.id!} desc={detail.desc!} readonly={readonly}
                value={value} key={detail.id} onDifficultySelected={this.onValueChange} />
            );
            break;
          case "br":
            return (
              <br key={"br" + keyId++} />
            );
            break;
        }
      });
      return (
        <div id="detailsForm">
          {formEls}
        </div>
      );
    }
  };

  interface IDetailsTextInputProps {
    id: string;
    desc: string;
    readonly: boolean;
    value: string;
    onTextChange(id: string, event: any): any;
  }

  class DetailsTextInput extends React.Component<IDetailsTextInputProps> {
    onTextChange = (event: any) => {
      this.props.onTextChange(this.props.id, event); // Pass up to parent.
    }

    render() {
      let id = this.props.id;
      let desc = this.props.desc;
      let readonly = this.props.readonly;
      return (
        <div className="detailTextContainer">
          <label htmlFor={id}>{desc}</label>
          <input id={id} type="text" placeholder={desc} value={this.props.value}
            readOnly={readonly} defaultValue="" onChange={this.onTextChange} />
        </div>
      );
    }
  };

  interface IDetailsImageProps {
    id: string;
    desc: string;
    readonly: boolean;
    width: number;
    height: number;
    value: string;
    onImageSelected(id: string, src: string): any;
  }

  class DetailsImage extends React.Component<IDetailsImageProps> {
    handleClick = () => {
      if (PP64.boards.currentBoardIsROM())
        return;

      PP64.utils.input.openFile("image/*", this.imageSelected.bind(this));
    }

    imageSelected(event: any) {
      let file = event.target.files[0];
      if (!file)
        return;

      let reader = new FileReader();
      reader.onload = e => {
        let onImageSelected = this.props.onImageSelected;
        let id = this.props.id;
        let detailImg = document.getElementById(id) as HTMLImageElement;
        let img = new Image();
        img.onload = () => { // Extra level of indirection so we can manipulate the image sometimes.
          let width = this.props.width;
          let height = this.props.height;
          let ctx = PP64.utils.canvas.createContext(width, height);
          ctx.drawImage(img, 0, 0, width, height);
          let rgba32 = ctx.getImageData(0, 0, width, height).data.buffer;
          rgba32 = _processImage(id, rgba32);

          let newSrc = PP64.utils.arrays.arrayBufferToDataURL(rgba32, width, height);
          detailImg.src = newSrc;
          onImageSelected(id, newSrc);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }

    render() {
      let id = this.props.id;
      let desc = this.props.desc;
      let width = this.props.width;
      let height = this.props.height;

      let hoverCover = null;
      if (!this.props.readonly) {
        let hoverCoverSize = `${width} × ${height}`;
        if (width > 100 && height > 50) {
          let hoverCoverMsg = "Choose a new image";
          hoverCover = (
            <div className="detailImgHoverCover">
              <span>{hoverCoverMsg}</span><br />
              <span className="detailImgHoverCoverSize">{hoverCoverSize}</span>
            </div>
          );
        }
        else {
          hoverCover = (
            <div className="detailImgHoverCover" title={hoverCoverSize}></div>
          );
        }

      }

      let imgSelectStyle = { width, height, minWidth: width, minHeight: height };
      return (
        <div className="detailImgContainer">
          <label>{desc}</label>
          <div className="detailImgSelect" style={imgSelectStyle} onClick={this.handleClick}>
            <img id={id} className="detailImg"
              height={height} width={width} style={imgSelectStyle}
              src={this.props.value} alt={desc} />
            {hoverCover}
          </div>
        </div>
      );
    }
  };

  interface IDetailsAudioProps {
    id: string;
    desc: string;
    readonly: boolean;
    value: number;
    onAudioSelected(id: string, index: number): any;
  }

  class DetailsAudio extends React.Component<IDetailsAudioProps> {
    state = {}

    onSelection = (e: any) => {
      this.props.onAudioSelected(this.props.id, parseInt(e.target.value));
    }

    render() {
      let index = 0;
      let audioNames = PP64.adapters.getAdapter(PP64.boards.getCurrentBoard().game)!.getAudioMap();
      let audioOptions = audioNames.map((song: string) => {
        let curIndex = index++;
        if (!song)
          return null;
        return (
          <option value={curIndex} key={curIndex}>{song}</option>
        );
      });

      return (
        <div className="audioDetailsContainer">
          <label>{this.props.desc}</label>
          <select className="audioSelect" value={this.props.value}
            disabled={this.props.readonly} onChange={this.onSelection}>
            {audioOptions}
          </select>
        </div>
      );
    }
  };

  interface IDetailsDifficultyProps {
    id: string;
    desc: string;
    readonly: boolean;
    value: any;
    onDifficultySelected(id: string, level: number): any;
  }

  interface IDetailsDifficultyState {
    focusedLevel: number;
  }

  class DetailsDifficulty extends React.Component<IDetailsDifficultyProps, IDetailsDifficultyState> {
    constructor(props: IDetailsDifficultyProps) {
      super(props);
      this.state = { focusedLevel: 0 };
    }

    onSelection = (level: number) => {
      if (this.props.readonly)
        return;
      this.props.onDifficultySelected(this.props.id, level);
    }

    onDifficultyFocused = (level: number) => {
      if (this.props.readonly)
        return;
      this.setState({ focusedLevel: level });
    }

    render() {
      const levels = [];
      for (let i = 1; i <= 5; i++) {
        levels.push(<DetailsDifficultyLevel
          level={i}
          key={i.toString()}
          readonly={this.props.readonly}
          currentLevel={this.props.value}
          focusedLevel={this.state.focusedLevel}
          onDifficultyLevelSelected={this.onSelection}
          onDifficultyFocused={this.onDifficultyFocused} />
        );
      }

      return (
        <div className="difficultyDetailsContainer">
          <label>{this.props.desc}</label>
          <div className="difficultyDetailsLevels">
            {levels}
          </div>
        </div>
      );
    }
  };

  interface IDetailsDifficultyLevelProps {
    level: number;
    currentLevel: number;
    focusedLevel: number;
    readonly: boolean;
    onDifficultyLevelSelected(level: number): any;
    onDifficultyFocused(level: number): any;
  }

  class DetailsDifficultyLevel extends React.Component<IDetailsDifficultyLevelProps> {
    state = {}

    onClick = () => {
      if (this.props.readonly)
        return;
      this.props.onDifficultyLevelSelected(this.props.level);
    }

    onMouseEnter = () => {
      if (this.props.readonly)
        return;
      this.props.onDifficultyFocused(this.props.level);
    }

    onMouseLeave = () => {
      if (this.props.readonly)
        return;
      this.props.onDifficultyFocused(0);
    }

    render() {
      let className = "difficultyDetailsLevel";
      if (!this.props.readonly) {
        if (this.props.level <= this.props.currentLevel)
          className += " difficultyLevelCurrent";
        if (this.props.focusedLevel > 0 && this.props.level <= this.props.focusedLevel)
          className += " difficultyLevelFocused";
      }
      return (
        <div className={className} onClick={this.onClick}
          onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}></div>
      );
    }
  };
}