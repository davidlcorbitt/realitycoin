import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { updateParam } from "./persist";
import recalculateStats from "./recalculateStats";
import { RootState } from "./store";

type SettingsState = {
  viewHexes: boolean;
  overpassQuery: string;
};

export const setOverpassQuery = createAsyncThunk<void, string, { state: RootState }>(
  "map/setOverpassQuery",
  async (overpassQuery, { dispatch }) => {
    dispatch(
      settingsSlice.actions.set({
        overpassQuery,
      })
    );
    // Sync the current AOI to the URL params
    updateParam("overpassQuery", overpassQuery);

    dispatch(recalculateStats());
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    viewHexes: false,
    overpassQuery: `(
  way
  ['highway']
  ['highway' !~ 'steps']
  ['highway' !~ 'motorway']
  ['highway' !~ 'motorway_link']
  ['highway' !~ 'raceway']
  ['highway' !~ 'bridleway']
  ['highway' !~ 'proposed']
  ['highway' !~ 'construction']
  ['highway' !~ 'elevator']
  ['highway' !~ 'bus_guideway']
  ['foot' !~ 'no']
  ['access' !~ 'private']
  ['access' !~ 'no'];
);
(._;>;);
out;`,
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
