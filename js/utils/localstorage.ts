namespace PP64.utils {
  export class localstorage {
    /** Get boards that were saved the last time the browser window closed. */
    public static getSavedBoards(): PP64.boards.IBoard[] | null {
      let boards: string | PP64.boards.IBoard[] | null = window.localStorage && localStorage.getItem("boards");
      if (boards) {
        boards = JSON.parse(boards);
      }
      if (!boards || !boards.length) {
        return null;
      }
      return boards as PP64.boards.IBoard[];
    }

    /** Get events that were saved the last time the browser window closed. */
    public static getSavedEvents() {
      let events = window.localStorage && localStorage.getItem("events");
      if (events) {
        events = JSON.parse(events);
      }
      if (!events || !events.length) {
        return null;
      }
      return events;
    }
  }

  /**
   * Saves off data when the user is about to close the window.
   * If the saving fails (common, size limitations) then prompt.
   */
  window.addEventListener("beforeunload", function(event) {
    let failed = false;
    if (window.localStorage) {
      // Save off the current events (first, since they're very small)
      const events = (PP64 as any).adapters.events.getCustomEvents();
      try {
        localStorage.setItem("events", JSON.stringify(events));
      }
      catch (e) {
        failed = true;
      }

      // Save off the current boards.
      let boards = (PP64 as any).boards.getBoards();
      let myBoards = boards.filter((val: any) => {
        return !(PP64 as any).boards.boardIsROM(val);
      });
      try {
        localStorage.setItem("boards", JSON.stringify(myBoards));
      }
      catch (e) {
        // Browsers don't really let you save much...
        failed = true;
      }
    }
    else {
      failed = true;
    }

    if (failed) {
      let msg = "Cannot save all your boards. Return to the editor and export them?";
      event.returnValue = msg;
      return msg;
    }
  });
}
