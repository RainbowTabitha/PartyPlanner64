import { Middleware } from "@reduxjs/toolkit";
import { setHighlightedSpacesAction } from "./boardState";

export const boardStateMiddleware: Middleware = store => next => action => {
  const result = next(action);

  // Clear highlighted spaces after the user does anything else.
  if (action.type !== "boardState/setHighlightedSpacesAction") {
    store.dispatch(setHighlightedSpacesAction({ spaceIndices: null }));
  }

  return result;
};
