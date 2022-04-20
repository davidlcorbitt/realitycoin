import { configureStore } from "@reduxjs/toolkit";
import { Feature, Polygon } from "@turf/turf";
import queryString from "query-string";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import mapSlice, { setAreaOfInterest } from "./mapSlice";
import settingsSlice from "./settingsSlice";

const store = configureStore({
  reducer: {
    map: mapSlice.reducer,
    settings: settingsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
});

export default store;

export const initializeStoreFromUrlParams = async () => {
  const { viewHexes, overpassQuery, aoi } = queryString.parse(window.location.search);
  if (viewHexes) store.dispatch(settingsSlice.actions.set({ viewHexes: viewHexes === "true" }));
  if (overpassQuery)
    store.dispatch(settingsSlice.actions.set({ overpassQuery: overpassQuery as string }));

  if (typeof aoi == "string") {
    const aoiFeature = JSON.parse(aoi) as Feature<Polygon>;
    store.dispatch(setAreaOfInterest(aoiFeature));
  }
};

initializeStoreFromUrlParams();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
