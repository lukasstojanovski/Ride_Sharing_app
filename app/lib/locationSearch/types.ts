export interface LocationSuggestion {
  id: string;
  label: string;
}

export interface LocationSearchOptions {
  limit?: number;
}

export interface LocationSearchDataSource {
  search(
    query: string,
    options?: LocationSearchOptions,
  ): Promise<LocationSuggestion[]>;
  preload?(): Promise<void>;
}

export type LocationSearchField = "from" | "to";

/** City values for a two-field form; survives screen unmount during location search. */
export type LocationSearchDraft = {
  from: string;
  to: string;
};
