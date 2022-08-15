import {
  addEventToLibraryAction,
  EventMap,
  removeEventFromLibraryAction,
  selectEventLibrary,
} from "../app/boardState";
import { useAppSelector } from "../app/hooks";
import { store } from "../app/store";
import { IEvent } from "./events";

/** Adds an event to the global event library. */
export function addEventToLibrary(event: IEvent) {
  store.dispatch(addEventToLibraryAction({ event }));
}

export function removeEventFromLibrary(eventId: string) {
  store.dispatch(removeEventFromLibraryAction({ eventId }));
}

export function getEventFromLibrary(id: string): IEvent | undefined {
  return selectEventLibrary(store.getState())[id];
}

export function getEventsInLibrary(): EventMap {
  return selectEventLibrary(store.getState());
}

export function useLibraryEvents(): EventMap {
  return useAppSelector(selectEventLibrary);
}
