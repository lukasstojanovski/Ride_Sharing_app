import {
  View,
  Text,
  
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button, SeatsPickerInput } from "@/components/AuthComponents";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, MAX_SEATS } from "@/constants/theme";
import { useOfferWizard } from "./OfferWizardContext";
import { stepStyles } from "./stepStyles";

export default function OfferSeatsScreen() {
  const { t } = useI18n();
  const { seats, setSeats } = useOfferWizard();

  return (
    <SafeAreaView style={stepStyles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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

          <Text style={stepStyles.title}>{t.offer.seatsTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.seatsSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <SeatsPickerInput
              value={String(seats)}
              onChange={(v) => setSeats(Math.min(MAX_SEATS, Math.max(1, parseInt(v, 10) || 1)))}
              leftElement={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            />
          </View>

          <Button
            label={t.offer.next}
            onPress={() => router.push("/tabs/offer/details")}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
