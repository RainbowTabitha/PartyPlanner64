import { useMemo } from "react";
import { ICustomEvent } from "../../../packages/lib/events/customevents";
import { EventMap } from "../../../packages/lib/events/events";
import { copyObject } from "../../../packages/lib/utils/obj";
import { selectEventLibrary } from "../boardState";
import { useAppSelector } from "../hooks";

export function useLibraryEvents(): EventMap {
  return useAppSelector(selectEventLibrary);
}

export function useCustomEvents(): ICustomEvent[] {
  const libraryEvents = useLibraryEvents();
  return useMemo(() => {
    const events = [];
    for (const id in libraryEvents) {
      const event = libraryEvents[id];
      if (event.custom) events.push(copyObject(event));
    }
    return events;
  }, [libraryEvents]);
}
