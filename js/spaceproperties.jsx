PP64.ns("properties");

PP64.properties.SpaceProperties = (function() {

  const SpaceProperties = class SpaceProperties extends React.Component {
    state = { }

    onTypeChanged = (type, subtype) => {
      if (type !== undefined)
        this.props.currentSpace.type = type;
      if (subtype !== undefined)
        this.props.currentSpace.subtype = subtype;
      else
        delete this.props.currentSpace.subtype;
      PP64.renderer.render();
      this.forceUpdate();
    }

    onStarCheckChanged = checked => {
      this.props.currentSpace.star = !!checked;
      PP64.renderer.render();
      this.forceUpdate();
    }

    onEventAdded = event => {
      PP64.boards.addEventToSpace(this.props.currentSpace, event);
      PP64.renderer.render();
      this.forceUpdate();
    }

    onEventDeleted = event => {
      PP64.boards.removeEventFromSpace(this.props.currentSpace, event);
      PP64.renderer.render();
      this.forceUpdate();
    }

    onEventActivationTypeToggle = event => {
      if (event.activationType === PP64.types.EventActivationType.WALKOVER)
        event.activationType = PP64.types.EventActivationType.LANDON;
      else
        event.activationType = PP64.types.EventActivationType.WALKOVER;
    }

    render() {
      var curSpace = this.props.currentSpace;
      if (!curSpace) {
        return (
          <div className="propertiesEmptyText">No space selected.</div>
        );
      }

      let gameVersion = this.props.gameVersion;
      let spaceToggleTypes = _getSpaceTypeToggles(gameVersion);
      let spaceToggleSubTypes = _getSpaceSubTypeToggles(gameVersion);

      let gameVersionHeading;
      if (true) {
        gameVersionHeading = <span className="propertySectionTitle">Events
          &nbsp;<img src="img/editor/event.png" height="9" width="9" />
        </span>;
      }

      return (
        <div className="properties">
          <div className="propertiesPadded">
            <SpaceCoords space={curSpace} />
            <SpaceTypeToggle toggleTypes={spaceToggleTypes} type={curSpace.type}
              subtype={curSpace.subtype} typeChanged={this.onTypeChanged} />
            <SpaceTypeToggle toggleTypes={spaceToggleSubTypes} type={curSpace.type}
              subtype={curSpace.subtype} typeChanged={this.onTypeChanged} />
            <SpaceStarCheckbox checked={curSpace.star} onStarCheckChanged={this.onStarCheckChanged} />
          </div>
          {gameVersionHeading}
          <div className="propertiesPadded">
            <SpaceEventsList events={curSpace.events}
              onEventAdded={this.onEventAdded} onEventDeleted={this.onEventDeleted}
              onEventActivationTypeToggle={this.onEventActivationTypeToggle} />
          </div>
        </div>
      );
    }
  };

  const SpaceCoords = class SpaceCoords extends React.Component {
    state = {}

    onChangeX = event => {
      var newX = parseInt(event.target.value, 10);
      var isBlank = event.target.value === "";
      var curBgWidth = PP64.boards.getCurrentBoard().bg.width;
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

      return (
        <div>
          <span className="coordLabel">X:</span>
          <input className="coordInput" type="text" value={space.x} onChange={this.onChangeX}
            onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
          <span className="coordLabel">Y:</span>
          <input className="coordInput" type="text" value={space.y} onChange={this.onChangeY}
            onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
        </div>
      );
    }
  };

  const SpaceTypeToggleTypes_1 = [
    // Types
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
  const SpaceSubTypeToggleTypes_1 = [
    // Subtypes
    { name: "Show Toad", icon: "img/toolbar/toad.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show Bowser", icon: "img/toolbar/bowsercharacter.png", subtype: $spaceSubType.BOWSER },
    { name: "Show Koopa Troopa", icon: "img/toolbar/koopa.png", subtype: $spaceSubType.KOOPA },
  ];

  const SpaceTypeToggleTypes_2 = [
    // Types
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
  const SpaceSubTypeToggleTypes_2 = [
    // Subtypes
    { name: "Show Toad", icon: "img/toolbar/toad.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show bank", icon: "img/toolbar/banksubtype2.png", subtype: $spaceSubType.BANK },
    { name: "Show bank coin stack", icon: "img/toolbar/bankcoinsubtype.png", subtype: $spaceSubType.BANKCOIN },
    { name: "Show item shop", icon: "img/toolbar/itemshopsubtype2.png", subtype: $spaceSubType.ITEMSHOP },
  ];

  const SpaceTypeToggleTypes_3 = [
    // Types
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
  const SpaceSubTypeToggleTypes_3 = [
    // Subtypes
    { name: "Show Millenium Star", icon: "img/toolbar/mstar.png", subtype: $spaceSubType.TOAD },
    { name: "Show Boo", icon: "img/toolbar/boo.png", subtype: $spaceSubType.BOO },
    { name: "Show bank", icon: "img/toolbar/banksubtype.png", subtype: $spaceSubType.BANK },
    { name: "Show bank coin stack", icon: "img/toolbar/bankcoinsubtype.png", subtype: $spaceSubType.BANKCOIN },
    { name: "Show item shop", icon: "img/toolbar/itemshopsubtype.png", subtype: $spaceSubType.ITEMSHOP },
  ];

  function _getSpaceTypeToggles(gameVersion) {
    let types;
    switch (gameVersion) {
      case 1:
        types = SpaceTypeToggleTypes_1;
        break;
      case 2:
        types = SpaceTypeToggleTypes_2;
        break;
      case 3:
        types = SpaceTypeToggleTypes_3;
        break;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types.filter(a => !a.advanced);
    }

    return types;
  }

  function _getSpaceSubTypeToggles(gameVersion) {
    let types;
    switch (gameVersion) {
      case 1:
        types = SpaceSubTypeToggleTypes_1;
        break;
      case 2:
        types = SpaceSubTypeToggleTypes_2;
        break;
      case 3:
        types = SpaceSubTypeToggleTypes_3;
        break;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types.filter(a => !a.advanced);
    }

    return types;
  }

  const SpaceTypeToggle = class SpaceTypeToggle extends React.Component {
    onTypeChanged = (type, subtype) => {
      this.props.typeChanged(type, subtype);
    }

    render() {
      let type = this.props.type;
      if (type === $spaceType.START && !PP64.settings.get($setting.uiAdvanced))
        return null; // Can't switch start space type
      let subtype = this.props.subtype;
      let onTypeChanged = this.onTypeChanged;
      let toggleTypes = this.props.toggleTypes;
      let toggles = toggleTypes.map(item => {
        let key = item.type + "-" + item.subtype;
        let selected = type === item.type || (subtype !== undefined && subtype === item.subtype);
        //if (type !== $spaceType.OTHER && item.subtype !== undefined)
        //  return null;
        return (
          <SpaceTypeToggleBtn key={key} type={item.type} subtype={item.subtype}
            icon={item.icon} title={item.name} selected={selected} typeChanged={onTypeChanged} />
        );
      });

      return (
        <div className="spaceToggleContainer">
          {toggles}
        </div>
      );
    }
  };

  const SpaceTypeToggleBtn = class SpaceTypeToggleBtn extends React.Component {
    onTypeChanged = () => {
      if (this.props.subtype !== undefined && this.props.selected)
        this.props.typeChanged(this.props.type, undefined);
      else
        this.props.typeChanged(this.props.type, this.props.subtype);
    }

    render() {
      let btnClass = "spaceToggleButton";
      if (this.props.selected)
        btnClass += " selected";
      let size = this.props.subtype !== undefined ? 25 : 20;
      let onKeyDown = PP64.utils.react.makeKeyClick(this.onTypeChanged, this);
      return (
        <div className={btnClass} title={this.props.title} tabIndex="0"
          onClick={this.onTypeChanged} onKeyDown={onKeyDown}>
          <img src={this.props.icon} height={size} width={size} />
        </div>
      );
    }
  };

  const SpaceStarCheckbox = class SpaceStarCheckbox extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        checked: props.checked
      };
    }

    componentWillReceiveProps = (nextProps) => {
      this.state = {
        checked: nextProps.checked
      };
    }

    render() {
      return (
        <div className="starCheckbox">
          <label><input type="checkbox" checked={this.state.checked} value={this.state.checked} onChange={this.onChange} /> Hosts star</label>
        </div>
      );
    }

    onChange = event => {
      this.setState({ checked: event.target.checked });
      this.props.onStarCheckChanged(event.target.checked);
    }
  };

  const SpaceEventsList = class SpaceEventsList extends React.Component {
    render() {
      let events = this.props.events || [];
      let id = 0;
      let entries = events.map(event => {
        return (
          <SpaceEventEntry event={event} key={`${event.id}-${id++}`}
            onEventDeleted={this.props.onEventDeleted}
            onEventActivationTypeToggle={this.props.onEventActivationTypeToggle} />
        );
      });
      let eventadd;
      // TODO: We could do something to restrict adding more events than realistic...
      //if (!entries.length) {
        eventadd = <SpaceEventAdd onEventAdded={this.props.onEventAdded} />;
      //}

      return (
        <div className="eventsList">
          {entries}
          {eventadd}
        </div>
      );
    }
  };

  const SpaceEventEntry = class SpaceEventEntry extends React.Component {
    onEventDeleted = () => {
      this.props.onEventDeleted(this.props.event);
    }

    onEventActivationTypeToggle = () => {
      this.props.onEventActivationTypeToggle(this.props.event);
      this.forceUpdate();
    }

    render() {
      let event = this.props.event;
      let name = PP64.adapters.events.getName(event.id);
      return (
        <div className="eventEntry">
          <span className="eventEntryName" title={name}>{name}</span>
          <SpaceEventActivationTypeToggle activationType={event.activationType}
            onEventActivationTypeToggle={this.onEventActivationTypeToggle} />
          <div role="button" className="eventEntryDelete" onClick={this.onEventDeleted}
            title="Remove this event">✖</div>
        </div>
      );
    }
  };

  const SpaceEventActivationTypeToggle = class SpaceEventActivationTypeToggle extends React.Component {
    onTypeToggle = () => {
      this.props.onEventActivationTypeToggle();
    }

    render() {
      let activationType = this.props.activationType;

      let activationTypeImages = {};
      activationTypeImages[PP64.types.EventActivationType.WALKOVER] = "img/toolbar/eventpassing.png";
      activationTypeImages[PP64.types.EventActivationType.LANDON] = "img/toolbar/eventstanding.png";
      let activationTypeToggleImg = activationTypeImages[activationType];
      if (!activationTypeToggleImg)
        return null;

      let activationTypeTitles = {};
      activationTypeTitles[PP64.types.EventActivationType.WALKOVER] = "Occurs when passing the space";
      activationTypeTitles[PP64.types.EventActivationType.LANDON] = "Occurs when landing on the space";

      return (
        <img className="eventEntryActivationTypeToggle" alt="Activation Type"
          src={activationTypeToggleImg} onClick={this.onTypeToggle} title={activationTypeTitles[activationType]} />
      );
    }
  };

  const SpaceEventAdd = class SpaceEventAdd extends React.Component {
    state = {
      selectedValue: -1,
      possibleEvents: PP64.adapters.events.getAvailableEvents().sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      })
    }

    onSelection = e => {
      let selectedOption = e.target.value;
      if (selectedOption == "-1")
        return;
      let event = PP64.utils.obj.copy(this.state.possibleEvents[selectedOption]);
      this.props.onEventAdded(event);
    }

    render() {
      var index = 0;
      let eventOptions = this.state.possibleEvents.map(event => {
        let curIndex = index++;
        return (
          <option value={curIndex} key={curIndex}>{event.name}</option>
        );
      });

      if (!eventOptions.length)
        return null;

      eventOptions.unshift(<option value="-1" key="-1">Add new event</option>);

      return (
        <div className="eventEntry">
          <select className="eventAddSelect" value={this.state.selectedValue} onChange={this.onSelection}>
            {eventOptions}
          </select>
        </div>
      );
    }
  };

  return SpaceProperties;
})();
