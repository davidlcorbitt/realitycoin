import queryString from "query-string";

export const updateParam = (key: string, value: string) => {
  window.history.replaceState(
    null,
    "",
    "?" +
      queryString.stringify({
        ...queryString.parse(window.location.search),
        [key]: value,
      })
  );
};
