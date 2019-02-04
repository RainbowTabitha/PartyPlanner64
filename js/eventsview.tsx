import { View } from "./types";
import * as React from "react";
import { getCustomEvents, IEvent } from "./events/events";
import { ICustomEvent, createCustomEvent } from "./events/customevents";
import { changeCurrentEvent, changeView } from "./appControl";
import { IBoard, removeEventFromBoard, addEventToBoard } from "./boards";
import { removeEventFromLibrary, getEventFromLibrary, addEventToLibrary } from "./events/EventLibrary";

let _eventsViewInstance: EventsView | null;

interface IEventsViewProps {
  board: IBoard;
}

interface IEventsViewState {
  hasError: boolean;
}

/** Custom events list view */
export class EventsView extends React.Component<IEventsViewProps, IEventsViewState> {
  constructor(props: IEventsViewProps) {
    super(props);

    this.state = {
      hasError: false
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p>An error was encountered.</p>
      );
    }

    let listing = null;
    const board = this.props.board;
    const customEvents = getCustomEvents();
    if (!customEvents.length) {
      listing = (
        <tr><td>No custom events present — load or create your own!</td></tr>
      );
    }
    else {
      listing = customEvents.map(customEvent => {
        const isDestructive = _copyToBoardWillOverwrite(customEvent, board);
        const isUnchanged = _boardAndLibraryEventAreInSync(customEvent, board);
        return (
          <EventRow key={customEvent.id} event={customEvent}
            onEditEvent={this.onEditEvent}
            onDeleteEvent={this.onDeleteEvent}
            isDestructiveCopy={isDestructive}
            onCopyToBoard={isUnchanged ? undefined : this.onCopyToBoard}
            />
        );
      });
    }

    let boardEvents = [];
    for (let eventName in board.events) {
      const customEvent = createCustomEvent(board.events[eventName]);
      const isDestructive = _copyToLibraryWillOverwrite(customEvent);
      const isUnchanged = _boardAndLibraryEventAreInSync(customEvent, board);
      boardEvents.push(
        <EventRow key={eventName} event={customEvent}
          onEditEvent={this.onEditBoardEvent}
          onDeleteEvent={this.onDeleteBoardEvent}
          isDestructiveCopy={isDestructive}
          onCopyToLibrary={isUnchanged ? undefined : this.onCopyToLibrary} />
      );
    }

    return (
      <div className="eventsViewContainer">
        <h3>Events for {this.props.board.name}</h3>
          {boardEvents.length ?
            <EventEntryTable listing={boardEvents} /> :
            <p>No events are associated with this board.</p>
          }
        <h3>
          <img src="img/events/library.png" className="eventsViewHeaderIcon"></img>
          {" "}
          Event Library
        </h3>
        <EventEntryTable listing={listing} />
      </div>
    );
  }

  componentDidMount() {
    _eventsViewInstance = this;
  }

  componentWillUnmount() {
    _eventsViewInstance = null;
  }

  componentDidCatch(error: any) {
    this.setState({ hasError: true });
    console.error(error);
  }

  onEditEvent = (event: IEvent) => {
    changeCurrentEvent(event);
    changeView(View.CREATEEVENT);
  }

  onEditBoardEvent = (event: IEvent) => {
    changeCurrentEvent(event, this.props.board);
    changeView(View.CREATEEVENT);
  }

  onDeleteEvent = (event: IEvent) => {
    if (window.confirm(`Are you sure you want to delete ${event.name}?`)) {
      removeEventFromLibrary(event.id);
      this.forceUpdate();
    }
  }

  onDeleteBoardEvent = (event: IEvent) => {
    if (window.confirm(`Are you sure you want to delete ${event.name}?`)) {
      removeEventFromBoard(this.props.board, event.id);
      this.forceUpdate();
    }
  }

  onCopyToBoard = (event: ICustomEvent, isDestructiveCopy: boolean) => {
    let proceed = true;
    if (isDestructiveCopy) {
      proceed = window.confirm(`Are you sure you want to overwrite the board's copy of ${event.id}? The two copies are different.`);
    }
    if (proceed) {
      addEventToBoard(this.props.board, event.id, event.asm);
      this.forceUpdate();
    }
  }

  onCopyToLibrary = (event: ICustomEvent, isDestructiveCopy: boolean) => {
    let proceed = true;
    if (isDestructiveCopy) {
      proceed = window.confirm(`Are you sure you want to overwrite the library's copy of ${event.id}? The two copies are different.`);
    }
    if (proceed) {
      addEventToLibrary(event);
      this.forceUpdate();
    }
  }
}

function EventEntryTable(props: { listing: any }) {
  return (
    <table className="eventsViewTable">
      {Array.isArray(props.listing) ? (
        <thead>
          <tr>
            <th className="eventsViewTableIconColumn"></th>
            <th className="eventsViewTableIconColumn"></th>
            <th className="eventsViewTableIconColumn"></th>
            <th></th>
          </tr>
        </thead>
      ) : null }
      <tbody>
        {props.listing}
      </tbody>
    </table>
  )
}

function _copyToBoardWillOverwrite(customEvent: ICustomEvent, board: IBoard): boolean {
  if (!board.events || !(customEvent.id in board.events))
    return false;
  return board.events[customEvent.id] !== customEvent.asm;
}

function _copyToLibraryWillOverwrite(customEvent: ICustomEvent): boolean {
  const libEvent = getEventFromLibrary(customEvent.id) as ICustomEvent;
  return !!libEvent && libEvent.asm !== customEvent.asm;
}

function _boardAndLibraryEventAreInSync(customEvent: ICustomEvent, board: IBoard): boolean {
  if (!board.events || !(customEvent.id in board.events))
    return false;
  const libEvent = getEventFromLibrary(customEvent.id) as ICustomEvent;
  if (!libEvent)
    return false;
  return board.events[customEvent.id] === libEvent.asm;
}

interface IEventRowProps {
  event: ICustomEvent;
  isDestructiveCopy: boolean;
  onDeleteEvent(event: ICustomEvent): any;
  onEditEvent(event: ICustomEvent): any;
  onCopyToLibrary?(event: ICustomEvent, isDestructiveCopy: boolean): void;
  onCopyToBoard?(event: ICustomEvent, isDestructiveCopy: boolean): void;
}

class EventRow extends React.Component<IEventRowProps> {
  render() {
    let copyOption;
    if (this.props.onCopyToLibrary) {
      copyOption = (
        <td>
          <img src={`img/events/copytolibrary${this.props.isDestructiveCopy ? "_destructive" : ""}.png`}
            alt="Copy this event into the local library"
            title="Copy this event into the local library"
            onClick={() => this.props.onCopyToLibrary!(this.props.event, this.props.isDestructiveCopy)} />
        </td>
      );
    }
    else if (this.props.onCopyToBoard) {
      copyOption = (
        <td>
          <img src={`img/events/copytoboard${this.props.isDestructiveCopy ? "_destructive" : ""}.png`}
            alt="Copy this event into the board file"
            title="Copy this event into the board file"
            onClick={() => this.props.onCopyToBoard!(this.props.event, this.props.isDestructiveCopy)} />
        </td>
      );
    }
    else {
      copyOption = (
        <td>
          <img src="img/events/nocopyoption.png"
            className="eventRowIconNoAction"
            alt="The event is the same in both the board and library"
            title="The event is the same in both the board and library" />
        </td>
      );
    }

    return (
      <tr className="eventTableRow">
        <td>
          <img src="img/events/delete.png"
            alt="Delete event" title="Delete event"
            onClick={() => { this.props.onDeleteEvent(this.props.event)} } />
        </td>
        <td>
          <img src="img/events/export.png"
            alt="Download event code" title="Download event code"
            onClick={this.onExportEvent} />
        </td>
        {copyOption}
        <td className="eventNameTableCell"
          onClick={() => this.props.onEditEvent(this.props.event)}>
          <span className="eventNameText">{this.props.event.name}</span>
          <img src="img/events/edit.png" className="eventEditCellIcon"
            alt="Edit event" title="Edit event"/>
        </td>
      </tr>
    );
  }

  onExportEvent = () => {
    const event = this.props.event;
    let asmBlob = new Blob([event.asm]);
    saveAs(asmBlob, event.id + ".s");
  }
}

export function refreshEventsView() {
  if (_eventsViewInstance) {
    _eventsViewInstance.forceUpdate();
  }
}