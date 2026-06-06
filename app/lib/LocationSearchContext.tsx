import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { router } from "expo-router";
import { addRecentCity } from "@/lib/recentCitySelections";
import { createLocationSearchDataSource } from "@/lib/locationSearch/createLocationSearchDataSource";
import type {
  LocationSearchDataSource,
  LocationSearchDraft,
  LocationSearchField,
} from "@/lib/locationSearch/types";

export interface LocationSearchRequest {
  /** Draft bucket (e.g. home vs offer wizard). */
  screenKey: string;
  /** Explicit route after select/cancel — router.back() lands on wrong tab (usually Home). */
  returnTo: string;
  field: LocationSearchField;
  placeholder?: string;
  initialValue?: string;
  onSelect: (city: string) => void;
  getFormValues: () => LocationSearchDraft;
}

interface LocationSearchContextValue {
  request: LocationSearchRequest | null;
  dataSource: LocationSearchDataSource;
  openLocationSearch: (opts: LocationSearchRequest) => void;
  completeSelection: (city: string) => void;
  cancelSearch: () => void;
  consumeSearchDraftIfPending: (screenKey: string) => LocationSearchDraft | null;
  /** True once after select until Offer tab layout handles the return (survives child consume). */
  consumeSkipTabResetOnFocus: (screenKey: string) => boolean;
  peekSearchDraft: (screenKey: string) => LocationSearchDraft;
}

const LocationSearchContext = createContext<
  LocationSearchContextValue | undefined
>(undefined);

const emptyDraft = (): LocationSearchDraft => ({ from: "", to: "" });

function navigateReturn(returnTo: string | null | undefined) {
  const path = returnTo?.trim();
  if (path?.startsWith("/")) {
    router.replace(path);
    return;
  }
  router.back();
}

export function LocationSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [request, setRequest] = useState<LocationSearchRequest | null>(null);
  const requestRef = useRef<LocationSearchRequest | null>(null);
  const returnToRef = useRef<string | null>(null);
  const draftsRef = useRef<Record<string, LocationSearchDraft>>({});
  const pendingApplyRef = useRef<Record<string, boolean>>({});
  const skipTabResetRef = useRef<Record<string, boolean>>({});
  const dataSource = useMemo(() => createLocationSearchDataSource(), []);

  const mergeSearchDraft = useCallback(
    (screenKey: string, patch: Partial<LocationSearchDraft>) => {
      const prev = draftsRef.current[screenKey] ?? emptyDraft();
      draftsRef.current[screenKey] = {
        from: patch.from !== undefined ? patch.from : prev.from,
        to: patch.to !== undefined ? patch.to : prev.to,
      };
    },
    [],
  );

  const peekSearchDraft = useCallback((screenKey: string): LocationSearchDraft => {
    const draft = draftsRef.current[screenKey] ?? emptyDraft();
    return { ...draft };
  }, []);

  const consumeSkipTabResetOnFocus = useCallback((screenKey: string): boolean => {
    if (!skipTabResetRef.current[screenKey]) return false;
    skipTabResetRef.current[screenKey] = false;
    return true;
  }, []);

  const openLocationSearch = useCallback(
    (opts: LocationSearchRequest) => {
      mergeSearchDraft(opts.screenKey, opts.getFormValues());
      returnToRef.current = opts.returnTo;
      requestRef.current = opts;
      setRequest(opts);
      router.push("/location-search");
    },
    [mergeSearchDraft],
  );

  const clearRequest = useCallback(() => {
    requestRef.current = null;
    setRequest(null);
  }, []);

  const consumeSearchDraftIfPending = useCallback(
    (screenKey: string): LocationSearchDraft | null => {
      if (!pendingApplyRef.current[screenKey]) return null;
      pendingApplyRef.current[screenKey] = false;
      const draft = draftsRef.current[screenKey] ?? emptyDraft();
      return { ...draft };
    },
    [],
  );

  const finishAndReturn = useCallback(() => {
    const returnTo = requestRef.current?.returnTo ?? returnToRef.current;
    clearRequest();
    returnToRef.current = null;
    navigateReturn(returnTo);
  }, [clearRequest]);

  const completeSelection = useCallback(
    (city: string) => {
      const active = requestRef.current;
      if (!active) {
        navigateReturn(returnToRef.current);
        returnToRef.current = null;
        return;
      }
      const trimmed = city.trim();
      if (!trimmed) {
        finishAndReturn();
        return;
      }

      mergeSearchDraft(active.screenKey, { [active.field]: trimmed });
      pendingApplyRef.current[active.screenKey] = true;
      skipTabResetRef.current[active.screenKey] = true;
      active.onSelect(trimmed);
      void addRecentCity(active.field, trimmed);
      finishAndReturn();
    },
    [finishAndReturn, mergeSearchDraft],
  );

  const cancelSearch = useCallback(() => {
    finishAndReturn();
  }, [finishAndReturn]);

  const value = useMemo(
    () => ({
      request,
      dataSource,
      openLocationSearch,
      completeSelection,
      cancelSearch,
      consumeSearchDraftIfPending,
      consumeSkipTabResetOnFocus,
      peekSearchDraft,
    }),
    [
      request,
      dataSource,
      openLocationSearch,
      completeSelection,
      cancelSearch,
      consumeSearchDraftIfPending,
      consumeSkipTabResetOnFocus,
      peekSearchDraft,
    ],
  );

  return (
    <LocationSearchContext.Provider value={value}>
      {children}
    </LocationSearchContext.Provider>
  );
}

export function useLocationSearch() {
  const ctx = useContext(LocationSearchContext);
  if (!ctx) {
    throw new Error("useLocationSearch must be used within LocationSearchProvider");
  }
  return ctx;
}
