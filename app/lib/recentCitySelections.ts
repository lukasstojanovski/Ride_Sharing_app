import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationSearchField } from "@/lib/locationSearch/types";

const KEY_PREFIX = "@ajdego/recent-cities:";
const MAX = 6;

function storageKey(field: LocationSearchField): string {
  return `${KEY_PREFIX}${field}`;
}

export async function getRecentCities(
  field: LocationSearchField,
): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(field));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

export async function addRecentCity(
  field: LocationSearchField,
  city: string,
): Promise<void> {
  const trimmed = city.trim();
  if (!trimmed) return;

  const list = await getRecentCities(field);
  const rest = list.filter((c) => c !== trimmed);
  await AsyncStorage.setItem(
    storageKey(field),
    JSON.stringify([trimmed, ...rest].slice(0, MAX)),
  );
}
