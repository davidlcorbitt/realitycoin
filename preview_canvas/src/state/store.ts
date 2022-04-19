import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import queryString from "query-string";
import mapSlice, { updateAreaOfInterest } from "./mapSlice";
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
  const { viewHexes } = queryString.parse(window.location.search);
  if (viewHexes) {
    store.dispatch(settingsSlice.actions.set({ viewHexes: viewHexes === "true" }));
  }
};

initializeStoreFromUrlParams();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
