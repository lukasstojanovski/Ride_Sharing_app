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
import { Button, DatePickerInput, TimePickerInput } from "@/components/AuthComponents";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/constants/theme";
import { useOfferWizard } from "./OfferWizardContext";
import { stepStyles } from "./stepStyles";

export default function OfferWhenScreen() {
  const { t } = useI18n();
  const { date, setDate, time, setTime } = useOfferWizard();

  const canNext = date.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date.trim()) && time.trim().length > 0;

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

          <Text style={stepStyles.title}>{t.offer.whenTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.whenSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <DatePickerInput
              value={date}
              onChange={setDate}
              showTodayLabel
              leftElement={<Ionicons name="calendar-outline" size={18} color={colors.textMuted} />}
            />
            <TimePickerInput
              value={time}
              onChange={setTime}
              placeholder={t.offer.timePlaceholder}
            />
          </View>

          <Button
            label={t.offer.next}
            onPress={() => router.push("/tabs/offer/seats")}
            disabled={!canNext}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
