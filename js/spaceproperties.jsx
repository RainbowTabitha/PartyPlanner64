PP64.ns("properties");

PP64.properties.SpaceProperties = (function() {

  const SpaceProperties = class SpaceProperties extends React.Component {
    state = { }

    onTypeChanged = (type, subtype) => {
      const selectedSpaces = this.props.selectedSpaces;
      for (const space of selectedSpaces) {
        if (type !== undefined)
          space.type = type;
        if (subtype !== undefined)
          space.subtype = subtype;
        else
          delete space.subtype;
      }
      PP64.renderer.render();
      this.forceUpdate();
    }

    onStarCheckChanged = checked => {
      const selectedSpaces = this.props.selectedSpaces;
      for (const space of selectedSpaces) {
        space.star = !!checked;
      }
      PP64.renderer.render();
      this.forceUpdate();
    }

    onEventAdded = event => {
      const space = this.props.selectedSpaces[0];
      PP64.boards.addEventToSpace(space, event);
      PP64.renderer.render();
      this.forceUpdate();
    }

    onEventDeleted = event => {
      const space = this.props.selectedSpaces[0];
      PP64.boards.removeEventFromSpace(space, event);
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
      const spaces = this.props.selectedSpaces;
      if (!spaces || !spaces.length) {
        return (
          <div className="propertiesEmptyText">No space selected.</div>
        );
      }

      const multipleSelections = spaces.length > 1;

      const curSpace = spaces[0];
      const gameVersion = this.props.gameVersion;
      const boardType = this.props.boardType;
      const isDuel = boardType === PP64.types.BoardType.DUEL;
      const spaceToggleTypes = _getSpaceTypeToggles(gameVersion, boardType);
      const spaceToggleSubTypes = _getSpaceSubTypeToggles(gameVersion, boardType);

      let gameVersionHeading;
      if (true) {
        gameVersionHeading = <span className="propertySectionTitle">Events
          &nbsp;<img src="img/editor/event.png" height="9" width="9" />
        </span>;
      }

      let currentType = curSpace.type;
      let currentSubtype = curSpace.subtype;
      let hostsStarChecked = curSpace.star || false;
      let hostsStarIndeterminate = false;
      if (multipleSelections) {
        // Only show a type as selected if all spaces are the same.
        for (const space of spaces) {
          if (space.type !== currentType)
            currentType = undefined;
          if (space.subtype !== currentSubtype)
            currentSubtype = undefined;
          if (space.star !== hostsStarChecked)
            hostsStarIndeterminate = true;
        }
      }

      return (
        <div className="properties">
          <div className="propertiesPadded">
            {!multipleSelections ? <SpaceCoords space={curSpace} /> : null }
            <SpaceTypeToggle toggleTypes={spaceToggleTypes}
              type={currentType}
              subtype={currentSubtype}
              typeChanged={this.onTypeChanged} />
            <SpaceTypeToggle toggleTypes={spaceToggleSubTypes}
              type={currentType}
              subtype={currentSubtype}
              typeChanged={this.onTypeChanged} />
            {!isDuel ? <SpaceStarCheckbox checked={hostsStarChecked}
              indeterminate={hostsStarIndeterminate}
              onStarCheckChanged={this.onStarCheckChanged} /> : null }
          </div>
          {!multipleSelections ? gameVersionHeading : null }
          {!multipleSelections ? (
          <div className="propertiesPadded">
            <SpaceEventsList events={curSpace.events}
              onEventAdded={this.onEventAdded} onEventDeleted={this.onEventDeleted}
              onEventActivationTypeToggle={this.onEventActivationTypeToggle} />
          </div>
          ) : null }
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

    onChangeRotation = event => {
      let newRot = parseInt(event.target.value, 10);
      let isBlank = event.target.value === "";
      if ((!isBlank && isNaN(newRot)) || newRot < 0 || newRot > 360)
        return;
      if (!this.state.oldRot)
        this.setState({ oldRot: this.props.space.rotation });
      if (!newRot)
        delete this.props.space.rotation;
      else
        this.props.space.rotation = newRot;
      this.forceUpdate();
    }

    onCoordSet = event => {
      this.props.space.x = this.props.space.x || 0;
      this.props.space.y = this.props.space.y || 0;
      PP64.renderer.render();
      this.setState({ oldX: undefined, oldY: undefined, oldRot: undefined });
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

      const isArrow = space.type === $spaceType.ARROW;

      return (
        <React.Fragment>
          <div className="spaceCoordRow">
            <span className="coordLabel">X:</span>
            <input className="coordInput" type="text" value={space.x} onChange={this.onChangeX}
              onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
            <span className="coordLabel">Y:</span>
            <input className="coordInput" type="text" value={space.y} onChange={this.onChangeY}
              onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
          </div>
          {/* {isArrow &&
            <div className="spaceCoordRow">
              <span className="coordLabel">Rotation:</span>
                <input className="coordInput" type="text" value={space.rotation} onChange={this.onChangeRotation}
                  onBlur={this.onCoordSet} onKeyUp={this.onKeyUp} />
            </div>
          } */}
        </React.Fragment>
      );
    }
  };

  const SpaceTypeToggleTypes_1 = [
    // Types
    { name: "Change to blue space", icon: "img/toolbar/blue.png", type: $spaceType.BLUE },
    { name: "Change to red space", icon: "img/toolbar/red.png", type: $spaceType.RED },
    { name: "Change to happening space", icon: "img/toolbar/happening.png", type: $spaceType.HAPPENING },
    { name: "Change to chance time space", icon: "img/toolbar/chance.png", type: $spaceType.CHANCE },
    { name: "Change to Mini-Game space", icon: "img/toolbar/minigame.png", type: $spaceType.MINIGAME },
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

  const SpaceTypeToggleTypes_3_Duel = [
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

  function _getSpaceTypeToggles(gameVersion, boardType) {
    let types;
    switch (gameVersion) {
      case 1:
        types = SpaceTypeToggleTypes_1;
        break;
      case 2:
        types = SpaceTypeToggleTypes_2;
        break;
      case 3:
        switch (boardType) {
          case PP64.types.BoardType.DUEL:
            types = SpaceTypeToggleTypes_3_Duel;
            break;
          default:
            types = SpaceTypeToggleTypes_3;
            break;
        }
        break;
    }

    if (!PP64.settings.get($setting.uiAdvanced)) {
      types = types.filter(a => !a.advanced);
    }

    return types;
  }

  function _getSpaceSubTypeToggles(gameVersion, boardType) {
    let types;
    switch (gameVersion) {
      case 1:
        types = SpaceSubTypeToggleTypes_1;
        break;
      case 2:
        types = SpaceSubTypeToggleTypes_2;
        break;
      case 3:
        switch (boardType) {
          case PP64.types.BoardType.DUEL:
            types = []; //SpaceSubTypeToggleTypes_3_Duel;
            break;
          default:
            types = SpaceSubTypeToggleTypes_3;
            break;
        }
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
      const type = this.props.type;
      if (type === $spaceType.START && !PP64.settings.get($setting.uiAdvanced))
        return null; // Can't switch start space type
      const subtype = this.props.subtype;
      const onTypeChanged = this.onTypeChanged;
      const toggleTypes = this.props.toggleTypes || [];
      const toggles = toggleTypes.map(item => {
        const key = item.type + "-" + item.subtype;
        const selected = (item.type !== undefined && type === item.type)
          || (item.subtype !== undefined && subtype !== undefined && subtype === item.subtype);
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
    render() {
      return (
        <div className="starCheckbox">
          <label><input type="checkbox"
            ref={el => this.checkboxEl = el}
            checked={this.props.checked}
            value={this.props.checked}
            onChange={this.onChange} /> Hosts star</label>
        </div>
      );
    }

    onChange = event => {
      this.props.onStarCheckChanged(event.target.checked);
    }

    componentDidMount() {
      this.checkboxEl.indeterminate = this.props.indeterminate;
    }

    componentDidUpdate(prevProps) {
      if (prevProps.indeterminate !== this.props.indeterminate) {
        this.checkboxEl.indeterminate = this.props.indeterminate;
      }
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
      let name = PP64.adapters.events.getName(event.id) || event.id;
      return (
        <div className="eventEntry">
          <div className="eventEntryHeader">
            <span className="eventEntryName" title={name}>{name}</span>
            <div role="button" className="eventEntryDelete" onClick={this.onEventDeleted}
              title="Remove this event">✖</div>
          </div>
          <div className="eventEntryOptions">
            <SpaceEventActivationTypeToggle activationType={event.activationType}
              onEventActivationTypeToggle={this.onEventActivationTypeToggle} />
          </div>
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
      const activationTypes = PP64.types.EventActivationType;

      let activationTypeImages = {};
      activationTypeImages[activationTypes.WALKOVER] = "img/toolbar/eventpassing.png";
      activationTypeImages[activationTypes.LANDON] = "img/toolbar/eventstanding.png";
      let activationTypeToggleImg = activationTypeImages[activationType];
      if (!activationTypeToggleImg)
        return null;

      let activationTypeTitles = {};
      activationTypeTitles[activationTypes.WALKOVER] = "Occurs when passing over the space";
      activationTypeTitles[activationTypes.LANDON] = "Occurs when landing on the space";

      let activationTypeText = "";
      switch (activationType) {
        case activationTypes.WALKOVER:
          activationTypeText = "Passing event";
          break;
        case activationTypes.LANDON:
          activationTypeText = "Land-on event";
          break;
      }

      return (
        <div className="eventEntryItem eventEntryActivationTypeItem" onClick={this.onTypeToggle}>
          <img className="eventEntryActivationTypeToggle" alt="Activation Type"
            src={activationTypeToggleImg} title={activationTypeTitles[activationType]} />
          <span>{activationTypeText}</span>
        </div>
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
        <div className="eventAddSelectEntry">
          <select className="eventAddSelect" value={this.state.selectedValue} onChange={this.onSelection}>
            {eventOptions}
          </select>
        </div>
      );
    }
  };

  return SpaceProperties;
})();
