import { View } from "./types";
import * as React from "react";
import { getCustomEvents, IEvent, removeEvent } from "./events/events";
import { ICustomEvent } from "./events/customevents";
import { changeCurrentEvent, changeView } from "./appControl";

let _eventsViewInstance: EventsView | null;

interface IEventsViewProps {
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

    const customEvents = getCustomEvents();
    if (!customEvents.length) {
      listing = (
        <tr><td>No custom events present — load or create your own!</td></tr>
      );
    }
    else {
      listing = customEvents.map(customEvent => {
        return (
          <EventRow key={customEvent.id} event={customEvent}
            onDeleteEvent={this.onDeleteEvent} />
        );
      });
    }

    return (
      <div className="eventsViewContainer">
        <h3>Events</h3>
        <table className="eventsViewTable">
          {Array.isArray(listing) ? (
            <thead>
              <tr>
                <th className="eventsViewTableIconColumn"></th>
                <th className="eventsViewTableIconColumn"></th>
                <th></th>
              </tr>
            </thead>
          ) : null }
          <tbody>
            {listing}
          </tbody>
        </table>
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

  onDeleteEvent = (event: IEvent) => {
    if (window.confirm(`Are you sure you want to delete ${event.name}?`)) {
      removeEvent(event.id);
      this.forceUpdate();
    }
  }
}

interface IEventRowProps {
  event: ICustomEvent;
  onDeleteEvent(event: ICustomEvent): any;
}

class EventRow extends React.Component<IEventRowProps> {
  render() {
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
        <td className="eventNameTableCell" onClick={this.onEditEvent}>
          <span className="eventNameText">{this.props.event.name}</span>
          <img src="img/events/edit.png" className="eventEditCellIcon"
            alt="Edit event" title="Edit event"/>
        </td>
      </tr>
    );
  }

  onEditEvent = () => {
    changeCurrentEvent(this.props.event);
    changeView(View.CREATEEVENT);
  }

  onExportEvent = () => {
    const event = this.props.event;
    let asmBlob = new Blob([event.asm]);
    saveAs(asmBlob, event.name + ".s");
  }
}

export function refreshEventsView() {
  if (_eventsViewInstance) {
    _eventsViewInstance.forceUpdate();
  }
}