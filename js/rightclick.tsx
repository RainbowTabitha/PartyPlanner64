namespace PP64.rightclick {

  let _globalHandler: any;

  interface IRightClickMenuProps {
    space?: PP64.boards.ISpace | null;
  }

  interface IRightClickMenuState {
    oldX?: number;
    oldY?: number;
  }

  export class RightClickMenu extends React.Component<IRightClickMenuProps, IRightClickMenuState> {
    state: IRightClickMenuState = {}

    private rcMenu: any;

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

    globalClickHandler = (event: any) => {
      // console.log("globalClickHandler", event);

      // If we click inside the menu, don't close obviously.
      // But also let the canvas handlers decide what happens if they are clicked.
      if (this.elementIsWithin(event.target) || event.target.tagName.toUpperCase() === "CANVAS")
        return;
      PP64.renderer.updateRightClickMenu(null);
    }

    handleClick = (event: any) => {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }

    onContextMenu = (event: any) => {
      event.preventDefault(); // No right click on right click menu.
    }

    onTypeChanged = (type: PP64.types.Space, subtype?: PP64.types.SpaceSubtype) => {
      if (type !== undefined) {
        this.props.space!.type = type;
        if (this.props.space!.rotation) {
          delete this.props.space!.rotation;
        }
      }
      if (subtype !== undefined)
        this.props.space!.subtype = subtype;
      else
        delete this.props.space!.subtype;
      PP64.renderer.render();
      this.forceUpdate();
    }

    getPlacement(space: PP64.boards.ISpace) {
      let x = (!isNaN(this.state.oldX!) ? this.state.oldX! : space.x) - 8;
      let y = (!isNaN(this.state.oldY!) ? this.state.oldY! : space.y) + 15;
      return "translateX(" + x + "px) translateY(" + y + "px)";
    }

    elementIsWithin(el: HTMLElement) {
      if (!el || !this.refs || !this.rcMenu)
        return true;
      return this.rcMenu.contains(el);
    }

    onChangeX = (event: any) => {
      let newX = parseInt(event.target.value, 10);
      let isBlank = event.target.value === "";
      let curBgWidth = PP64.boards.getCurrentBoard().bg.width;
      if ((!isBlank && isNaN(newX)) || newX < 0 || newX > curBgWidth)
        return;
      if (!this.state.oldX)
        this.setState({ oldX: this.props.space!.x });
      (this as any).props.space.x = isBlank ? "" : newX;
      this.forceUpdate();
    }

    onChangeY = (event: any) => {
      let newY = parseInt(event.target.value, 10);
      let isBlank = event.target.value === "";
      let curBgHeight = PP64.boards.getCurrentBoard().bg.height;
      if ((!isBlank && isNaN(newY)) || newY < 0 || newY > curBgHeight)
        return;
      if (!this.state.oldY)
        this.setState({ oldY: this.props.space!.y });
      (this as any).props.space.y = isBlank ? "" : newY;
      this.forceUpdate();
    }

    onCoordSet = (event?: any) => {
      this.props.space!.x = this.props.space!.x || 0;
      this.props.space!.y = this.props.space!.y || 0;
      PP64.renderer.render();
      this.setState({ oldX: undefined, oldY: undefined });
      this.forceUpdate();
    }

    onKeyUp = (event: any) => {
      if (event.key === "Enter")
        this.onCoordSet();
    }

    render() {
      let space = this.props.space;
      if (!space)
        return null;

      let style = { transform: this.getPlacement(space) };
      return (
        <div ref={(menu) => this.rcMenu = menu} className="rcMenu" style={style}
          onClick={this.handleClick}
          onContextMenu={this.onContextMenu}>
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

  interface IRCMenuItem {
    name: string;
    icon: string;
    type?: PP64.types.Space;
    subtype?: PP64.types.SpaceSubtype;
    advanced?: boolean;
  }

  const RCSpaceTypeToggleTypes_1: IRCMenuItem[] = [
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
  const RCSpaceTypeToggleSubTypes_1: IRCMenuItem[] = [
    { name: "Show Toad", icon: "img/toolbar/toad.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show Bowser", icon: "img/toolbar/bowsercharacter.png", subtype: $spaceSubType.BOWSER },
    { name: "Show Koopa Troopa", icon: "img/toolbar/koopa.png", subtype: $spaceSubType.KOOPA },
  ];

  const RCSpaceTypeToggleTypes_2: IRCMenuItem[] = [
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
  const RCSpaceTypeToggleSubTypes_2: IRCMenuItem[] = [
    { name: "Show Toad", icon: "img/toolbar/toad.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show bank", icon: "img/toolbar/banksubtype2.png", subtype: $spaceSubType.BANK },
    { name: "Show bank coin stack", icon: "img/toolbar/bankcoinsubtype.png", subtype: $spaceSubType.BANKCOIN },
    { name: "Show item shop", icon: "img/toolbar/itemshopsubtype2.png", subtype: $spaceSubType.ITEMSHOP },
  ];

  const RCSpaceTypeToggleTypes_3: IRCMenuItem[] = [
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
  const RCSpaceTypeToggleSubTypes_3: IRCMenuItem[] = [
    { name: "Show Millenium Star", icon: "img/toolbar/mstar.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show bank", icon: "img/toolbar/banksubtype.png", subtype: $spaceSubType.BANK },
    { name: "Show bank coin stack", icon: "img/toolbar/bankcoinsubtype.png", subtype: $spaceSubType.BANKCOIN },
    { name: "Show item shop", icon: "img/toolbar/itemshopsubtype.png", subtype: $spaceSubType.ITEMSHOP },
  ];

  const RCSpaceTypeToggleTypes_3_Duel: IRCMenuItem[] = [
    // Types
    { name: "Change to basic space", icon: "img/toolbar/basic3.png", type: $spaceType.DUEL_BASIC },
    { name: "Change to Mini-Game space", icon: "img/toolbar/minigameduel3.png", type: $spaceType.MINIGAME },
    { name: "Change to reverse space", icon: "img/toolbar/reverse3.png", type: $spaceType.DUEL_REVERSE },
    { name: "Change to happening space", icon: "img/toolbar/happeningduel3.png", type: $spaceType.HAPPENING },
    { name: "Change to Game Guy space", icon: "img/toolbar/gameguyduel.png", type: $spaceType.GAMEGUY },
    { name: "Change to power-up space", icon: "img/toolbar/powerup.png", type: $spaceType.DUEL_POWERUP },
    { name: "Change to invisible space", icon: "img/toolbar/other.png", type: $spaceType.OTHER },
    { name: "Change to blue start space", icon: "img/toolbar/startblue.png", type: $spaceType.DUEL_START_BLUE, advanced: true },
    { name: "Change to red start space", icon: "img/toolbar/startred.png", type: $spaceType.DUEL_START_RED, advanced: true },
  ];

  function _getRCSpaceTypeToggles() {
    const curBoard = PP64.boards.getCurrentBoard();
    let types: IRCMenuItem[] = [];
    switch (curBoard.game) {
      case 1:
        types = RCSpaceTypeToggleTypes_1;
        break;
      case 2:
        types = RCSpaceTypeToggleTypes_2;
        break;
      case 3:
        switch (curBoard.type) {
          case PP64.types.BoardType.DUEL:
            types = RCSpaceTypeToggleTypes_3_Duel;
            break;
          case PP64.types.BoardType.NORMAL:
          default:
            types = RCSpaceTypeToggleTypes_3;
            break;
        }
        break;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types.filter(a => !a.advanced);
    }

    return types;
  }

  function _getRCSpaceSubTypeToggles() {
    const curBoard = PP64.boards.getCurrentBoard();
    let types: IRCMenuItem[] = [];
    switch (curBoard.game) {
      case 1:
        types = RCSpaceTypeToggleSubTypes_1;
        break;
      case 2:
        types = RCSpaceTypeToggleSubTypes_2;
        break;
      case 3:
        switch (curBoard.type) {
          case PP64.types.BoardType.DUEL:
            types = []; // SpaceSubTypeToggleTypes_3_Duel;
            break;
          default:
            types = RCSpaceTypeToggleSubTypes_3;
            break;
        }
        break;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types!.filter((a: IRCMenuItem) => !a.advanced);
    }

    return types;
  }

  interface IRCSpaceTypeToggleProps {
    type: PP64.types.Space;
    subtype?: PP64.types.SpaceSubtype;
    typeChanged: (type: PP64.types.Space, subtype?: PP64.types.SpaceSubtype) => any;
  }

  const RCSpaceTypeToggle = class RCSpaceTypeToggle extends React.Component<IRCSpaceTypeToggleProps> {
    onTypeChanged = (type: PP64.types.Space, subtype?: PP64.types.SpaceSubtype) => {
      this.props.typeChanged(type, subtype);
    }

    render() {
      let type = this.props.type;
      if (type === $spaceType.START && !PP64.settings.get($setting.uiAdvanced))
        return null; // Can't switch start space type
      let subtype = this.props.subtype;
      let onTypeChanged = this.onTypeChanged;
      let makeToggle = (item: any) => {
        let key = item.type + "-" + item.subtype;
        let selected = type === item.type || (type === $spaceType.OTHER && subtype !== undefined && subtype === item.subtype);
        //if (type !== $spaceType.OTHER && item.subtype !== undefined)
        //  return null;
        return (
          <RCSpaceTypeToggleBtn key={key} type={item.type} subtype={item.subtype}
            icon={item.icon} title={item.name} selected={selected} typeChanged={onTypeChanged} />
        );
      };
      let typeToggles = _getRCSpaceTypeToggles()!.map(makeToggle);
      let subTypeToggles = _getRCSpaceSubTypeToggles()!.map(makeToggle);

      return (
        <div className="rcSpaceToggleContainer">
          {typeToggles}
          <br />
          {subTypeToggles}
        </div>
      );
    }
  };

  interface IRCSpaceTypeToggleBtnProps {
    type: PP64.types.Space;
    subtype: PP64.types.SpaceSubtype;
    selected?: boolean;
    icon?: string;
    title?: string;
    typeChanged: (type: PP64.types.Space, subtype?: PP64.types.SpaceSubtype) => any;
  }

  const RCSpaceTypeToggleBtn = class RCSpaceTypeToggleBtn extends React.Component<IRCSpaceTypeToggleBtnProps> {
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
}
