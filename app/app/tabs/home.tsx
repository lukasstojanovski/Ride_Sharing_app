import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input, DatePickerInput, CityPickerInput } from "@/components/AuthComponents";
import { AppHeader } from "@/components/AppHeader";
import { LangToggle } from "@/components/AuthComponents";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius } from "@/constants/theme";

export default function HomeScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("1");

  const handleSearch = () => {
    const f = from.trim();
    const t_val = to.trim();
    const d = date.trim();
    const s = seats.trim() || "1";
    if (!f || !t_val || !d) return;
    router.push({
      pathname: "/search-results",
      params: { from: f, to: t_val, date: d, seats: s },
    });
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          rightElement={<LangToggle language={language} onToggle={toggleLanguage} />}
        />

        <Text style={styles.title}>{t.home.title}</Text>

        <View style={styles.formCard}>
          <CityPickerInput
            label={t.home.from}
            value={from}
            onChange={setFrom}
            placeholder="Скопје"
          />
          <CityPickerInput
            label={t.home.to}
            value={to}
            onChange={setTo}
            placeholder="Охрид"
          />
          <DatePickerInput
            label={t.home.date}
            value={date}
            onChange={setDate}
            placeholder={t.home.datePlaceholder}
          />
          <Input
            label={t.home.seats}
            value={seats}
            onChangeText={(v) => setSeats(v.replace(/\D/g, "") || "1")}
            placeholder="1"
            keyboardType="number-pad"
          />

          <Button
            label={t.home.search}
            onPress={handleSearch}
            disabled={!from.trim() || !to.trim() || !date.trim()}
            style={styles.searchBtn}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleLogOut} activeOpacity={0.7}>
            <Text style={styles.footerLink}>{t.home.logOut}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.base,
  },
  searchBtn: { marginTop: spacing.sm },

  footer: { marginTop: spacing.lg },
  footerLink: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
});
