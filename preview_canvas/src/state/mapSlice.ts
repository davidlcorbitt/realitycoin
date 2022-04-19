import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import { Feature, FeatureCollection, LineString, Polygon } from "@turf/turf";
import { featureToH3Set, h3SetToFeatureCollection } from "geojson2h3";
import { geoToH3 } from "h3-js";
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
    // TODO: abort existing requests if a new one comes in before the old one finishes.
    thunkAPI.dispatch(
      mapSlice.actions.set({
        areaOfInterest,
        aoiStreets: null,
        aoiStreetLength: null,
        mappableHexes: null,
      })
    );

    if (!areaOfInterest) return;

    const size = selectAreaOfInterestSize(thunkAPI.getState() as RootState);
    if (size && size > 12000000) thunkAPI.dispatch(settingsSlice.actions.set({ viewHexes: false }));

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
    const nearbyStreets = (await osmtogeojson(data)) as FeatureCollection<LineString>;

    const aoiHexes = new Set(selectHexagons(thunkAPI.getState() as RootState));

    const allStreetHexes = nearbyStreets.features
      .filter((street) => street.geometry.type === "LineString")
      .flatMap((street) => {
        // Split each street into 20-meter chunks. We'll use the coordinates of
        // the endpoint of each chunk to find (approximately) all the hexes it
        // passes through.
        let segments = turf.lineChunk(street, 0.02);

        const streetPoints = segments.features.map((segment) => segment.geometry.coordinates[0]);
        streetPoints.push(street.geometry.coordinates.slice(-1)[0]);
        return streetPoints.map((point) => geoToH3(point[1], point[0], 11));
      });

    const mappableHexes = Array.from(new Set(allStreetHexes)).filter((hex) => aoiHexes.has(hex));

    thunkAPI.dispatch(mapSlice.actions.set({ mappableHexes }));
  }
);

type MapState = {
  areaOfInterest: Feature<Polygon> | null;
  aoiStreets: FeatureCollection<LineString> | null;
  aoiStreetLength: number | null;
  mappableHexes: string[] | null;
};

const initialState: MapState = {
  areaOfInterest: null,
  aoiStreets: null,
  aoiStreetLength: null,
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

const selectAreaOfInterest = (state: RootState) => state.map.areaOfInterest;
export const selectAreaOfInterestSize = createSelector(selectAreaOfInterest, (aoi) =>
  aoi ? turf.area(aoi) : null
);

export const selectHexagons = createSelector(
  selectAreaOfInterest,
  (aoi) => aoi && featureToH3Set(aoi, 11)
);

export const selectHexPolygons = createSelector(
  selectHexagons,
  (hexagons) => hexagons && h3SetToFeatureCollection(hexagons)
);
