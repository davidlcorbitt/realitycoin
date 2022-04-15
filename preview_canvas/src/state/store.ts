import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Feature, Polygon } from "@turf/turf";
import mapboxgl from "mapbox-gl";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import * as turf from "@turf/turf";

type MapState = {
  map: mapboxgl.Map | null;
  areaOfInterest: Feature<Polygon> | null;
  areaOfInterestSize: number | null;
};

export const mapSlice = createSlice({
  name: "map",
  initialState: {
    map: null,
    areaOfInterest: null,
    areaOfInterestSize: null,
  } as MapState,
  reducers: {
    setMap: (state, action: PayloadAction<MapState["map"]>) => {
      state.map = action.payload;
    },
    setAreaOfInterest: (state, action: PayloadAction<MapState["areaOfInterest"]>) => {
      state.areaOfInterest = action.payload;
      state.areaOfInterestSize = action.payload ? turf.area(action.payload) : null;
    },
  },
});

const store = configureStore({
  reducer: {
    map: mapSlice.reducer,
  },
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
