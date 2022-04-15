import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import { Feature, FeatureCollection, LineString, Polygon } from "@turf/turf";
import osmtogeojson from "osmtogeojson";
import { overpass } from "overpass-ts";
import settingsSlice from "./settingsSlice";
import { RootState } from "./store";

// Convert GeoJSON BBox to Overpass QL BBox
function overpassBbox(feature: turf.Feature<turf.Polygon>) {
  const bbox = turf.bbox(feature);
  // minX, minY, maxX, maxY -> south, west, north, east
  return `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;
}

export const updateAreaOfInterest = createAsyncThunk(
  "map/updateAreaOfInterest",
  async (areaOfInterest: Feature<Polygon> | null, thunkAPI) => {
    thunkAPI.dispatch(mapSlice.actions.set({ areaOfInterest, aoiStreets: null }));

    if (!areaOfInterest) return;

    const size = selectAreaOfInterestSize(thunkAPI.getState() as RootState);
    if (size && size > 12000000) thunkAPI.dispatch(settingsSlice.actions.set({ viewHexes: false }));
    if (size && size > 120000000)
      thunkAPI.dispatch(settingsSlice.actions.set({ viewMappableFeatures: false }));

    const data = await (
      await overpass(
        `
      [bbox:${overpassBbox(areaOfInterest)}]
      [out:json];
      (
        way
        ['highway']
        ['highway' !~ 'path']
        ['highway' !~ 'steps']
        ['highway' !~ 'motorway']
        ['highway' !~ 'motorway_link']
        ['highway' !~ 'raceway']
        ['highway' !~ 'bridleway']
        ['highway' !~ 'proposed']
        ['highway' !~ 'construction']
        ['highway' !~ 'elevator']
        ['highway' !~ 'bus_guideway']
        ['highway' !~ 'footway']
        ['highway' !~ 'cycleway']
        ['foot' !~ 'no']
        ['access' !~ 'private']
        ['access' !~ 'no'];
      );
      (._;>;);
      out;
            `,
        { endpoint: "https://overpass.kumi.systems/api/interpreter" }
      )
    ).json();
    const streets = (await osmtogeojson(data)) as FeatureCollection<LineString>;

    // streetLength: processed.features.reduce(
    //   (total, feature) => total + turf.length(feature),
    //   0
    // ),

    thunkAPI.dispatch(mapSlice.actions.set({ aoiStreets: streets }));
  }
);

type MapState = {
  areaOfInterest: Feature<Polygon> | null;
  aoiStreets: FeatureCollection<LineString> | null;
  aoiStreetLength: number | null;
};

const mapSlice = createSlice({
  name: "map",
  initialState: {
    areaOfInterest: null,
    aoiStreets: null,
  } as MapState,
  reducers: {
    set: (state, action: PayloadAction<Partial<MapState>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export default mapSlice;

const selectAreaOfInterest = (state: RootState) => state.map.areaOfInterest;
export const selectAreaOfInterestSize = createSelector(selectAreaOfInterest, (aoi) =>
  aoi ? turf.area(aoi) : null
);

export const selectCanViewHexes = createSelector(
  selectAreaOfInterestSize,
  (aoiSize) => aoiSize && aoiSize < 12000000
);

export const selectCanViewFeatures = createSelector(
  selectAreaOfInterestSize,
  (aoiSize) => aoiSize && aoiSize < 120000000
);
