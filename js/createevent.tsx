import * as React from "react";
import { Game, EventExecutionType, getExecutionTypeName, getGameName } from "./types";
import { ICustomEventParameter, ICustomEvent, CustomAsmHelper, createCustomEvent } from "./events/customevents";
import { CodeMirrorWrapper } from "./components/codemirrorwrapper";
import { getEvent } from "./events/events";
import { ToggleGroup, Button } from "./controls";
import { getCurrentEvent, showMessage } from "./appControl";

let _createEventViewInstance: CreateEventView | null = null;

const _defaultEventAsm = `; NAME:
; GAMES:
; EXECUTION: Direct

ADDIU SP SP -4
SW RA 0(SP)

; Your code here

LW RA 0(SP)
JR RA
ADDIU SP SP 4`;

interface ICreateEventViewState {
  eventName: string,
  supportedGames: Game[],
  executionType: EventExecutionType,
  asm: string,
  parameters: ICustomEventParameter[];
  hasError?: boolean;
}

export class CreateEventView extends React.Component<{}, ICreateEventViewState> {
  private _codemirror: CodeMirrorWrapper | null = null;

  constructor(props: {}) {
    super(props);

    const currentEvent = getCurrentEvent() as ICustomEvent;
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
        executionType: EventExecutionType.DIRECT,
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

    return (
      <div className="createEventViewContainer">
        <CodeMirrorWrapper ref={(cm) => { this._codemirror = cm; }}
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

  onEventNameChange = (eventName: string) => {
    const newState = { ...this.state, eventName };
    this.setState({ eventName });
    this.syncTextToStateVars(newState, this.state.asm);
  }

  onAsmChange = (asm: string) => {
    this.setState({ asm });
    this.syncStateVarsToText(asm);
  }

  onGameToggleClicked = (id: any, pressed: boolean) => {
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

  onExecTypeToggleClicked = (id: any, pressed: boolean) => {
    let newState = { ...this.state };
    newState.executionType = id;
    this.setState({ executionType: id });
    this.syncTextToStateVars(newState, this.state.asm);
  }

  onAddEventParameter = (entry: ICustomEventParameter) => {
    let newState = { ...this.state };
    newState.parameters = [...this.state.parameters, entry];
    this.setState(newState);
    this.syncTextToStateVars(newState, this.state.asm);
  }

  onRemoveEventParameter = (removedEntry: ICustomEventParameter) => {
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
  syncTextToStateVars = (newState: ICreateEventViewState, existingAsm: string) => {
    let newAsm = this.__clearDiscreteProperties(existingAsm, [
      "NAME", "GAMES", "EXECUTION", "PARAM"
    ]);
    newAsm = "\n" + newAsm;
    newAsm = this.__writeDiscretePropertyArray(newAsm, "PARAM", newState.parameters.map(param => {
      return `${param.type}|${param.name}`;
    }));
    newAsm = this.__writeDiscreteProperty(newAsm, "EXECUTION", getExecutionTypeName(newState.executionType));
    newAsm = this.__writeDiscreteProperty(newAsm, "GAMES", newState.supportedGames.map(getGameName).join(","));
    newAsm = this.__writeDiscreteProperty(newAsm, "NAME", newState.eventName.trim());

    if (newAsm !== existingAsm) {
      this.setState({ asm: newAsm });
    }
  }

  /** Pulls out discrete properties from the ASM text back into state. */
  syncStateVarsToText = (asm: string) => {
    let value: any | null = this.__readDiscreteProperty(asm, "NAME");
    if (value !== null) {
      this.setState({ eventName: (value || "").trim() });
    }

    value = CustomAsmHelper.readSupportedGames(asm);
    if (value !== null) {
      this.setState({ supportedGames: value });
    }

    value = CustomAsmHelper.readExecutionType(asm);
    if (value) {
      this.setState({ executionType: value });
    }

    value = CustomAsmHelper.readParameters(asm);
    if (value) {
      this.setState({ parameters: value });
    }
  }

  __clearDiscreteProperties(asm: string, properties: string[]) {
    properties.forEach(propertyName => {
      const regex = new RegExp("^\\s*[;\\/]+\\s*" + propertyName + ":.*[\r\n]*", "gim");
      asm = asm.replace(regex, "");
    });
    return asm;
  }

  __writeDiscreteProperty(asm: string, propName: string, value: string) {
    return `; ${propName}: ${value}\n` + asm;
  }

  __writeDiscretePropertyArray(asm: string, propName: string, values: string[]) {
    for (let i = values.length - 1; i >= 0; i--) {
      asm = `; ${propName}: ${values[i]}\n` + asm;
    }
    return asm;
  }

  __readDiscreteProperty(asm: string, propName: string) {
    return CustomAsmHelper.readDiscreteProperty(asm, propName);
  }

  promptExit = () => {
    const asm = this.state.asm;
    const oldEvent = getEvent(this.state.eventName.toUpperCase()) as ICustomEvent;
    if (!oldEvent || (oldEvent.asm && oldEvent.asm !== asm)) {
      return !!window.confirm("Are you sure you want to exit without saving the event?");
    }
    return true;
  }
}

interface IEventDetailsFormProps {
  name: string;
  supportedGames: Game[];
  executionType: EventExecutionType;
  parameters: ICustomEventParameter[];
  onGameToggleClicked(id: any, pressed: boolean): any;
  onExecTypeToggleClicked(id: any, pressed: boolean): any;
  onAddEventParameter(parameter: ICustomEventParameter): any;
  onRemoveEventParameter(parameter: ICustomEventParameter): any;
  onEventNameChange(name: string): any;
}

class EventDetailsForm extends React.Component<IEventDetailsFormProps> {
  render() {
    const gameToggles = [
      { id: Game.MP1_USA, text: "MP1 USA", selected: this._gameSupported(Game.MP1_USA) },
      { id: Game.MP2_USA, text: "MP2 USA", selected: this._gameSupported(Game.MP2_USA) },
      { id: Game.MP3_USA, text: "MP3 USA", selected: this._gameSupported(Game.MP3_USA) },
      { id: Game.MP1_JPN, text: "MP1 JPN", selected: this._gameSupported(Game.MP1_JPN) },
      { id: Game.MP2_JPN, text: "MP2 JPN", selected: this._gameSupported(Game.MP2_JPN) },
      { id: Game.MP3_JPN, text: "MP3 JPN", selected: this._gameSupported(Game.MP3_JPN) },
      { id: Game.MP1_PAL, text: "MP1 PAL", selected: this._gameSupported(Game.MP1_PAL) },
      { id: Game.MP2_PAL, text: "MP2 PAL", selected: this._gameSupported(Game.MP2_PAL) },
      { id: Game.MP3_PAL, text: "MP3 PAL", selected: this._gameSupported(Game.MP3_PAL) },
    ];

    const execTypeToggles = [
      { id: 1, text: "Direct", title: "The game will execute the event function directly",
        selected: this.props.executionType === EventExecutionType.DIRECT },
      { id: 2, text: "Process", title: "The game will use its process system when executing the event function",
        selected: this.props.executionType === EventExecutionType.PROCESS },
    ];

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

  onEventNameChange = (event: any) => {
    this.props.onEventNameChange(event.target.value);
  }

  _gameSupported = (game: Game) => {
    return this.props.supportedGames.indexOf(game) >= 0;
  }
}

interface IEventParametersListProps {
  parameters: ICustomEventParameter[];
  onAddEventParameter(entry: ICustomEventParameter): any;
  onRemoveEventParameter(entry: ICustomEventParameter): any;
}

class EventParametersList extends React.Component<IEventParametersListProps> {
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

interface IEventParametersEntryProps {
  entry: ICustomEventParameter;
  onRemoveEntry(entry: ICustomEventParameter): any;
}

class EventParametersEntry extends React.Component<IEventParametersEntryProps> {
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

interface IEventParametersAddNewEntryProps {
  onAddEntry(entry: ICustomEventParameter): any;
}

class EventParametersAddNewEntry extends React.Component<IEventParametersAddNewEntryProps> {
  state = {
    selectedType: "",
    name: "",
  }

  render() {
    return (
      <div className="eventParameterAddNewEntry">
        <select value={this.state.selectedType}
          onChange={this.onTypeChange}>
          <option></option>
          <option value="Boolean">Boolean</option>
          <option value="Number">Number</option>
          <option value="+Number">Positive Number</option>
          <option value="Space">Space</option>
        </select>
        <input type="text" placeholder="Name"
          value={this.state.name}
          onChange={this.onNameChange} />
        <Button onClick={this.onAddClick}>Add</Button>
      </div>
    );
  }

  onNameChange = (event: any) => {
    const newName = event.target.value;

    // Can only contain valid characters for a assembler label
    if (!newName.match(CustomAsmHelper.validParameterNameRegex))
      return;

    this.setState({ name: newName });
  }

  onTypeChange = (event: any) => {
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

export function saveEvent() {
  const eventName = _createEventViewInstance!.getEventName();
  const supportedGames = _createEventViewInstance!.getSupportedGames();
  const executionType = _createEventViewInstance!.getExecutionType();
  const asm = _createEventViewInstance!.getEventAsm();

  if (!eventName) {
    showMessage("An event name must be specified.");
    return;
  }

  const existingEvent = getEvent(eventName);
  if (existingEvent && !existingEvent.custom) {
    showMessage("The event name collides with a reserved event name from the original boards.");
    return;
  }

  if (!supportedGames.length) {
    showMessage("At least one game must be supported.");
    return;
  }
  if (!asm) {
    showMessage("No assembly code was provided.");
    return;
  }

  try {
    createCustomEvent(asm);
  }
  catch (e) {
    showMessage(e.toString());
  }
}

export function createEventPromptExit() {
  if (_createEventViewInstance) {
    return _createEventViewInstance.promptExit();
  }
}

/**
 * Get the supported games for the event currently being edited.
 */
export function getActiveEditorSupportedGames() {
  if (_createEventViewInstance) {
    return _createEventViewInstance.getSupportedGames();
  }
  return [];
}
