import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import undoable, { excludeAction, groupByActionTypes } from 'redux-undo';
import appStateReducer from "./appState";
import boardStateReducer, { addEventToLibraryAction, clearSelectedSpacesAction, setHighlightedSpacesAction, setHoveredBoardEventIndexAction, setSelectedSpaceAction, setSelectedSpacesAction, setSelectionBoxCoordsAction, setSpacePositionsAction, setSpaceRotationAction, setTemporaryUIConnections } from "./boardState";
import blockerReducer from "./blocker";
import { boardStateMiddleware } from "./middleware";

const undoableBoardStateReducer = undoable(boardStateReducer, {
  ignoreInitialState: true,
  debug: true,
  groupBy: groupByActionTypes([
    setSpacePositionsAction.type,
    setSpaceRotationAction.type,
  ]),
  filter: excludeAction([
    addEventToLibraryAction.type,
    clearSelectedSpacesAction.type,
    setSelectedSpaceAction.type,
    setSelectedSpacesAction.type,
    setSelectionBoxCoordsAction.type,
    setHighlightedSpacesAction.type,
    setHoveredBoardEventIndexAction.type,
    setTemporaryUIConnections.type,
  ])
});

export const store = configureStore({
  reducer: {
    app: appStateReducer,
    blocker: blockerReducer,
    data: undoableBoardStateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: [
          "payload.event.parse",
          "payload.event.write",
          "payload.onConfirmed",
          "payload.onSubmit",
        ],
        ignoredPaths: [
          "blocker.onBlockerFinished",
          "data.present.eventLibrary",
          "data.past",
          "data.future",
          "data._latestUnfiltered",
        ],
      },
    }).concat(boardStateMiddleware),
});

(window as any)._pp64Store = store;

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
