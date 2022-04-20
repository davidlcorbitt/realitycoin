import { configureStore } from "@reduxjs/toolkit";
import queryString from "query-string";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import mapSlice from "./mapSlice";
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
  const { viewHexes, overpassQuery } = queryString.parse(window.location.search);
  if (viewHexes) store.dispatch(settingsSlice.actions.set({ viewHexes: viewHexes === "true" }));
  if (overpassQuery)
    store.dispatch(settingsSlice.actions.set({ overpassQuery: overpassQuery as string }));
};

initializeStoreFromUrlParams();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
