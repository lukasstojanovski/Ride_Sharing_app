import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "recentSearches";
const MAX = 10;

export interface RecentSearch {
  from: string;
  to: string;
  date: string;
  seats: string;
}

export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(s: RecentSearch): Promise<void> {
  const list = await getRecentSearches();
  const normalized: RecentSearch = {
    from: (s.from || "").trim(),
    to: (s.to || "").trim(),
    date: s.date || "",
    seats: s.seats || "1",
  };
  if (!normalized.from || !normalized.to) return;
  // Deduplicate by from+to only (keep most recent route)
  const rest = list.filter(
    (x) => x.from !== normalized.from || x.to !== normalized.to
  );
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify([normalized, ...rest].slice(0, MAX))
  );
}

/** Returns unique routes (from→to) for display, most recent first */
export function getUniqueRoutes(searches: RecentSearch[]): { from: string; to: string }[] {
  const seen = new Set<string>();
  const result: { from: string; to: string }[] = [];
  for (const s of searches) {
    const key = `${s.from}|||${s.to}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ from: s.from, to: s.to });
    }
  }
  return result;
}
