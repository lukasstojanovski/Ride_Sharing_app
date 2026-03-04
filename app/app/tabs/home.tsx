import { useState, useEffect } from "react";
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
import { colors, typography, spacing, radius, shadows } from "@/constants/theme";
import { getRecentSearches, addRecentSearch, getUniqueRoutes } from "@/lib/recentSearches";

export default function HomeScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("1");
  const [userName, setUserName] = useState<string | null>(null);
  const [recentRoutes, setRecentRoutes] = useState<{ from: string; to: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      if (data) {
        const first = (data as { first_name?: string | null }).first_name?.trim();
        setUserName(first || null);
      }
    })();
  }, []);

  useEffect(() => {
    getRecentSearches().then((list) => setRecentRoutes(getUniqueRoutes(list)));
  }, []);

  const handleSearch = async () => {
    const f = from.trim();
    const t_val = to.trim();
    const d = date.trim();
    const s = seats.trim() || "1";
    if (!f || !t_val || !d) return;
    await addRecentSearch({ from: f, to: t_val, date: d, seats: s });
    setRecentRoutes((prev) => {
      const rest = prev.filter((r) => r.from !== f || r.to !== t_val);
      return [{ from: f, to: t_val }, ...rest].slice(0, 10);
    });
    router.push({
      pathname: "/search-results",
      params: { from: f, to: t_val, date: d, seats: s },
    });
  };

  const handleRecentClick = (route: { from: string; to: string }) => {
    const today = new Date().toISOString().slice(0, 10);
    router.push({
      pathname: "/search-results",
      params: { from: route.from, to: route.to, date: today, seats: "1" },
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

        <Text style={styles.title}>
          {userName ? `${t.home.welcome},  ${userName}` : t.home.welcome}
        </Text>

        <Text style={styles.findRide}>{t.home.title}</Text>

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

        {recentRoutes.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>{t.home.recentSearches}</Text>
            {recentRoutes.map((route, i) => (
              <TouchableOpacity
                key={`${route.from}-${route.to}-${i}`}
                style={styles.recentChip}
                onPress={() => handleRecentClick(route)}
                activeOpacity={0.7}
              >
                <Text style={styles.recentChipText}>
                  {route.from} → {route.to}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

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
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  findRide: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.base,
    ...shadows.md,
  },
  searchBtn: { marginTop: spacing.sm },

  recentSection: {
    marginBottom: spacing.xl,
  },
  recentTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  recentChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  recentChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },

  footer: { marginTop: spacing.lg },
  footerLink: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
});
