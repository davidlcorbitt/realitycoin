// @ts-nocheck
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import geojson2h3 from "geojson2h3";
// import {polyfill} from "h3-js";
import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import React, { useCallback, useEffect, useRef, useState } from "react";
import MapGL, { ViewStateChangeEvent } from "react-map-gl";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapView = () => {
  const map = useRef<MapGL>(null);
  const [lng, setLng] = useState(-122.005766);
  const [lat, setLat] = useState(37.585621);
  const [zoom, setZoom] = useState(15);

  const config = {
    fillOpacity: 0.6,
    colorScale: ["#ffffcc", "#78c679", "#5DADE2"],
  };

  function renderBlocks(map: any, hexagons: any) {
    console.log(hexagons);
    // Transform the current hexagon map into a GeoJSON object
    const geojson = geojson2h3.h3SetToFeatureCollection(Object.keys(hexagons), (hex) => ({
      value: hexagons[hex],
      name: hex,
    }));

    console.log(geojson);

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

  function renderPerimeter(map: any, hexagons: any) {
    // Transform the current hexagon map into a GeoJSON object
    // const geojson = geojson2h3.h3SetToFeature(
    //   Object.keys(hexagons).filter(hex => hexagons[hex] > threshold)
    // );
    const geojson = geojson2h3.h3SetToMultiPolygonFeature(hexagons);

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

  // useEffect(() => {
  //   // set up map
  //   if (map.current) return; // initialize map only once
  //   map.current = new mapboxgl.Map({
  //     // container: mapContainer.current,
  //     container: "map",
  //     style: "mapbox://styles/mapbox/streets-v11",
  //     center: [lng, lat],
  //     zoom: zoom,
  //     // onload:
  //   });

  //   // add location bar
  //   map.current.addControl(
  //     new MapboxGeocoder({
  //       accessToken: mapboxgl.accessToken,
  //       mapboxgl: mapboxgl,
  //     })
  //   );

  //   //add navigation
  //   map.current.addControl(new mapboxgl.NavigationControl());

  //   //   render hexagons
  //   const renderAll = () => {
  //     // get current map view bounds for creating hexagon math
  //     const mapGeo = map.current.getBounds();

  //     const mapPolygon = [
  //       mapGeo.getNorthWest().toArray(),
  //       mapGeo.getNorthEast().toArray(),
  //       mapGeo.getSouthEast().toArray(),
  //       mapGeo.getSouthWest().toArray(),
  //     ];

  //     const polygon = {
  //       type: "Feature",
  //       geometry: {
  //         type: "Polygon",
  //         coordinates: [mapPolygon.concat([mapGeo.getNorthWest().toArray()])],
  //       },
  //     };

  //     const mapHexagons = geojson2h3.featureToH3Set(polygon, 11);
  //     console.log("Finished math");
  //     // render hexes

  //     renderPerimeter(map.current, mapHexagons);
  //   };

  //   map.current.on("load", function () {
  //     renderAll();
  //   });

  //   map.current.on("move", () => {
  //     renderAll();
  //   });

  //   map.current.on("click", "h3-hexes-layer", (e) => {
  //     // console.log(e)
  //     // console.log(e.features[0].properties)
  //     handleOpen(e.features[0].properties.name);
  //   });
  // });

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    setTimeout(() => map.current.resize(), 100);
    // map.current.resize();
  });

  // set rsuite drawer
  const [size, setSize] = React.useState("lg");
  const [open, setOpen] = React.useState(false);
  // const [placement, setPlacement] = React.useState();
  const [h3_11_block, setH3_11_block] = React.useState(false);

  const handleOpen = (address) => {
    setOpen(true);
    setH3_11_block(address);
  };

  const renderOverlay = useCallback(
    ({ target }: ViewStateChangeEvent) => {
      const bounds = target.getBounds();
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

      renderPerimeter(target, mapHexagons);
    },
    [renderPerimeter]
  );

  return (
    <MapGL
      initialViewState={{
        longitude: lng,
        latitude: lat,
        zoom: zoom,
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      onMove={() => console.log("moved")}
      onMoveEnd={renderOverlay}
      onLoad={renderOverlay}
      ref={map}
    />
  );
};

export default MapView;
