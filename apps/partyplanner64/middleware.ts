import { Middleware } from "@reduxjs/toolkit";
import {
  selectHighlightedSpaceIndices,
  setHighlightedSpacesAction,
} from "./boardState";

export const boardStateMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);

    // Clear highlighted spaces after the user does anything else.
    if (!setHighlightedSpacesAction.match(action)) {
      if (selectHighlightedSpaceIndices(store.getState())) {
        store.dispatch(setHighlightedSpacesAction({ spaceIndices: null }));
      }
    }

    return result;
  };
