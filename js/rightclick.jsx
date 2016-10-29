PP64.rightclick = (function() {
  let _globalHandler;

  const RightClickMenu = class RightClickMenu extends React.Component {
    state = {}

    componentDidMount() {
      //console.log("RightClickMenu.componentDidMount");
      _globalHandler = this.globalClickHandler.bind(this);
      document.addEventListener("click", _globalHandler);
    }

    componentWillUnmount() {
      //console.log("RightClickMenu.componentWillUnmount");
      document.removeEventListener("click", _globalHandler);
      _globalHandler = null;
    }

    globalClickHandler = event => {
      // console.log("globalClickHandler", event);

      // If we click inside the menu, don't close obviously.
      // But also let the canvas handlers decide what happens if they are clicked.
      if (this.elementIsWithin(event.target) || event.target.tagName.toUpperCase() === "CANVAS")
        return;
      PP64.renderer.updateRightClickMenu(null);
    }

    handleClick = event => {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }

    onContextMenu = event => {
      event.preventDefault(); // No right click on right click menu.
    }

    onTypeChanged = (type, subtype) => {
      if (type !== undefined)
        this.props.space.type = type;
      if (subtype !== undefined)
        this.props.space.subtype = subtype;
      else
        delete this.props.space.subtype;
      PP64.renderer.render();
      this.forceUpdate();
    }

    getPlacement(space) {
      let x = (!isNaN(this.state.oldX) ? this.state.oldX : space.x) - 8;
      let y = (!isNaN(this.state.oldY) ? this.state.oldY : space.y) + 15;
      return "translateX(" + x + "px) translateY(" + y + "px)";
    }

    elementIsWithin(el) {
      if (!el || !this.refs || !this.refs.rcMenu)
        return true;
      return this.refs.rcMenu.contains(el);
    }

    onChangeX = event => {
      let newX = parseInt(event.target.value, 10);
      let isBlank = event.target.value === "";
      let curBgWidth = PP64.boards.getCurrentBoard().bg.width;
      if ((!isBlank && isNaN(newX)) || newX < 0 || newX > curBgWidth)
        return;
      if (!this.state.oldX)
        this.setState({ oldX: this.props.space.x });
      this.props.space.x = isBlank ? "" : newX;
      this.forceUpdate();
    }

    onChangeY = event => {
      let newY = parseInt(event.target.value, 10);
      let isBlank = event.target.value === "";
      let curBgHeight = PP64.boards.getCurrentBoard().bg.height;
      if ((!isBlank && isNaN(newY)) || newY < 0 || newY > curBgHeight)
        return;
      if (!this.state.oldY)
        this.setState({ oldY: this.props.space.y });
      this.props.space.y = isBlank ? "" : newY;
      this.forceUpdate();
    }

    onCoordSet = event => {
      this.props.space.x = this.props.space.x || 0;
      this.props.space.y = this.props.space.y || 0;
      PP64.renderer.render();
      this.setState({ oldX: undefined, oldY: undefined });
      this.forceUpdate();
    }

    onKeyUp = event => {
      if (event.key === "Enter")
        this.onCoordSet();
    }

    render() {
      let space = this.props.space;
      if (!space)
        return null;

      let style = { transform: this.getPlacement(space) };
      return (
        <div ref="rcMenu" className="rcMenu" style={style} onClick={this.handleClick} onContextMenu={this.onContextMenu}>
          &nbsp;&nbsp;<span>X:</span>
          <input type="text" value={space.x} onChange={this.onChangeX}
            onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
          <span>Y:</span>
          <input type="text" value={space.y} onChange={this.onChangeY}
            onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
          <RCSpaceTypeToggle type={space.type} subtype={space.subtype} typeChanged={this.onTypeChanged} />
        </div>
      );
    }
  };

  const RCSpaceTypeToggleTypes_1 = [
    { name: "Change to blue space", icon: "img/toolbar/blue.png", type: $spaceType.BLUE },
    { name: "Change to red space", icon: "img/toolbar/red.png", type: $spaceType.RED },
    { name: "Change to happening space", icon: "img/toolbar/happening.png", type: $spaceType.HAPPENING },
    { name: "Change to chance time space", icon: "img/toolbar/chance.png", type: $spaceType.CHANCE },
    { name: "Change to minigame space", icon: "img/toolbar/minigame.png", type: $spaceType.MINIGAME },
    { name: "Change to shroom space", icon: "img/toolbar/shroom.png", type: $spaceType.SHROOM },
    { name: "Change to Bowser space", icon: "img/toolbar/bowser.png", type: $spaceType.BOWSER },
    { name: "Change to invisible space", icon: "img/toolbar/other.png", type: $spaceType.OTHER },
    { name: "Change to star space", icon: "img/toolbar/star.png", type: $spaceType.STAR, advanced: true },
    { name: "Change to start space", icon: "img/toolbar/start.png", type: $spaceType.START, advanced: true },
  ];
  const RCSpaceTypeToggleSubTypes_1 = [
    { name: "Show Toad", icon: "img/toolbar/toad.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show Bowser", icon: "img/toolbar/bowsercharacter.png", subtype: $spaceSubType.BOWSER },
    { name: "Show Koopa Troopa", icon: "img/toolbar/koopa.png", subtype: $spaceSubType.KOOPA },
  ];

  const RCSpaceTypeToggleTypes_2 = [
    { name: "Change to blue space", icon: "img/toolbar/blue.png", type: $spaceType.BLUE },
    { name: "Change to red space", icon: "img/toolbar/red.png", type: $spaceType.RED },
    { name: "Change to happening space", icon: "img/toolbar/happening.png", type: $spaceType.HAPPENING },
    { name: "Change to chance time space", icon: "img/toolbar/chance2.png", type: $spaceType.CHANCE },
    { name: "Change to Bowser space", icon: "img/toolbar/bowser.png", type: $spaceType.BOWSER },
    { name: "Change to item space", icon: "img/toolbar/item.png", type: $spaceType.ITEM },
    { name: "Change to battle space", icon: "img/toolbar/battle.png", type: $spaceType.BATTLE },
    { name: "Change to bank space", icon: "img/toolbar/bank.png", type: $spaceType.BANK },
    { name: "Change to invisible space", icon: "img/toolbar/other.png", type: $spaceType.OTHER },
    { name: "Change to star space", icon: "img/toolbar/star.png", type: $spaceType.STAR, advanced: true },
    { name: "Change to black star space", icon: "img/toolbar/blackstar.png", type: $spaceType.BLACKSTAR, advanced: true },
    { name: "Change to start space", icon: "img/toolbar/start.png", type: $spaceType.START, advanced: true },
    { name: "Change to arrow space", icon: "img/toolbar/arrow.png", type: $spaceType.ARROW, advanced: true },
  ];
  const RCSpaceTypeToggleSubTypes_2 = [
    { name: "Show Toad", icon: "img/toolbar/toad.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show bank", icon: "img/toolbar/banksubtype2.png", subtype: $spaceSubType.BANK },
    { name: "Show bank coin stack", icon: "img/toolbar/bankcoinsubtype.png", subtype: $spaceSubType.BANKCOIN },
    { name: "Show item shop", icon: "img/toolbar/itemshopsubtype2.png", subtype: $spaceSubType.ITEMSHOP },
  ];

  const RCSpaceTypeToggleTypes_3 = [
    { name: "Change to blue space", icon: "img/toolbar/blue3.png", type: $spaceType.BLUE },
    { name: "Change to red space", icon: "img/toolbar/red3.png", type: $spaceType.RED },
    { name: "Change to happening space", icon: "img/toolbar/happening3.png", type: $spaceType.HAPPENING },
    { name: "Change to chance time space", icon: "img/toolbar/chance3.png", type: $spaceType.CHANCE },
    { name: "Change to Bowser space", icon: "img/toolbar/bowser3.png", type: $spaceType.BOWSER },
    { name: "Change to item space", icon: "img/toolbar/item3.png", type: $spaceType.ITEM },
    { name: "Change to battle space", icon: "img/toolbar/battle3.png", type: $spaceType.BATTLE },
    { name: "Change to bank space", icon: "img/toolbar/bank3.png", type: $spaceType.BANK },
    { name: "Change to Game Guy space", icon: "img/toolbar/gameguy.png", type: $spaceType.GAMEGUY },
    { name: "Change to invisible space", icon: "img/toolbar/other.png", type: $spaceType.OTHER },
    { name: "Change to star space", icon: "img/toolbar/star.png", type: $spaceType.STAR, advanced: true },
    { name: "Change to start space", icon: "img/toolbar/start.png", type: $spaceType.START, advanced: true },
    { name: "Change to arrow space", icon: "img/toolbar/arrow.png", type: $spaceType.ARROW, advanced: true },
  ];
  const RCSpaceTypeToggleSubTypes_3 = [
    { name: "Show Millenium Star", icon: "img/toolbar/mstar.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show bank", icon: "img/toolbar/banksubtype.png", subtype: $spaceSubType.BANK },
    { name: "Show bank coin stack", icon: "img/toolbar/bankcoinsubtype.png", subtype: $spaceSubType.BANKCOIN },
    { name: "Show item shop", icon: "img/toolbar/itemshopsubtype.png", subtype: $spaceSubType.ITEMSHOP },
  ];

  function _getRCSpaceTypeToggles() {
    let types;
    switch (PP64.boards.getCurrentBoard().game) {
      case 1:
        types = RCSpaceTypeToggleTypes_1;
      case 2:
        types = RCSpaceTypeToggleTypes_2;
      case 3:
        types = RCSpaceTypeToggleTypes_3;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types.filter(a => !a.advanced);
    }

    return types;
  }

  function _getRCSpaceSubTypeToggles() {
    let types;
    switch (PP64.boards.getCurrentBoard().game) {
      case 1:
        types = RCSpaceTypeToggleSubTypes_1;
      case 2:
        types = RCSpaceTypeToggleSubTypes_2;
      case 3:
        types = RCSpaceTypeToggleSubTypes_3;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types.filter(a => !a.advanced);
    }

    return types;
  }

  const RCSpaceTypeToggle = class RCSpaceTypeToggle extends React.Component {
    onTypeChanged = (type, subtype) => {
      this.props.typeChanged(type, subtype);
    }

    render() {
      let type = this.props.type;
      if (type === $spaceType.START && !PP64.settings.get($setting.uiAdvanced))
        return null; // Can't switch start space type
      let subtype = this.props.subtype;
      let onTypeChanged = this.onTypeChanged;
      let makeToggle = item => {
        let key = item.type + "-" + item.subtype;
        let selected = type === item.type || (type === $spaceType.OTHER && subtype !== undefined && subtype === item.subtype);
        //if (type !== $spaceType.OTHER && item.subtype !== undefined)
        //  return null;
        return (
          <RCSpaceTypeToggleBtn key={key} type={item.type} subtype={item.subtype}
            icon={item.icon} title={item.name} selected={selected} typeChanged={onTypeChanged} />
        );
      };
      let typeToggles = _getRCSpaceTypeToggles().map(makeToggle);
      let subTypeToggles = _getRCSpaceSubTypeToggles().map(makeToggle);

      return (
        <div className="rcSpaceToggleContainer">
          {typeToggles}
          <br />
          {subTypeToggles}
        </div>
      );
    }
  };

  const RCSpaceTypeToggleBtn = class RCSpaceTypeToggleBtn extends React.Component {
    onTypeChanged = () => {
      if (this.props.subtype !== undefined && this.props.selected)
        this.props.typeChanged(this.props.type, undefined);
      else
        this.props.typeChanged(this.props.type, this.props.subtype);
    }

    render() {
      let btnClass = "rcSpaceToggleButton";
      if (this.props.selected)
        btnClass += " selected";
      let size = this.props.subtype !== undefined ? 25 : 20;
      return (
        <div className={btnClass} title={this.props.title} onClick={this.onTypeChanged}>
          <img src={this.props.icon} height={size} width={size} />
        </div>
      );
    }
  };

  return {
    RightClickMenu
  };
})();
