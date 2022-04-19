import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { cloneDeep } from "lodash";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo } from "react";
import MapGL, { Layer, Source } from "react-map-gl";
import AreaSelector from "./AreaSelector";
import GeocoderControl from "./GeocoderControl";
import { selectHexPolygons } from "./state/mapSlice";
import { useAppSelector } from "./state/store";

const MapView = () => {
  const mapState = useAppSelector((state) => state.map);
  const settings = useAppSelector((state) => state.settings);
  const selectedHexagons = useAppSelector(selectHexPolygons);

  const hexSource = useMemo(() => {
    if (!settings.viewHexes || !selectedHexagons) return null;

    const mappableHexes = new Set(mapState.mappableHexes);

    const hexes = cloneDeep(selectedHexagons);
    hexes.features.forEach((hex) => {
      let color = "rgba(0, 0, 0, 0)";
      if (mappableHexes.has(hex.id as string)) {
        color = "rgba(0,100,0,0.5)";
      }
      // @ts-expect-error
      hex.properties["fill"] = color;
    });
    return hexes;
  }, [settings.viewHexes, mapState.mappableHexes, selectedHexagons]);

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
      {hexSource && (
        <Source id="hexes" type="geojson" data={hexSource}>
          <Layer
            type="fill"
            interactive={false}
            id="hexes"
            paint={{
              "fill-outline-color": "#5DADE2",
              "fill-color": ["get", "fill"],
            }}
          />
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
