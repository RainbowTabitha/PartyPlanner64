PP64.ns("utils");

PP64.utils.localstorage = (function() {
  /** Get boards that were saved the last time the browser window closed. */
  function getSavedBoards() {
    let boards = window.localStorage && localStorage.getItem("boards");
    if (boards) {
      boards = JSON.parse(boards);
    }
    if (!boards || !boards.length) {
      return null;
    }
    return boards;
  }

  /** Get events that were saved the last time the browser window closed. */
  function getSavedEvents() {
    let events = window.localStorage && localStorage.getItem("events");
    if (events) {
      events = JSON.parse(events);
    }
    if (!events || !events.length) {
      return null;
    }
    return events;
  }

  /**
   * Saves off data when the user is about to close the window.
   * If the saving fails (common, size limitations) then prompt.
   */
  window.addEventListener("beforeunload", function(event) {
    let failed = true;
    if (window.localStorage) {
      // Save off the current events (first, since they're very small)
      const events = PP64.adapters.events.getCustomEvents();
      try {
        localStorage.setItem("events", JSON.stringify(events));
        failed = false;
      }
      catch (e) {}

      // Save off the current boards.
      let boards = PP64.boards.getBoards();
      let myBoards = boards.filter(val => {
        return !PP64.boards.boardIsROM(val);
      });
      try {
        localStorage.setItem("boards", JSON.stringify(myBoards));
        failed = false;
      }
      catch (e) {
        // Browsers don't really let you save much...
      }
    }

    if (failed) {
      let msg = "Cannot save all your boards. Return to the editor and export them?";
      event.returnValue = msg;
      return msg;
    }
  });

  return {
    getSavedBoards,
    getSavedEvents,
  };
})();
