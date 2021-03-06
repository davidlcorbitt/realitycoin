import { createAsyncThunk } from "@reduxjs/toolkit";
import * as turf from "@turf/turf";
import { FeatureCollection, LineString } from "@turf/turf";
import { featureToH3Set } from "geojson2h3";
import { geoToH3 } from "h3-js";
import osmtogeojson from "osmtogeojson";
import { overpass } from "overpass-ts";
import sleep from "sleep-promise";
import mapSlice, { selectAreaOfInterestSize } from "./mapSlice";
import settingsSlice from "./settingsSlice";
import { RootState } from "./store";

// From https://h3geo.org/docs/core-library/restable/
const HEX_EDGE_LENGTH = 0.024910561;
const H3_RESOLUTION = 11;
const STREET_CHUNK_LENGTH = 0.02;

// Convert GeoJSON BBox to Overpass QL BBox
function overpassBbox(feature: turf.Feature<turf.Polygon>) {
  const bbox = turf.bbox(feature);
  return `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;
}

const DEBUG_RECALCULATE_STATS = process.env.DEBUG_RECALCULATE_STATS === "true";
function debug(...args: any[]) {
  if (DEBUG_RECALCULATE_STATS) {
    console.log(new Date(), ...args);
  }
}

const recalculateStats = createAsyncThunk<void, never, { state: RootState }>(
  "map/recalculateStats",
  async (_, { dispatch, getState }) => {
    debug("Begin recalculateStats");

    dispatch(
      mapSlice.actions.set({
        aoiHexes: null,
        mappableHexes: null,
      })
    );

    const { areaOfInterest } = getState().map;

    if (!areaOfInterest) return;

    // Give React time to update the UI and load spinners
    await sleep(500);

    // If we select a large area, turn off the viewHexes setting by default to
    // help performance.
    debug("Calculating AOI area");
    const size = selectAreaOfInterestSize(getState());
    if (size && size > 12000000) dispatch(settingsSlice.actions.set({ viewHexes: false }));

    debug("Generating set of hexes in AOI");
    // Get a slightly larger polygon so we include hexes that are only partially inside the AOI.
    const expandedAOI = turf.buffer(areaOfInterest, HEX_EDGE_LENGTH);
    const aoiHexes = new Set(featureToH3Set(expandedAOI, H3_RESOLUTION));
    dispatch(mapSlice.actions.set({ aoiHexes: Array.from(aoiHexes) }));

    debug("Fetching OSM data");

    const query = `
    [bbox:${overpassBbox(areaOfInterest)}]
    [out:json];
    ${getState().settings.overpassQuery}
    `;

    debug("Overpass query", query);

    const data = await (
      await overpass(query, { endpoint: "https://overpass.kumi.systems/api/interpreter" })
    ).json();
    debug("converting OSM to GeoJSON");
    const nearbyStreets = (await osmtogeojson(data)) as FeatureCollection<LineString>;

    debug("Calculating mappable hexes");
    const allStreetHexes = nearbyStreets.features
      .filter((street) => street.geometry.type === "LineString")
      .flatMap((street) => {
        // Split each street into 20-meter chunks. We'll use the coordinates of
        // the endpoint of each chunk to find (approximately) all the hexes it
        // passes through.
        let segments = turf.lineChunk(street, STREET_CHUNK_LENGTH);

        const streetPoints = segments.features.map((segment) => segment.geometry.coordinates[0]);
        streetPoints.push(street.geometry.coordinates.slice(-1)[0]);
        return streetPoints.map((point) => geoToH3(point[1], point[0], H3_RESOLUTION));
      });

    debug("Deduping mappable hexes");
    const mappableHexes = Array.from(new Set(allStreetHexes)).filter((hex) => aoiHexes.has(hex));

    debug("Updating store");
    dispatch(mapSlice.actions.set({ mappableHexes }));
  }
);

export default recalculateStats;
