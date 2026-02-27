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
  if (!normalized.from || !normalized.to || !normalized.date) return;
  const rest = list.filter(
    (x) =>
      x.from !== normalized.from ||
      x.to !== normalized.to ||
      x.date !== normalized.date
  );
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify([normalized, ...rest].slice(0, MAX))
  );
}
