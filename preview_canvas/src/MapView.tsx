import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import MapGL, { Layer, Source } from "react-map-gl";
import AreaSelector from "./AreaSelector";
import GeocoderControl from "./GeocoderControl";
import { selectHexPolygons } from "./state/mapSlice";
import { useAppSelector } from "./state/store";

const MapView = () => {
  const mapState = useAppSelector((state) => state.map);
  const settings = useAppSelector((state) => state.settings);
  const hexPolygons = useAppSelector(selectHexPolygons);

  return (
    <MapGL
      initialViewState={{
        longitude: -122.005766,
        latitude: 37.585621,
        zoom: 15,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
    >
      {hexPolygons && settings.viewHexes && (
        <Source id="hexes" type="geojson" data={hexPolygons}>
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
      <AreaSelector position="top-right" />
    </MapGL>
  );
};

export default MapView;
