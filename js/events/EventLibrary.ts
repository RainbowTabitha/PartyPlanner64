import { IEvent } from "./events";

const _events: { [id: string]: IEvent } = Object.create(null);

/** Adds an event to the global event library. */
export function addEventToLibrary(event: IEvent) {
  _events[event.id] = event;
}

export function removeEventFromLibrary(id: string) {
  if (!_events[id])
    throw new Error(`Cannot remove event ${id}, as it isn't in the event library`);

  if (!_events[id].custom)
    throw new Error(`Cannot remove event ${id}, as it is a built-in event`);

  delete _events[id];
}

export function getEventFromLibrary(id: string) {
  return _events[id];
}

export function getEventsInLibrary() {
  return _events;
}
