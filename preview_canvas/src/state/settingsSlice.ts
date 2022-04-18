import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SettingsState = {
  viewHexes: boolean;
  viewMappableFeatures: boolean;
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    viewHexes: false,
    viewMappableFeatures: true,
  } as SettingsState,
  reducers: {
    set: (state, action: PayloadAction<Partial<SettingsState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export default settingsSlice;
