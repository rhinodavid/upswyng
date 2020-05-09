import { useEffect, useState } from "react";

import { TEnvVariables } from "../webTypes";
import algoliaSearch from "algoliasearch";

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const process: TEnvVariables;

function useSimilarSearchResults(query: string): algoliaSearch.Response | null {
  const [
    searchResults,
    setSearchResults,
  ] = useState<algoliaSearch.Response | null>(null);

  useEffect(() => {
    if (query) {
      const algoliaClient = algoliaSearch(
        process.env.REACT_APP_ALGOLIA_APP_ID,
        process.env.REACT_APP_ALGOLIA_SEARCH_API_KEY
      );

      const searchIndex = algoliaClient.initIndex(
        process.env.REACT_APP_ALGOLIA_INDEX_NAME
      );

      searchIndex
        .search({
          query: "",
          similarQuery: query,
        } as any)
        .then(setSearchResults);
    }
  }, [query]);

  return searchResults;
}

export default useSimilarSearchResults;
