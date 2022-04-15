import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { bboxPolygon } from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import geojson2h3 from "geojson2h3";
import { LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useMemo, useState } from "react";
import MapGL, { Layer, Source } from "react-map-gl";
import { useDispatch } from "react-redux";
import AreaSelector from "./AreaSelector";
import GeocoderControl from "./GeocoderControl";
import { updateAreaOfInterest } from "./state/mapSlice";
import { useAppSelector } from "./state/store";

const MapView = () => {
  const [selectedArea, setSelectedArea] = useState<Feature<Polygon> | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<LngLatBounds | null>(null);
  const mapState = useAppSelector((state) => state.map);
  const settings = useAppSelector((state) => state.settings);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      updateAreaOfInterest(
        selectedArea
          ? selectedArea
          : visibleBounds
          ? bboxPolygon([
              visibleBounds.getEast(),
              visibleBounds.getNorth(),
              visibleBounds.getWest(),
              visibleBounds.getSouth(),
            ])
          : null
      )
    );
  }, [dispatch, selectedArea, visibleBounds]);

  const hexPerimeters = useMemo(() => {
    if (!mapState.areaOfInterest || !settings.viewHexes) return null;

    const mapHexagons = geojson2h3.featureToH3Set(mapState.areaOfInterest, 11);
    return geojson2h3.h3SetToMultiPolygonFeature(mapHexagons);
  }, [mapState.areaOfInterest, settings.viewHexes]);

  return (
    <MapGL
      initialViewState={{
        longitude: -122.005766,
        latitude: 37.585621,
        zoom: 15,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      onMoveEnd={({ target }) => setVisibleBounds(target.getBounds())}
      onLoad={({ target }) => setVisibleBounds(target.getBounds())}
    >
      {hexPerimeters && (
        <Source id="hexes" type="geojson" data={hexPerimeters}>
          <Layer
            type="line"
            interactive={false}
            id="hexes"
            paint={{
              "line-width": 1,
              "line-color": "#5DADE2",
            }}
          />
        </Source>
      )}
      {settings.viewMappableFeatures && mapState.aoiStreets && (
        <Source id="streets" type="geojson" data={mapState.aoiStreets}>
          <Layer type="line" id="streets" />
        </Source>
      )}

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
