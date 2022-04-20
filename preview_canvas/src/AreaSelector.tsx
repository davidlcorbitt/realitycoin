import MapboxDraw, {
  DrawCreateEvent,
  DrawModeChageEvent,
  DrawUpdateEvent,
} from "@mapbox/mapbox-gl-draw";
import { Feature, Polygon } from "@turf/turf";
import { useEffect, useState } from "react";
import type { ControlPosition } from "react-map-gl";
import { useControl, useMap } from "react-map-gl";
import { useDispatch } from "react-redux";
import { setAreaOfInterest } from "./state/mapSlice";
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
      displayControlsDefault: false,
    })
  );

  useControl(() => control, { position });

  // This effect ensures you can only have one drawn area at a time. If you hit
  // the polygon button a second time, it clears your previous area.
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    const clearExistingArea = (e: DrawModeChageEvent) => {
      console.log("clearing existing area");
      // If you hit the polygon button again, clear the existing selected area.
      // We only support one selected area at a time.
      if (e.mode === "draw_polygon" && areaOfInterest) {
        control.delete(areaOfInterest.id as string);
        dispatch(setAreaOfInterest(null));
      }
    };

    currentMap?.on("draw.modechange", clearExistingArea);
    return () => {
      currentMap?.off("draw.modechange", clearExistingArea);
    };
  }, [map, control, areaOfInterest, dispatch]);

  // Keep the AOI in state in sync with the AOI drawn on the map
  useEffect(() => {
    control
      .getAll()
      .features.filter((f) => f.id !== areaOfInterest?.id)
      .forEach((f) => control.delete(f.id as string));

    if (areaOfInterest) {
      control.add(areaOfInterest);
      control.changeMode("simple_select");
    } else {
      control.changeMode("draw_polygon");
    }
  }, [areaOfInterest, control]);

  // Kick off new calculations every time we update the area of interest.
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;

    const updateArea = (e: DrawUpdateEvent | DrawCreateEvent) =>
      dispatch(setAreaOfInterest(e.features[0] as Feature<Polygon>));

    currentMap.on("draw.update", updateArea);
    currentMap.on("draw.create", updateArea);

    return () => {
      currentMap.off("draw.update", updateArea);
      currentMap.off("draw.create", updateArea);
    };
  }, [dispatch, map]);

  return null;
}
