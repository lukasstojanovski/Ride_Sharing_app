import {
  View,
  Text,
  
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button, CityPickerInput } from "@/components/AuthComponents";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useOfferWizard } from "./OfferWizardContext";
import { useOfferStepStyles } from "./stepStyles";

export default function OfferWhereFromScreen() {
  const { t } = useI18n();
  const stepStyles = useOfferStepStyles();
  const { from, setFrom, to, setError, error } = useOfferWizard();

  const goNext = () => {
    const f = from.trim();
    const tVal = to.trim();
    if (!f) {
      setError(t.offer.selectDepartureCity);
      return;
    }
    if (f === tVal) {
      setError(t.offer.pickFromDifferentCity);
      return;
    }
    setError(null);
    router.push("/tabs/offer/pickup");
  };

  return (
    <SafeAreaView style={stepStyles.safe}>
      <KeyboardAvoidingView
        style={stepStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AutoScrollView
          contentContainerStyle={stepStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled
          bounces
          alwaysBounceVertical
        >
          <AppHeader showBack onBack={() => router.back()} title={t.offer.title} />

          <Text style={stepStyles.title}>{t.offer.whereFromTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.whereFromSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <CityPickerInput value={from} onChange={setFrom} placeholder={t.offer.from} />
          </View>

          {error ? <Text style={stepStyles.errorText}>{error}</Text> : null}

          <Button
            label={t.offer.next}
            onPress={goNext}
            disabled={!from.trim()}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
