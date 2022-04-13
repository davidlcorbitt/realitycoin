import * as React from "react";
import { useState } from "react";
import { useControl, Marker, ControlPosition } from "react-map-gl";

import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";

type GeocoderControlProps = MapboxGeocoder.GeocoderOptions & {
  mapboxAccessToken: string;
  mapboxgl: mapboxgl.Map;
  origin?: string;
  zoom?: number;
  flyTo?: boolean | object;
  placeholder?: string;
  proximity?: {
    longitude: number;
    latitude: number;
  };
  trackProximity?: boolean;
  collapsed?: boolean;
  clearAndBlurOnEsc?: boolean;
  clearOnBlur?: boolean;
  box?: [number, number, number, number];
  countries?: string;
  types?: string;
  minLength?: number;
  limit?: number;
  language?: string;
  filter?: (feature: object) => boolean;
  localGeocoder?: Function;
  externalGeocoder?: Function;
  reverseMode?: "distance" | "score";
  reverseGeocode?: boolean;
  enableEventLogging?: boolean;
  marker?: boolean | object;
  render?: (feature: object) => string;
  getItemValue?: (feature: object) => string;
  mode?: "mapbox.places" | "mapbox.places-permanent";
  localGeocoderOnly?: boolean;
  autocomplete?: boolean;
  fuzzyMatch?: boolean;
  routing?: boolean;
  worldview?: string;

  position: ControlPosition;

  onLoading?: (...args: any) => void;
  onResults?: (e: object) => void;
  onResult?: (e: object) => void;
  onError?: (e: object) => void;
};

/* eslint-disable complexity,max-statements */
export default function GeocoderControl(props: GeocoderControlProps) {
  const [marker, setMarker] = useState<any>(null);

  const geocoder = useControl<MapboxGeocoder>(
    () => {
      const ctrl = new MapboxGeocoder({
        ...props,
        accessToken: props.mapboxAccessToken,
      });
      props.onLoading && ctrl.on("loading", props.onLoading);
      props.onResults && ctrl.on("results", props.onResults);
      ctrl.on("result", (evt) => {
        props.onResult?.(evt);

        const { result } = evt;
        const location =
          result &&
          (result.center || (result.geometry?.type === "Point" && result.geometry.coordinates));
        if (location) {
          setMarker(<Marker {...props.marker} longitude={location[0]} latitude={location[1]} />);
        } else {
          setMarker(null);
        }
      });
      props.onError && ctrl.on("error", props.onError);
      return ctrl;
    },
    {
      position: props.position,
    }
  );

  // @ts-expect-error
  if (geocoder._map) {
    if (geocoder.getProximity() !== props.proximity && props.proximity !== undefined) {
      geocoder.setProximity(props.proximity);
    }
    if (geocoder.getRenderFunction() !== props.render && props.render !== undefined) {
      geocoder.setRenderFunction(props.render);
    }
    if (geocoder.getLanguage() !== props.language && props.language !== undefined) {
      geocoder.setLanguage(props.language);
    }
    if (geocoder.getZoom() !== props.zoom && props.zoom !== undefined) {
      geocoder.setZoom(props.zoom);
    }
    if (geocoder.getFlyTo() !== props.flyTo && props.flyTo !== undefined) {
      geocoder.setFlyTo(props.flyTo);
    }
    if (geocoder.getPlaceholder() !== props.placeholder && props.placeholder !== undefined) {
      geocoder.setPlaceholder(props.placeholder);
    }
    if (geocoder.getCountries() !== props.countries && props.countries !== undefined) {
      geocoder.setCountries(props.countries);
    }
    if (geocoder.getTypes() !== props.types && props.types !== undefined) {
      geocoder.setTypes(props.types);
    }
    if (geocoder.getMinLength() !== props.minLength && props.minLength !== undefined) {
      geocoder.setMinLength(props.minLength);
    }
    if (geocoder.getLimit() !== props.limit && props.limit !== undefined) {
      geocoder.setLimit(props.limit);
    }
    if (geocoder.getFilter() !== props.filter && props.filter !== undefined) {
      geocoder.setFilter(props.filter);
    }
    if (geocoder.getOrigin() !== props.origin && props.origin !== undefined) {
      geocoder.setOrigin(props.origin);
    }
  }
  return marker;
}

const noop = () => {};

GeocoderControl.defaultProps = {
  onLoading: noop,
  onResults: noop,
  onResult: noop,
  onError: noop,
};
