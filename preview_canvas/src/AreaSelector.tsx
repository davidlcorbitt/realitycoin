import MapboxDraw, { DrawModeChageEvent } from "@mapbox/mapbox-gl-draw";
import { useEffect, useState } from "react";
import type { ControlPosition } from "react-map-gl";
import { useControl, useMap } from "react-map-gl";
import { useDispatch } from "react-redux";
import { updateAreaOfInterest } from "./state/mapSlice";
import { useAppSelector } from "./state/store";

type AreaSelectorProps = {
  position: ControlPosition;
};

export default function AreaSelector({ position }: AreaSelectorProps) {
  const map = useMap();
  const areaOfInterest = useAppSelector((state) => state.map.areaOfInterest);
  const dispatch = useDispatch();

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
      if (e.mode === "draw_polygon" && areaOfInterest) {
        control.delete(areaOfInterest.id as string);
        dispatch(updateAreaOfInterest(null));
      }
    };

    currentMap?.on("draw.modechange", clearExistingArea);
    return () => {
      currentMap?.off("draw.modechange", clearExistingArea);
    };
  }, [map, control, areaOfInterest, dispatch]);

  useEffect(() => {
    map.current?.on("draw.create", (e) => dispatch(updateAreaOfInterest(e.features[0])));
  }, [dispatch, map]);

  return null;
}
