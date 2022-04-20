import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import { Feature, Polygon } from "@turf/turf";
import { featureToH3Set, h3SetToFeatureCollection } from "geojson2h3";
import { updateParam } from "./persist";
import recalculateStats from "./recalculateStats";
import { RootState } from "./store";

export const setAreaOfInterest = createAsyncThunk<
  void,
  Feature<Polygon> | null,
  { state: RootState }
>("map/setAreaOfInterest", async (aoi, { dispatch }) => {
  dispatch(mapSlice.actions.set({ areaOfInterest: aoi }));

  // Sync the current AOI to the URL params
  updateParam("aoi", JSON.stringify(aoi));

  dispatch(recalculateStats());
});

type MapState = {
  areaOfInterest: Feature<Polygon> | null;
  aoiHexes: string[] | null;
  mappableHexes: string[] | null;
};

const initialState: MapState = {
  areaOfInterest: null,
  aoiHexes: null,
  mappableHexes: null,
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    set: (state, action: PayloadAction<Partial<MapState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export default mapSlice;

export const selectAreaOfInterestSize = createSelector(
  (state: RootState) => state.map.areaOfInterest,
  (aoi) => (aoi ? turf.area(aoi) : null)
);

export const selectHexPolygons = createSelector(
  (state: RootState) => state.map.aoiHexes,
  (hexagons) => hexagons && h3SetToFeatureCollection(hexagons)
);
