import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import type { Feature, Polygon } from "geojson";
import geojson2h3 from "geojson2h3";
import mapboxgl, { LngLatBounds, MapboxEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {polyfill} from "h3-js";
import MapGL, { MapRef } from "react-map-gl";
import AreaSelector from "./AreaSelector";
import GeocoderControl from "./GeocoderControl";
import * as turf from "@turf/turf";

const hexPerimeterSourceId = "h3-hex-perimeter";
const hexPerimeterLayerId = `${hexPerimeterSourceId}-layer`;

function renderHexagons(map: mapboxgl.Map, areaOfInterest: Feature<Polygon>) {
  const mapHexagons = geojson2h3.featureToH3Set(areaOfInterest, 11);
  const geojson = geojson2h3.h3SetToMultiPolygonFeature(mapHexagons);

  (map.getSource(hexPerimeterSourceId) as mapboxgl.GeoJSONSource).setData(geojson);
}

const MapView = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedArea, setSelectedArea] = useState<Feature<Polygon> | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<LngLatBounds | null>(null);

  const areaOfInterest = useMemo<Feature<Polygon> | null>(
    () =>
      selectedArea
        ? selectedArea
        : visibleBounds
        ? {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  visibleBounds.getNorthWest().toArray(),
                  visibleBounds.getNorthEast().toArray(),
                  visibleBounds.getSouthEast().toArray(),
                  visibleBounds.getSouthWest().toArray(),
                ],
              ],
            },
            properties: {},
          }
        : null,
    [selectedArea, visibleBounds]
  );

  const setupMap = useCallback(({ target }: MapboxEvent) => {
    setVisibleBounds(target.getBounds());

    target.addSource(hexPerimeterSourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
    target.addLayer({
      id: hexPerimeterLayerId,
      source: hexPerimeterSourceId,
      type: "line",
      interactive: false,
      paint: {
        "line-width": 1,
        "line-color": "#5DADE2",
      },
    });
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!areaOfInterest || !map) return;

    // Only show hexes if the selected area isn't too big for performance reasons.
    const showHexes = turf.area(areaOfInterest) < 12000000;
    map.setLayoutProperty(hexPerimeterLayerId, "visibility", showHexes ? "visible" : "none");

    if (showHexes) renderHexagons(map, areaOfInterest);
  }, [areaOfInterest, mapRef]);

  return (
    <MapGL
      initialViewState={{
        longitude: -122.005766,
        latitude: 37.585621,
        zoom: 15,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      onMoveEnd={({ target }) => setVisibleBounds(target.getBounds())}
      onLoad={setupMap}
      ref={mapRef}
    >
      <GeocoderControl
        accessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN!}
        position="top-left"
      />
      <AreaSelector
        position="top-right"
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
      />
    </MapGL>
  );
};

export default MapView;
