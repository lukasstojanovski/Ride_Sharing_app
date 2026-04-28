import {
  View,
  Text,
  
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button, Input } from "@/components/AuthComponents";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, MAX_SEATS } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useOfferWizard } from "./OfferWizardContext";
import { stepStyles } from "./stepStyles";

export default function OfferDetailsScreen() {
  const { t } = useI18n();
  const {
    from,
    to,
    date,
    time,
    seats,
    vehicleInfo,
    setVehicleInfo,
    smokingAllowed,
    setSmokingAllowed,
    petsAllowed,
    setPetsAllowed,
    price,
    setPrice,
    error,
    setError,
    loading,
    setLoading,
    success,
    setSuccess,
    resetWizard,
    clearOfferDraft,
    remountStack,
  } = useOfferWizard();

  const handlePublish = async () => {
    const f = from.trim();
    const tVal = to.trim();
    const d = date.trim();
    const tm = time.trim();
    const p = parseFloat(price.replace(",", "."));
    if (!f || !tVal || !d || !tm) {
      setError(t.offer.fillRequired);
      return;
    }
    if (f === tVal) {
      setError(t.offer.pickFromDifferentCity);
      return;
    }
    if (seats < 1 || seats > MAX_SEATS) {
      setError(t.offer.invalidSeats);
      return;
    }
    if (!price.trim() || Number.isNaN(p) || p < 0) {
      setError(t.offer.fillDetailsRequired);
      return;
    }
    const [year, month, day] = d.split("-").map(Number);
    const [hour, minute] = tm.split(":").map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (Number.isNaN(localDate.getTime())) {
      setError(t.offer.invalidDateTime);
      return;
    }
    const departureTime = localDate.toISOString();
    setError(null);
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError(t.offer.loginRequired);
      return;
    }
    const vehicle = vehicleInfo.trim();
    const { error: e } = await supabase.from("trips").insert({
      creator_id: user.id,
      from_city: f,
      to_city: tVal,
      departure_time: departureTime,
      seats_total: seats,
      seats_available: seats,
      price: p,
      status: "active",
      vehicle_info: vehicle.length > 0 ? vehicle : null,
      smoking_allowed: smokingAllowed,
      pets_allowed: petsAllowed,
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSuccess(true);
    clearOfferDraft();
    setTimeout(() => {
      router.push("/tabs/my-trips");
      resetWizard();
      remountStack();
    }, 1500);
  };

  if (success) {
    return (
      <SafeAreaView style={stepStyles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={stepStyles.centered}>
          <Text style={stepStyles.successText}>{t.offer.success}</Text>
          <Text style={stepStyles.successSub}>{t.offer.successSub}</Text>
        </View>
      </SafeAreaView>
    );
  }

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

          <Text style={stepStyles.title}>{t.offer.detailsTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.detailsSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <Input
              value={vehicleInfo}
              onChangeText={setVehicleInfo}
              placeholder={t.offer.vehicleInfo}
            />
            <View style={stepStyles.switchRow}>
              <Text style={stepStyles.switchLabel}>{t.offer.smoking}</Text>
              <Switch
                value={smokingAllowed}
                onValueChange={setSmokingAllowed}
                trackColor={{ false: colors.textMuted, true: colors.primary }}
                thumbColor={smokingAllowed ? colors.textInverse : colors.surfaceAlt}
                ios_backgroundColor={colors.textMuted}
              />
            </View>
            <View style={[stepStyles.switchRow, { borderBottomWidth: 0 }]}>
              <Text style={stepStyles.switchLabel}>{t.offer.pets}</Text>
              <Switch
                value={petsAllowed}
                onValueChange={setPetsAllowed}
                trackColor={{ false: colors.textMuted, true: colors.primary }}
                thumbColor={petsAllowed ? colors.textInverse : colors.surfaceAlt}
                ios_backgroundColor={colors.textMuted}
              />
            </View>
            <Input
              value={price}
              onChangeText={(v) => setPrice(v.replace(/[^0-9,.]/g, ""))}
              placeholder={t.offer.price}
              keyboardType="decimal-pad"
            />
          </View>

          {error ? <Text style={stepStyles.errorText}>{error}</Text> : null}

          <Button
            label={t.offer.publish}
            onPress={handlePublish}
            loading={loading}
            disabled={loading}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
