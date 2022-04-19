import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import { Feature, FeatureCollection, LineString, Polygon } from "@turf/turf";
import { featureToH3Set, h3SetToFeatureCollection } from "geojson2h3";
import { geoToH3 } from "h3-js";
import osmtogeojson from "osmtogeojson";
import { overpass } from "overpass-ts";
import sleep from "sleep-promise";
import settingsSlice from "./settingsSlice";
import { RootState } from "./store";
import queryString from "query-string";
import { updateParam } from "./persist";

// Convert GeoJSON BBox to Overpass QL BBox
function overpassBbox(feature: turf.Feature<turf.Polygon>) {
  const bbox = turf.bbox(feature);
  return `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;
}

const DEBUG_UPDATE_AREA_OF_INTEREST = true;
function debug(...args: any[]) {
  if (DEBUG_UPDATE_AREA_OF_INTEREST) {
    // tslint:disable-next-line: no-console
    console.log(new Date(), ...args);
  }
}

export const updateAreaOfInterest = createAsyncThunk(
  "map/updateAreaOfInterest",
  async (areaOfInterest: Feature<Polygon> | null, thunkAPI) => {
    debug("starting");
    // TODO: abort existing requests if a new one comes in before the old one finishes.
    thunkAPI.dispatch(
      mapSlice.actions.set({
        areaOfInterest,
        aoiHexes: null,
        mappableHexes: null,
      })
    );

    updateParam("aoi", JSON.stringify(areaOfInterest));

    if (!areaOfInterest) return;

    // Give React time to update the UI and load spinners
    await sleep(500);

    const size = selectAreaOfInterestSize(thunkAPI.getState() as RootState);
    if (size && size > 12000000) thunkAPI.dispatch(settingsSlice.actions.set({ viewHexes: false }));

    const aoiHexes = new Set(featureToH3Set(areaOfInterest, 11));
    thunkAPI.dispatch(mapSlice.actions.set({ aoiHexes: Array.from(aoiHexes) }));
    debug("hexes");

    debug("fetching");
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
    debug("fetched");
    const nearbyStreets = (await osmtogeojson(data)) as FeatureCollection<LineString>;
    debug("nearby");

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

    debug("streetHexes");

    const mappableHexes = Array.from(new Set(allStreetHexes)).filter((hex) => aoiHexes.has(hex));

    thunkAPI.dispatch(mapSlice.actions.set({ mappableHexes }));
  }
);

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

export const selectHexagons = createSelector(
  (state: RootState) => state.map.areaOfInterest,
  (aoi) => aoi && featureToH3Set(aoi, 11)
);

export const selectHexPolygons = createSelector(
  selectHexagons,
  (hexagons) => hexagons && h3SetToFeatureCollection(hexagons)
);
