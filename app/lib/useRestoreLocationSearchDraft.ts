import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useLocationSearch } from "@/lib/LocationSearchContext";
import type { LocationSearchDraft } from "@/lib/locationSearch/types";

/**
 * After returning from /location-search, re-applies the full from/to draft
 * (parent screens remount and lose local useState).
 */
export function useRestoreLocationSearchDraft(
  screenKey: string,
  apply: (draft: LocationSearchDraft) => void,
) {
  const { consumeSearchDraftIfPending } = useLocationSearch();

  useFocusEffect(
    useCallback(() => {
      const draft = consumeSearchDraftIfPending(screenKey);
      if (draft) apply(draft);
    }, [screenKey, apply, consumeSearchDraftIfPending]),
  );
}
