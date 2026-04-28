import { useCallback } from "react";
import { Stack, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "@/constants/theme";
import { OfferWizardProvider, useOfferWizard } from "./OfferWizardContext";

function OfferStackWithTabReset() {
  const { stackKey, resetWizard, remountStack } = useOfferWizard();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      resetWizard();
      remountStack();
      queueMicrotask(() => {
        router.replace("/tabs/offer");
      });
    }, [resetWizard, remountStack, router])
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
