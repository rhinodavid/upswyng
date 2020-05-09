import { TAlgoliaResponse, TEnvVariables } from "../webTypes";
import { useEffect, useState } from "react";

import { TStatusFetch } from "@upswyng/types";
import algoliaSearch from "algoliasearch";

declare const process: TEnvVariables;

const algoliaClient = algoliaSearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_API_KEY
);
const searchIndex = algoliaClient.initIndex(
  process.env.REACT_APP_ALGOLIA_INDEX_NAME
);

function useSearchResults(
  query: string
): [TStatusFetch, TAlgoliaResponse | null] {
  const [status, setStatus] = useState<TStatusFetch>(
    TStatusFetch.STATUS_NOT_FETCHED
  );
  const [searchResults, setSearchResults] = useState<null | TAlgoliaResponse>(
    null
  );

  useEffect(() => {
    if (query) {
      const getSearchResults = async (query: string): Promise<void> => {
        try {
          setStatus(TStatusFetch.STATUS_FETCHING);
          setSearchResults(null);
          const searchResults = (await searchIndex.search(
            query
          )) as TAlgoliaResponse;

          setStatus(TStatusFetch.STATUS_FETCH_SUCCESS);
          setSearchResults(searchResults);
        } catch (err) {
          // TODO: log this error
          setStatus(TStatusFetch.STATUS_FETCH_ERROR);
          setSearchResults(null);
        }
      };

      getSearchResults(query);
    }
  }, [query]);

  return [status, searchResults];
}

export default useSearchResults;
