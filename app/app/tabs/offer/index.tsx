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

export default function OfferWhereToScreen() {
  const { t } = useI18n();
  const stepStyles = useOfferStepStyles();
  const { to, setTo } = useOfferWizard();

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
          <AppHeader />

          <Text style={stepStyles.title}>{t.offer.whereToTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.whereToSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <CityPickerInput value={to} onChange={setTo} placeholder={t.offer.to} />
          </View>

          <Button
            label={t.offer.next}
            onPress={() => router.push("/tabs/offer/from")}
            disabled={!to.trim()}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
