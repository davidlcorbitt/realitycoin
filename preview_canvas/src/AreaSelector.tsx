import MapboxDraw, { DrawModeChageEvent } from "@mapbox/mapbox-gl-draw";
import type { Feature, Polygon } from "geojson";
import { useEffect, useState } from "react";
import type { ControlPosition } from "react-map-gl";
import { useControl, useMap } from "react-map-gl";

type AreaSelectorProps = {
  position: ControlPosition;
  selectedArea: Feature<Polygon> | null;
  setSelectedArea: React.Dispatch<React.SetStateAction<Feature<Polygon> | null>>;
};

export default function AreaSelector({
  selectedArea = null,
  setSelectedArea,
  position,
}: AreaSelectorProps) {
  const map = useMap();
  const [control] = useState(
    new MapboxDraw({
      defaultMode: "draw_polygon",
      controls: { polygon: true },
      displayControlsDefault: false,
    })
  );

  useControl(() => control, { position });

  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    const clearExistingArea = (e: DrawModeChageEvent) => {
      // If you hit the polygon button again, clear the existing selected area. We only support one
      // selected area at a time.
      if (e.mode === "draw_polygon" && selectedArea) {
        control.delete(selectedArea.id as string);
        setSelectedArea(null);
      }
    };

    currentMap?.on("draw.modechange", clearExistingArea);
    return () => {
      currentMap?.off("draw.modechange", clearExistingArea);
    };
  }, [map, control, selectedArea, setSelectedArea]);
  map.current?.on("draw.create", (e) => setSelectedArea(e.features[0]));

  return null;
}
