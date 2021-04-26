import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { View } from "../types";
import { RootState } from "./store";

export interface AppState {
  currentView: View;
  updateHideNotification: boolean;
}

const initialState: AppState = {
  currentView: View.EDITOR,
  updateHideNotification: false,
};

export const appStateSlice = createSlice({
  name: "appState",
  initialState,
  reducers: {
    changeViewAction: (state, action: PayloadAction<View>) => {
      state.currentView = action.payload;
    },
    setHideUpdateNotification: (state, action: PayloadAction<boolean>) => {
      state.updateHideNotification = action.payload;
    },
  },
});

export const {
  changeViewAction,
  setHideUpdateNotification,
} = appStateSlice.actions;

export const selectCurrentView = (state: RootState) => state.app.currentView;

export default appStateSlice.reducer;
