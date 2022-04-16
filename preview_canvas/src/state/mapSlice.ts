import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import { Feature, FeatureCollection, LineString, Polygon } from "@turf/turf";
import mapboxgl from "mapbox-gl";
import osmtogeojson from "osmtogeojson";
import { overpass } from "overpass-ts";

// Convert GeoJSON BBox to Overpass QL BBox
function overpassBbox(feature: turf.Feature<turf.Polygon>) {
  const bbox = turf.bbox(feature);
  // minX, minY, maxX, maxY -> south, west, north, east
  return `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;
}

export const updateAreaOfInterest = createAsyncThunk(
  "map/updateAreaOfInterest",
  async (areaOfInterest: Feature<Polygon> | null, thunkAPI) => {
    thunkAPI.dispatch(mapSlice.actions.setAreaOfInterest(areaOfInterest));
    thunkAPI.dispatch(mapSlice.actions.setStreetLength(null));

    if (!areaOfInterest) return;

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
        // booleanCrosses
      )
    ).json();
    const processed = (await osmtogeojson(data)) as FeatureCollection<LineString>;

    thunkAPI.dispatch(
      mapSlice.actions.setStreetLength(
        processed.features.reduce((total, feature) => total + turf.length(feature), 0)
      )
    );
  }
);

type MapState = {
  map: mapboxgl.Map | null;
  areaOfInterest: Feature<Polygon> | null;
  areaOfInterestSize: number | null;
  streetLength: number | null;
};

const mapSlice = createSlice({
  name: "map",
  initialState: {
    map: null,
    areaOfInterest: null,
    areaOfInterestSize: null,
  } as MapState,
  reducers: {
    setMap: (state, action: PayloadAction<MapState["map"]>) => {
      state.map = action.payload;
    },
    setAreaOfInterest: (state, action: PayloadAction<MapState["areaOfInterest"]>) => {
      state.areaOfInterest = action.payload;
      state.areaOfInterestSize = action.payload ? turf.area(action.payload) : null;
    },
    setStreetLength: (state, action: PayloadAction<MapState["streetLength"]>) => {
      state.streetLength = action.payload;
    },
  },
});

export default mapSlice;
