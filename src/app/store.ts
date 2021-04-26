import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import appStateReducer from "./appState";
import blockerReducer from "./blocker";

export const store = configureStore({
  reducer: {
    app: appStateReducer,
    blocker: blockerReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
