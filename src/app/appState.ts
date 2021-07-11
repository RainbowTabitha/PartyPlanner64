import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Action, View } from "../types";
import { RootState } from "./store";

export interface AppState {
  currentView: View;
  currentAction: Action;
  updateHideNotification: boolean;
  notifications: React.ReactElement<Notification>[];
  overrideBg: string | null;
  romLoaded: boolean;
  updateExists: boolean;
  imagesLoaded: boolean;
}

const initialState: AppState = {
  currentView: View.EDITOR,
  currentAction: Action.MOVE,
  updateHideNotification: false,
  notifications: [],
  overrideBg: null,
  romLoaded: false,
  updateExists: false,
  imagesLoaded: false,
};

export const appStateSlice = createSlice({
  name: "appState",
  initialState,
  reducers: {
    changeViewAction: (state, action: PayloadAction<View>) => {
      state.currentView = action.payload;
    },
    changeCurrentActionAction: (state, action: PayloadAction<Action>) => {
      state.currentAction = action.payload;
    },
    setHideUpdateNotification: (state, action: PayloadAction<boolean>) => {
      state.updateHideNotification = action.payload;
    },
    addNotificationAction: (state, action: PayloadAction<{
      notification: React.ReactElement<Notification>
    }>) => {
      const { notification } = action.payload;
      if (!state.notifications.find(jsx => jsx.key === notification.key)) {
        (state.notifications as any[]).push(notification);
      }
    },
    removeNotificationAction: (state, action: PayloadAction<{
      notificationKey: string
    }>) => {
      const { notificationKey } = action.payload;
      state.notifications = state.notifications.filter(jsx => jsx.key !== notificationKey);
    },
    setOverrideBgAction: (state, action: PayloadAction<string | null>) => {
      state.overrideBg = action.payload;
    },
    setRomLoadedAction: (state, action: PayloadAction<boolean>) => {
      state.romLoaded = action.payload;
    },
    setUpdateExistsAction: (state, action: PayloadAction<boolean>) => {
      state.updateExists = action.payload;
    },
    setImagesLoadedAction: (state, action: PayloadAction<boolean>) => {
      state.imagesLoaded = action.payload;
    },
  },
});

export const {
  changeViewAction,
  changeCurrentActionAction,
  setHideUpdateNotification,
  addNotificationAction,
  removeNotificationAction,
  setOverrideBgAction,
  setRomLoadedAction,
  setUpdateExistsAction,
  setImagesLoadedAction,
} = appStateSlice.actions;

export const selectCurrentView = (state: RootState) => state.app.currentView;

export const selectCurrentAction = (state: RootState) => state.app.currentAction;

export const selectRomLoaded = (state: RootState) => state.app.romLoaded;

export const selectUpdateExists = (state: RootState) => state.app.updateExists;

export const selectNotifications = (state: RootState) => state.app.notifications;

export default appStateSlice.reducer;
