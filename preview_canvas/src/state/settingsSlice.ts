import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { updateParam } from "./persist";

type SettingsState = {
  viewHexes: boolean;
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    viewHexes: false,
  } as SettingsState,
  reducers: {
    set: (state, action: PayloadAction<Partial<SettingsState>>) => {
      if (Object.hasOwn(action.payload, "viewHexes")) {
        updateParam("viewHexes", (action.payload.viewHexes ?? false).toString());
      }
      Object.assign(state, action.payload);
    },
  },
});

export default settingsSlice;
