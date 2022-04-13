import React, { useCallback, useEffect, useRef, useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import geojson2h3 from "geojson2h3";
// import {polyfill} from "h3-js";
import MapGL, { ViewStateChangeEvent } from "react-map-gl";
import GeocoderControl from "./GeocoderControl";
import mapboxgl from "mapbox-gl";

const config = {
  fillOpacity: 0.6,
  colorScale: ["#ffffcc", "#78c679", "#5DADE2"],
};

function renderPerimeter(map: mapboxgl.Map) {
  const bounds = map.getBounds();
  const mapPolygon = [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ];

  const polygon = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [mapPolygon.concat([bounds.getNorthWest().toArray()])],
    },
  };

  const mapHexagons = geojson2h3.featureToH3Set(polygon, 11);

  // Transform the current hexagon map into a GeoJSON object
  // const geojson = geojson2h3.h3SetToFeature(
  //   Object.keys(hexagons).filter(hex => hexagons[hex] > threshold)
  // );
  const geojson = geojson2h3.h3SetToMultiPolygonFeature(mapHexagons);

  //   console.log(geojson)

  const sourceId = "h3-hex-perimeter";
  const layerId = `${sourceId}-layer`;
  let source = map.getSource(sourceId);

  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: "line",
      interactive: false,
      paint: {
        "line-width": 1,
        "line-color": config.colorScale[2],
      },
    });
    source = map.getSource(sourceId);
  }

  // Update the geojson data
  source.setData(geojson);
}

const MapView = () => {
  const map = useRef<typeof MapGL>(null);
  const [lng, setLng] = useState(-122.005766);
  const [lat, setLat] = useState(37.585621);
  const [zoom, setZoom] = useState(15);

  function renderBlocks(map: any, hexagons: any) {
    // Transform the current hexagon map into a GeoJSON object
    const geojson = geojson2h3.h3SetToFeatureCollection(Object.keys(hexagons), (hex) => ({
      value: hexagons[hex],
      name: hex,
    }));

    const sourceId = "h3-hexes";
    const layerId = `${sourceId}-layer`;
    let source = map.getSource(sourceId);

    // Add the source and layer if we haven't created them yet
    if (!source) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });
      map.addLayer({
        id: layerId,
        source: sourceId,
        type: "fill",
        interactive: false,
        paint: {
          "fill-outline-color": "rgba(0,0,0,0)",
        },
      });
      source = map.getSource(sourceId);
    }

    // Update the geojson data
    source.setData(geojson);

    // Update the layer paint properties, using the current config values
    map.setPaintProperty(layerId, "fill-color", {
      property: "value",
      stops: [
        [0, config.colorScale[0]],
        [0.5, config.colorScale[1]],
        [1, config.colorScale[1]],
      ],
    });

    map.setPaintProperty(layerId, "fill-opacity", config.fillOpacity);
  }

  const renderOverlay = useCallback(({ target }: ViewStateChangeEvent) => {
    const zoom = target.getZoom();
    if (zoom > 14) {
      renderPerimeter(target);
    } else {
      const map = target;
      const source = map.getSource("h3-hex-perimeter");
      if (source) {
        map.removeLayer("h3-hex-perimeter-layer");
        map.removeSource("h3-hex-perimeter");
      }
    }
  }, []);

  return (
    <MapGL
      initialViewState={{
        longitude: lng,
        latitude: lat,
        zoom: zoom,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      onMoveEnd={renderOverlay}
      onLoad={renderOverlay}
    >
      <GeocoderControl
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN!}
        position="top-left"
      />
    </MapGL>
  );
};

export default MapView;
