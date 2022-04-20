import queryString from "query-string";

export const updateParam = (key: string, value: string | null) => {
  const existingParams = queryString.parse(window.location.search);
  const newParams = { ...existingParams, [key]: value };
  if (value == null || value === "null") delete newParams[key];

  window.history.replaceState(null, "", `?${queryString.stringify(newParams)}`);
};
