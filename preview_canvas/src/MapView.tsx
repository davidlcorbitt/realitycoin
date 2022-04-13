import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import type { Feature } from "geojson";
import geojson2h3 from "geojson2h3";
import mapboxgl, { MapboxEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useRef } from "react";
// import {polyfill} from "h3-js";
import MapGL, { ViewStateChangeEvent } from "react-map-gl";
import GeocoderControl from "./GeocoderControl";

const hexPerimeterSourceId = "h3-hex-perimeter";
const hexPerimeterLayerId = `${hexPerimeterSourceId}-layer`;

function renderHexagons(map: mapboxgl.Map) {
  const bounds = map.getBounds();
  const mapPolygon = [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ];

  const polygon: Feature = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [mapPolygon],
    },
    properties: {},
  };

  const mapHexagons = geojson2h3.featureToH3Set(polygon, 11);
  const geojson = geojson2h3.h3SetToMultiPolygonFeature(mapHexagons);

  (map.getSource(hexPerimeterSourceId) as mapboxgl.GeoJSONSource).setData(geojson);
}

const MapView = () => {
  const setupMap = useCallback(({ target }: MapboxEvent) => {
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

    renderHexagons(target);
  }, []);

  const updateOverlays = useCallback(({ target }: ViewStateChangeEvent) => {
    const showHexes = target.getZoom() > 14;
    if (showHexes) {
      target.setLayoutProperty(hexPerimeterLayerId, "visibility", "visible");
      renderHexagons(target);
    } else {
      target.setLayoutProperty(hexPerimeterLayerId, "visibility", "none");
    }
  }, []);

  return (
    <MapGL
      initialViewState={{
        longitude: -122.005766,
        latitude: 37.585621,
        zoom: 15,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      onMoveEnd={updateOverlays}
      onLoad={setupMap}
    >
      <GeocoderControl
        accessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN!}
        position="top-left"
      />
    </MapGL>
  );
};

export default MapView;
