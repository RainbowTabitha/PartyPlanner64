import { EventMap, IEvent } from "../../../packages/lib/events/events";
import {
  addEventToLibraryAction,
  removeEventFromLibraryAction,
  selectEventLibrary,
} from "../boardState";
import { store } from "../store";

export class ReduxEventLibrary {
  /** Adds an event to the global event library. */
  public addEventToLibrary(event: IEvent) {
    store.dispatch(addEventToLibraryAction({ event }));
  }

  public removeEventFromLibrary(eventId: string) {
    store.dispatch(removeEventFromLibraryAction({ eventId }));
  }

  public getEventFromLibrary(id: string): IEvent | undefined {
    return selectEventLibrary(store.getState())[id];
  }

  public getEventsInLibrary(): EventMap {
    return selectEventLibrary(store.getState());
  }
}
