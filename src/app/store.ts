import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import appStateReducer from "./appState";
import boardStateReducer from "./boardState";
import blockerReducer from "./blocker";
import { boardStateMiddleware } from "./middleware";

export const store = configureStore({
  reducer: {
    app: appStateReducer,
    blocker: blockerReducer,
    data: boardStateReducer,
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
          "data.eventLibrary",
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
