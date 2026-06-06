import { supabase } from "@/lib/supabase";
import type {
  LocationSearchDataSource,
  LocationSearchOptions,
  LocationSuggestion,
} from "./types";

const DEFAULT_LIMIT = 8;

let cachedCities: string[] | null = null;
let loadPromise: Promise<string[]> | null = null;

async function loadCities(): Promise<string[]> {
  if (cachedCities) return cachedCities;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("id, city")
      .order("city");
    if (error || !data) {
      cachedCities = [];
      return [];
    }
    const list = data
      .map((r) => (r.city as string) ?? "")
      .filter(Boolean);
    cachedCities = list;
    return list;
  })();

  return loadPromise;
}

export function createMacedoniaCitiesSource(): LocationSearchDataSource {
  return {
    async preload() {
      await loadCities();
    },
    async search(
      query: string,
      options?: LocationSearchOptions,
    ): Promise<LocationSuggestion[]> {
      const q = query.trim().toLowerCase();
      if (!q) return [];

      const limit = options?.limit ?? DEFAULT_LIMIT;
      const cities = await loadCities();
      const matches: LocationSuggestion[] = [];

      for (const city of cities) {
        if (city.toLowerCase().includes(q)) {
          matches.push({ id: city, label: city });
          if (matches.length >= limit) break;
        }
      }

      return matches;
    },
  };
}
