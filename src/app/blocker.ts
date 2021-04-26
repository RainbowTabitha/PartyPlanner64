import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export interface BlockerState {
  blocked: boolean;
}

const initialState: BlockerState = {
  blocked: false,
};

export const blockerSlice = createSlice({
  name: "blocker",
  initialState,
  reducers: {
    blockUI: (state, action: PayloadAction<boolean>) => {
      state.blocked = action.payload;
    },
  },
});

export const {
  blockUI,
} = blockerSlice.actions;

export const selectBlocked = (state: RootState) => state.blocker.blocked;

export default blockerSlice.reducer;
