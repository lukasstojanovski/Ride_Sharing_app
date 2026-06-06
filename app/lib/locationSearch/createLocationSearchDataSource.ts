import { createMacedoniaCitiesSource } from "./macedoniaCitiesSource";
import type { LocationSearchDataSource } from "./types";

/**
 * Factory for location search backends. Swap implementation when adding
 * Google Places or another Europe-wide provider (e.g. via env flag).
 */
export function createLocationSearchDataSource(): LocationSearchDataSource {
  return createMacedoniaCitiesSource();
}
