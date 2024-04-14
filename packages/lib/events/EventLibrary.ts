import { EventMap, IEvent } from "./events";

export interface IEventLibrary {
  addEventToLibrary(event: IEvent): void;
  removeEventFromLibrary(eventId: string): void;
  getEventFromLibrary(id: string): IEvent | undefined;
  getEventsInLibrary(): EventMap;
}

export class BasicEventLibrary implements IEventLibrary {
  private _events: EventMap = Object.create(null);

  public addEventToLibrary(event: IEvent): void {
    this._events[event.id] = event;
  }

  public removeEventFromLibrary(eventId: string): void {
    if (!this._events[eventId]) {
      throw new Error(
        `Cannot remove event ${eventId}, as it isn't in the event library`,
      );
    }

    if (!this._events[eventId].custom) {
      throw new Error(
        `Cannot remove event ${eventId}, as it is a built-in event`,
      );
    }
  }

  public getEventFromLibrary(id: string): IEvent | undefined {
    return this._events[id];
  }

  public getEventsInLibrary() {
    return this._events;
  }
}

let _eventLibrary: IEventLibrary = new BasicEventLibrary();

export function setEventLibraryImplementation(
  eventLibrary: IEventLibrary,
): void {
  // In the web app, we may have added events to the BasicEventLibrary
  // before this call, and need to transfer them over.
  const existingEvents = _eventLibrary.getEventsInLibrary();
  for (const eventId in existingEvents) {
    eventLibrary.addEventToLibrary(existingEvents[eventId]);
  }

  _eventLibrary = eventLibrary;
}

/** Adds an event to the global event library. */
export function addEventToLibrary(event: IEvent): void {
  _eventLibrary.addEventToLibrary(event);
}

export function removeEventFromLibrary(eventId: string): void {
  _eventLibrary.removeEventFromLibrary(eventId);
}

export function getEventFromLibrary(id: string): IEvent | undefined {
  return _eventLibrary.getEventFromLibrary(id);
}

export function getEventsInLibrary(): EventMap {
  return _eventLibrary.getEventsInLibrary();
}
