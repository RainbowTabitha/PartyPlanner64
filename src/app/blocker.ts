import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export interface BlockerState {
  blocked: boolean;
  prompt: boolean;
  confirm: boolean;
  message: string;
  messageHTML: string;
  onBlockerFinished?(value?: string): void;
}

const initialState: BlockerState = {
  blocked: false,
  prompt: false,
  confirm: false,
  message: "",
  messageHTML: "",
  onBlockerFinished: undefined,
};

export const blockerSlice = createSlice({
  name: "blocker",
  initialState,
  reducers: {
    blockUI: (state, action: PayloadAction<boolean>) => {
      state.blocked = action.payload;
    },
    showMessageAction: (state, action: PayloadAction<string | undefined>) => {
      const message = action.payload;
      state.blocked = !!message;
      state.prompt = false;
      state.confirm = false;
      state.message = message || "";
      state.messageHTML = "";
      state.onBlockerFinished = undefined;
    },
    showMessageHTMLAction: (state, action: PayloadAction<string | undefined>) => {
      const html = action.payload;
      state.blocked = !!html;
      state.prompt = false;
      state.confirm = false;
      state.message = "";
      state.messageHTML = html || "";
      state.onBlockerFinished = undefined;
    },
    confirmFromUserAction: (state, action: PayloadAction<{
      message: string,
      onConfirmed: (value?: string) => void
    }>) => {
      const { message, onConfirmed } = action.payload;
      state.blocked = true;
      state.prompt = false;
      state.confirm = true;
      state.message = message || "";
      state.messageHTML = "";
      state.onBlockerFinished = onConfirmed;
    },
    promptUserAction: (state, action: PayloadAction<{
      message: string,
      onSubmit: (value?: string) => void
    }>) => {
      const { message, onSubmit } = action.payload;
      state.blocked = true;
      state.prompt = true;
      state.confirm = false;
      state.message = message || "";
      state.messageHTML = "";
      state.onBlockerFinished = onSubmit;
    },
  },
});

export const {
  blockUI,
  showMessageAction,
  showMessageHTMLAction,
  confirmFromUserAction,
  promptUserAction,
} = blockerSlice.actions;

export const selectBlocked = (state: RootState) => state.blocker.blocked;
export const selectMessage = (state: RootState) => state.blocker.message;
export const selectMessageHTML = (state: RootState) => state.blocker.messageHTML;
export const selectPrompt = (state: RootState) => state.blocker.prompt;
export const selectConfirm = (state: RootState) => state.blocker.confirm;
export const selectOnBlockerFinished = (state: RootState) => state.blocker.onBlockerFinished;

export default blockerSlice.reducer;
