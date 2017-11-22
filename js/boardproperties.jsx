PP64.ns("properties");

PP64.properties.BoardProperties = (function() {

  const BoardProperties = class BoardProperties extends React.Component {
    state = { }

    render() {
      let gameVersion = this.props.currentBoard.game;
      let romBoard = PP64.boards.currentBoardIsROM();

      let animationBGList;
      if (gameVersion === 2) {
        animationBGList = (
          <AnimationBGList board={this.props.currentBoard} />
        )
      }

      return (
        <div className="properties">
          <EditDetails romBoard={romBoard} />
          <BGSelect />
          {animationBGList}
        </div>
      );
    }
  };

  const BGSelect = class BGSelect extends React.Component {
    state = { }

    onChangeBg = () => {
      PP64.utils.input.openFile("image/*", this.bgSelected);
    }

    bgSelected = (event) => {
      let file = event.target.files[0];
      if (!file)
        return;

      let reader = new FileReader();
      reader.onload = error => {
        PP64.boards.setBG(reader.result);
        PP64.renderer.render();
      };
      reader.readAsDataURL(file);
    }

    render() {
      return (
        <div className="propertiesActionButton" onClick={this.onChangeBg}>
          <img src="img/header/setbg.png" className="propertiesActionButtonImg" width="24" height="24" />
          <span className="propertiesActionButtonSpan">Change main background</span>
        </div>
      );
    }
  };

  const EditDetails = class EditDetails extends React.Component {
    state = { }

    onEditDetails() {
      PP64.app.changeView($viewType.DETAILS);
    }

    render() {
      let text = this.props.romBoard ? "View board details" : "Edit board details";
      return (
        <div className="propertiesActionButton" onClick={this.onEditDetails}>
          <img src="img/header/editdetails.png" className="propertiesActionButtonImg" width="24" height="24" />
          <span className="propertiesActionButtonSpan">{text}</span>
        </div>
      );
    }
  };

  const AnimationBGList = class AnimationBGList extends React.Component {
    state = { }

    onAnimBgsChanged = () => {
      this.forceUpdate();
    }

    render() {
      let bgs = this.props.board.animbg || [];
      let i = 0;
      let entries = bgs.map(bg => {
        i++;
        return (
          <AnimationBGEntry bg={bg} text={"Frame " + i} key={i} index={i-1}
            onAnimBgsChanged={this.onAnimBgsChanged} />
        );
      });

      let playButton;
      if (bgs.length) {
        playButton = (
          <AnimationPlayButton />
        );
      }

      return (
        <div className="propertiesAnimationBGList">
          <span className="propertySectionTitle">
            Animation Backgrounds
            {playButton}
          </span>
          {entries}
          <AnimationBGAddButton onAnimBgsChanged={this.onAnimBgsChanged} />
        </div>
      );
    }
  };

  const AnimationBGEntry = class AnimationBGEntry extends React.Component {
    state = { }

    onMouseDown = () => {
      if (!PP64.renderer.animationPlaying())
        PP64.renderer.external.setBGImage(this.props.bg);
    }

    restoreMainBG = () => {
      if (!PP64.renderer.animationPlaying())
        PP64.renderer.renderBG();
    }

    onRemove = () => {
      PP64.boards.removeAnimBG(this.props.index);
      this.props.onAnimBgsChanged();
    }

    render() {
      return (
        <div className="propertiesActionButton" onMouseDown={this.onMouseDown} onMouseUp={this.restoreMainBG} onMouseOut={this.restoreMainBG}>
          <img src={this.props.bg} className="propertiesActionButtonImg" width="24" height="24" />
          <span className="propertiesActionButtonSpan">{this.props.text}</span>
          <div role="button" className="animBGEntryDelete" onClick={this.onRemove}
            title="Remove this animation frame">✖</div>
        </div>
      );
    }
  };

  const AnimationBGAddButton = class AnimationBGAddButton extends React.Component {
    state = { }

    onAddAnimBg = () => {
      PP64.utils.input.openFile("image/*", this.bgSelected);
    }

    bgSelected = (event) => {
      let file = event.target.files[0];
      if (!file)
        return;

      let reader = new FileReader();
      reader.onload = error => {
        PP64.boards.addAnimBG(reader.result);
        this.props.onAnimBgsChanged();
      };
      reader.readAsDataURL(file);
    }

    render() {
      return (
        <div className="propertiesActionButton" onClick={this.onAddAnimBg}>
          <img src="img/toolbar/animadd.png" className="propertiesActionButtonImg" width="24" height="24" />
          <span className="propertiesActionButtonSpan">Add background</span>
        </div>
      );
    }
  };

  const AnimationPlayButton = class AnimationPlayButton extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        playing: PP64.renderer.animationPlaying()
      }
    }

    render() {
      let icon = this.state.playing ? "▮▮" : "►";
      return (
        <div className="animPlayBtn" onClick={this.onClick}>{icon}</div>
      );
    }

    onClick = () => {
      this.setState({ playing: !this.state.playing });

      if (!this.state.playing)
        PP64.renderer.playAnimation();
      else
        PP64.renderer.stopAnimation();
    }

    componentWillUnmount() {
      PP64.renderer.stopAnimation();
    }
  };

  return BoardProperties;
})();
