import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import {
  Feature,
  featureCollection,
  FeatureCollection,
  LineString,
  MultiLineString,
  Polygon,
} from "@turf/turf";
import osmtogeojson from "osmtogeojson";
import { overpass } from "overpass-ts";
import settingsSlice from "./settingsSlice";
import { RootState } from "./store";
import geojson2h3, { h3SetToFeatureCollection } from "geojson2h3";

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
    if (size && size > 100000000)
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
    console.log("have data");
    const nearbyStreets = (await osmtogeojson(data)) as FeatureCollection<LineString>;
    console.log("converted");

    const streetSegmentsInAOI: Feature<LineString>[] = [];
    nearbyStreets.features.forEach((street) => {
      if (street.geometry.type !== "LineString") return;

      let segments = turf.lineSplit(street, areaOfInterest);
      const streetStartsInAOI = turf.booleanPointInPolygon(
        turf.point(street.geometry.coordinates[0]),
        areaOfInterest
      );
      if (segments.features.length === 0)
        return streetStartsInAOI ? streetSegmentsInAOI.push(street) : null;

      const oddPair = streetStartsInAOI ? 0 : 1;
      segments.features.forEach((segment, i) => {
        if ((i + oddPair) % 2 === 0) {
          streetSegmentsInAOI.push(segment);
        }
      });
    });
    console.log("segmeted streets");

    const aoiStreets = featureCollection(streetSegmentsInAOI);
    thunkAPI.dispatch(
      mapSlice.actions.set({
        aoiStreets: aoiStreets,
        aoiStreetLength: turf.length(aoiStreets),
      })
    );

    const hexes = selectHexPolygons(thunkAPI.getState() as RootState);
    console.log("got hexes");

    const mappableHexes = hexes?.features
      .filter((hex, i) => {
        return aoiStreets.features.some((street) => turf.booleanCrosses(hex, street));
      })
      .map((hex) => hex.id as string);
    console.log("calculated mappable hexes");
    thunkAPI.dispatch(mapSlice.actions.set({ mappableHexes }));
    console.log("dispatched mappable hexes");
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
  (aoi) => aoi && geojson2h3.featureToH3Set(aoi, 11)
);

export const selectHexPolygons = createSelector(
  selectHexagons,
  (hexagons) => hexagons && h3SetToFeatureCollection(hexagons)
);
