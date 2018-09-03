PP64.ns("events");

Object.assign(PP64.events, (function() {
  let _createEventViewInstance;

  const _defaultEventAsm = `; NAME:
; GAMES:
; EXECUTION: Direct

ADDIU SP SP -4
SW RA 0(SP)

; Your code here

LW RA 0(SP)
JR RA
ADDIU SP SP 4`;

  const CreateEventView = class CreateEventView extends React.Component {
    constructor(props) {
      super(props);

      const currentEvent = PP64.app.getCurrentEvent();
      if (currentEvent) {
        this.state = {
          eventName: currentEvent.name,
          supportedGames: currentEvent.supportedGames,
          executionType: currentEvent.executionType,
          asm: currentEvent.asm,
          parameters: currentEvent.parameters,
        };
      }
      else {
        this.state = {
          eventName: "",
          supportedGames: [],
          executionType: $executionType.DIRECT,
          asm: _defaultEventAsm,
          parameters: [],
        };
      }
    }

    render() {
      if (this.state.hasError) {
        return (
          <p>An error was encountered.</p>
        );
      }

      const CodeMirror = PP64.components.CodeMirrorWrapper;
      return (
        <div className="createEventViewContainer">
          <CodeMirror ref={(cm) => { this._codemirror = cm; }}
            className="eventcodemirror"
            value={this.state.asm}
            onChange={this.onAsmChange} />
          <EventDetailsForm name={this.state.eventName}
            onEventNameChange={this.onEventNameChange}
            supportedGames={this.state.supportedGames}
            onGameToggleClicked={this.onGameToggleClicked}
            executionType={this.state.executionType}
            onExecTypeToggleClicked={this.onExecTypeToggleClicked}
            parameters={this.state.parameters}
            onAddEventParameter={this.onAddEventParameter}
            onRemoveEventParameter={this.onRemoveEventParameter} />
        </div>
      );
    }

    componentDidMount() {
      _createEventViewInstance = this;
    }

    componentWillUnmount() {
      _createEventViewInstance = null;
    }

    onEventNameChange = (eventName) => {
      const newState = { ...this.state, eventName };
      this.setState({ eventName });
      this.syncTextToStateVars(newState, this.state.asm);
    }

    onAsmChange = (asm) => {
      this.setState({ asm });
      this.syncStateVarsToText(asm);
    }

    onGameToggleClicked = (id, pressed) => {
      const supportedGames = this.state.supportedGames;
      const gameIndex = supportedGames.indexOf(id);

      let newState;
      if (gameIndex === -1 && pressed) {
        this.setState({
          supportedGames: [...supportedGames, id],
        });
        newState = { ...this.state };
        newState.supportedGames = [...supportedGames, id];
      }
      else if (gameIndex >= 0 && !pressed) {
        supportedGames.splice(gameIndex, 1);
        this.setState({
          supportedGames: supportedGames,
        });
        newState = { ...this.state };
        newState.supportedGames = supportedGames;
      }

      if (newState) {
        this.syncTextToStateVars(newState, this.state.asm);
      }
    }

    onExecTypeToggleClicked = (id, pressed) => {
      let newState = { ...this.state };
      newState.executionType = id;
      this.setState({ executionType: id });
      this.syncTextToStateVars(newState, this.state.asm);
    }

    onAddEventParameter = (entry) => {
      let newState = { ...this.state };
      newState.parameters = [...this.state.parameters, entry];
      this.setState(newState);
      this.syncTextToStateVars(newState, this.state.asm);
    }

    onRemoveEventParameter = (removedEntry) => {
      let newState = { ...this.state };
      newState.parameters = this.state.parameters.filter(entry => {
        return entry.name !== removedEntry.name;
      });
      this.setState(newState);
      this.syncTextToStateVars(newState, this.state.asm);
    }

    getEventName = () => {
      return this.state.eventName;
    }

    getSupportedGames = () => {
      return this.state.supportedGames;
    }

    getExecutionType = () => {
      return this.state.executionType;
    }

    getEventAsm = () => {
      return this.state.asm;
    }

    /** Ensures the ASM text includes the discrete properties. */
    syncTextToStateVars = (newState, existingAsm) => {
      let newAsm = this.__clearDiscreteProperties(existingAsm, [
        "NAME", "GAMES", "EXECUTION", "PARAM"
      ]);
      newAsm = "\n" + newAsm;
      newAsm = this.__writeDiscretePropertyArray(newAsm, "PARAM", newState.parameters.map(param => {
        return `${param.type}|${param.name}`;
      }));
      newAsm = this.__writeDiscreteProperty(newAsm, "EXECUTION", PP64.types.getExecutionTypeName(newState.executionType));
      newAsm = this.__writeDiscreteProperty(newAsm, "GAMES", newState.supportedGames.map(PP64.types.getGameName).join(","));
      newAsm = this.__writeDiscreteProperty(newAsm, "NAME", newState.eventName.trim());

      if (newAsm !== existingAsm) {
        this.setState({ asm: newAsm });
      }
    }

    /** Pulls out discrete properties from the ASM text back into state. */
    syncStateVarsToText = (asm) => {
      let value = this.__readDiscreteProperty(asm, "NAME");
      if (value !== null) {
        this.setState({ eventName: (value || "").trim() });
      }

      value = PP64.adapters.events.CustomAsmHelper.readSupportedGames(asm);
      if (value !== null) {
        this.setState({ supportedGames: value });
      }

      value = PP64.adapters.events.CustomAsmHelper.readExecutionType(asm);
      if (value) {
        this.setState({ executionType: value });
      }

      value = PP64.adapters.events.CustomAsmHelper.readParameters(asm);
      if (value) {
        this.setState({ parameters: value });
      }
    }

    __clearDiscreteProperties(asm, properties) {
      properties.forEach(propertyName => {
        const regex = new RegExp("^\\s*[;\\/]+\\s*" + propertyName + ":.*[\r\n]*", "gim");
        asm = asm.replace(regex, "");
      });
      return asm;
    }

    __writeDiscreteProperty(asm, propName, value) {
      return `; ${propName}: ${value}\n` + asm;
    }

    __writeDiscretePropertyArray(asm, propName, values) {
      for (let i = values.length - 1; i >= 0; i--) {
        asm = `; ${propName}: ${values[i]}\n` + asm;
      }
      return asm;
    }

    __readDiscreteProperty(asm, propName) {
      return PP64.adapters.events.CustomAsmHelper.readDiscreteProperty(asm, propName);
    }

    promptExit = () => {
      const asm = this.state.asm;
      const oldEvent = PP64.adapters.events.getEvent(this.state.eventName.toUpperCase());
      if (!oldEvent || (oldEvent.asm && oldEvent.asm !== asm)) {
        return !!window.confirm("Are you sure you want to exit without saving the event?");
      }
      return true;
    }
  }

  const EventDetailsForm = class EventDetailsForm extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      const gameToggles = [
        { id: $gameType.MP1_USA, text: "MP1 USA", selected: this._gameSupported($gameType.MP1_USA) },
        { id: $gameType.MP2_USA, text: "MP2 USA", selected: this._gameSupported($gameType.MP2_USA) },
        { id: $gameType.MP3_USA, text: "MP3 USA", selected: this._gameSupported($gameType.MP3_USA) },
        { id: $gameType.MP1_JPN, text: "MP1 JPN", selected: this._gameSupported($gameType.MP1_JPN) },
        { id: $gameType.MP2_JPN, text: "MP2 JPN", selected: this._gameSupported($gameType.MP2_JPN) },
        { id: $gameType.MP3_JPN, text: "MP3 JPN", selected: this._gameSupported($gameType.MP3_JPN) },
        { id: $gameType.MP1_PAL, text: "MP1 PAL", selected: this._gameSupported($gameType.MP1_PAL) },
        { id: $gameType.MP2_PAL, text: "MP2 PAL", selected: this._gameSupported($gameType.MP2_PAL) },
        { id: $gameType.MP3_PAL, text: "MP3 PAL", selected: this._gameSupported($gameType.MP3_PAL) },
      ];

      const execTypeToggles = [
        { id: 1, text: "Direct", title: "The game will execute the event function directly",
          selected: this.props.executionType === $executionType.DIRECT },
        { id: 2, text: "Process", title: "The game will use its process system when executing the event function",
          selected: this.props.executionType === $executionType.PROCESS },
      ];

      const ToggleGroup = PP64.controls.ToggleGroup;
      return (
        <div className="createEventForm">
          <label>Name:</label>
          <input value={this.props.name} onChange={this.onEventNameChange} />
          <br /><br />
          <label>Supported Games:</label>
          <ToggleGroup items={gameToggles}
            groupCssClass="createEventGameToggles"
            onToggleClick={this.props.onGameToggleClicked} />
          <br />
          <label>Execution Type:</label>
          <ToggleGroup items={execTypeToggles}
            allowDeselect={false}
            onToggleClick={this.props.onExecTypeToggleClicked} />
          <br />
          <label>Parameters:</label>
          <EventParametersList
            parameters={this.props.parameters}
            onAddEventParameter={this.props.onAddEventParameter}
            onRemoveEventParameter={this.props.onRemoveEventParameter} />
        </div>
      );
    }

    onEventNameChange = (event) => {
      this.props.onEventNameChange(event.target.value);
    }

    _gameSupported = (game) => {
      return this.props.supportedGames.indexOf(game) >= 0;
    }
  }

  const EventParametersList = class EventParametersList extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      const entries = this.props.parameters.map(entry => {
        return (
          <EventParametersEntry entry={entry} key={entry.name}
            onRemoveEntry={this.props.onRemoveEventParameter}/>
        );
      });

      return (
        <div className="eventParametersList">
          <table>
            <tbody>
              {entries}
            </tbody>
          </table>
          <EventParametersAddNewEntry
            onAddEntry={this.props.onAddEventParameter} />
        </div>
      );
    }
  }

  const EventParametersEntry = class EventParametersEntry extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      const { type, name } = this.props.entry;

      return (
        <tr className="eventParameterEntry">
          <td className="eventParameterEntryType">{type}</td>
          <td className="eventParameterEntryName" title={name}>{name}</td>
          <td className="eventParameterEntryDelete">
            <img src="img/events/delete.png" alt="Delete"
              onClick={this.onDeleteClick}></img>
          </td>
        </tr>
      );
    }

    onDeleteClick = () => {
      this.props.onRemoveEntry(this.props.entry);
    }
  }

  const EventParametersAddNewEntry = class EventParametersAddNewEntry extends React.Component {
    state = {
      selectedType: "",
      name: "",
    }

    render() {
      const Button = PP64.controls.Button;
      return (
        <div className="eventParameterAddNewEntry">
          <select value={this.state.selectedType}
            onChange={this.onTypeChange}>
            <option></option>
            <option value="Boolean">Boolean</option>
            <option value="Number">Number</option>
            <option value="+Number">Positive Number</option>
            {/* <option value="Space">Space</option> */}
          </select>
          <input type="text" placeholder="Name"
            value={this.state.name}
            onChange={this.onNameChange} />
          <Button onClick={this.onAddClick}>Add</Button>
        </div>
      );
    }

    onNameChange = (event) => {
      const newName = event.target.value;

      // Can only contain valid characters for a assembler label
      if (!newName.match(PP64.adapters.events.CustomAsmHelper.validParameterNameRegex))
        return;

      this.setState({ name: newName });
    }

    onTypeChange = (event) => {
      this.setState({ selectedType: event.target.value });
    }

    onAddClick = () => {
      if (!this.state.name || !this.state.selectedType)
        return;

      this.props.onAddEntry({
        name: this.state.name,
        type: this.state.selectedType,
      });
      this.setState({
        name: "",
        selectedType: "",
      });
    }
  }

  return {
    CreateEventView,

    saveEvent: function() {
      const eventName = _createEventViewInstance.getEventName();
      const supportedGames = _createEventViewInstance.getSupportedGames();
      const executionType = _createEventViewInstance.getExecutionType();
      const asm = _createEventViewInstance.getEventAsm();

      if (!eventName) {
        PP64.app.showMessage("An event name must be specified.");
        return;
      }

      const existingEvent = PP64.adapters.events.getEvent(eventName);
      if (existingEvent && !existingEvent.custom) {
        PP64.app.showMessage("The event name collides with a reserved event name from the original boards.");
        return;
      }

      if (!supportedGames.length) {
        PP64.app.showMessage("At least one game must be supported.");
        return;
      }
      if (!asm) {
        PP64.app.showMessage("No assembly code was provided.");
        return;
      }

      try {
        PP64.adapters.events.createCustomEvent(asm);
      }
      catch (e) {
        PP64.app.showMessage(e.toString());
      }
    },

    createEventPromptExit: function() {
      if (_createEventViewInstance) {
        return _createEventViewInstance.promptExit();
      }
    },

    /**
     * Get the supported games for the event currently being edited.
     */
    getActiveEditorSupportedGames: function() {
      if (_createEventViewInstance) {
        return _createEventViewInstance.getSupportedGames();
      }
      return [];
    },
  };
})());