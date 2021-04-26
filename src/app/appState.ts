import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { View } from "../types";
import { RootState } from "./store";

export interface AppState {
  currentView: View;
  blocked: boolean;
  updateHideNotification: boolean;
}

const initialState: AppState = {
  currentView: View.EDITOR,
  blocked: false,
  updateHideNotification: false,
};

export const appStateSlice = createSlice({
  name: "appState",
  initialState,
  reducers: {
    changeView: (state, action: PayloadAction<View>) => {
      state.currentView = action.payload;
    },
    blockUI: (state, action: PayloadAction<boolean>) => {
      state.blocked = action.payload;
    },
    setHideUpdateNotification: (state, action: PayloadAction<boolean>) => {
      state.updateHideNotification = action.payload;
    },
  },
});

export const {
  changeView,
  blockUI,
  setHideUpdateNotification,
} = appStateSlice.actions;

export const selectCurrentView = (state: RootState) => state.app.currentView;
export const selectBlocked = (state: RootState) => state.app.blocked;

export default appStateSlice.reducer;
