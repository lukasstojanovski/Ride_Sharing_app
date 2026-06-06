import { useCallback } from "react";
import { Stack, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/lib/ThemeContext";
import { useLocationSearch } from "@/lib/LocationSearchContext";
import { OFFER_LOCATION_SEARCH_KEY } from "@/lib/locationSearch/routes";
import { OfferWizardProvider, useOfferWizard } from "./OfferWizardContext";

function OfferStackWithTabReset() {
  const { stackKey, resetWizard, remountStack, setFrom, setTo } = useOfferWizard();
  const router = useRouter();
  const { colors } = useTheme();
  const { consumeSkipTabResetOnFocus, peekSearchDraft } = useLocationSearch();

  useFocusEffect(
    useCallback(() => {
      if (consumeSkipTabResetOnFocus(OFFER_LOCATION_SEARCH_KEY)) {
        const draft = peekSearchDraft(OFFER_LOCATION_SEARCH_KEY);
        setFrom(draft.from);
        setTo(draft.to);
        return;
      }
      resetWizard();
      remountStack();
      queueMicrotask(() => {
        router.replace("/tabs/offer");
      });
    }, [
      consumeSkipTabResetOnFocus,
      peekSearchDraft,
      setFrom,
      setTo,
      resetWizard,
      remountStack,
      router,
    ]),
  );

  return (
    <Stack
      key={stackKey}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    />
  );
}

export default function OfferLayout() {
  return (
    <OfferWizardProvider>
      <OfferStackWithTabReset />
    </OfferWizardProvider>
  );
}
