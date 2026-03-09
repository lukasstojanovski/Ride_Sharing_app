import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, DatePickerInput, CityPickerInput, SeatsStepper } from "@/components/AuthComponents";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius, shadows } from "@/constants/theme";
import { getRecentSearches, addRecentSearch, getUniqueRoutes } from "@/lib/recentSearches";

const PROFILE_ICON_SIZE = 36;

export default function HomeScreen() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [seats, setSeats] = useState("1");
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [recentRoutes, setRecentRoutes] = useState<{ from: string; to: string }[]>([]);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalRoute, setDateModalRoute] = useState<{ from: string; to: string } | null>(null);
  const [modalDate, setModalDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        const row = data as { first_name?: string | null; avatar_url?: string | null };
        const first = row.first_name?.trim();
        setUserName(first || null);
        setAvatarUrl(row.avatar_url ?? null);
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
    setDateModalRoute(route);
    setModalDate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    setDateModalVisible(true);
  };

  const closeDateModal = () => {
    setDateModalVisible(false);
    setDateModalRoute(null);
    setDatePickerOpen(false);
  };

  const handleShowRidesFromModal = async () => {
    if (!dateModalRoute) return;
    const { from: f, to: t_val } = dateModalRoute;
    const d = modalDate.trim();
    if (!d) return;
    await addRecentSearch({ from: f, to: t_val, date: d, seats: "1" });
    setRecentRoutes((prev) => {
      const rest = prev.filter((r) => r.from !== f || r.to !== t_val);
      return [{ from: f, to: t_val }, ...rest].slice(0, 10);
    });
    closeDateModal();
    router.push({
      pathname: "/search-results",
      params: { from: f, to: t_val, date: d, seats: "1" },
    });
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
          rightElement={
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.profileIconWrap}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileIcon} />
              ) : (
                <View style={styles.profileIconPlaceholder}>
                  <Ionicons name="person" size={20} color={colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          }
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
          <SeatsStepper
            label={t.home.seats}
            value={Math.min(4, Math.max(1, parseInt(seats, 10) || 1))}
            onChange={(n) => setSeats(String(n))}
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
      </ScrollView>

      <Modal
        visible={dateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDateModal}
      >
        <Pressable
          style={styles.dateModalOverlay}
          onPress={() => {
            if (!datePickerOpen) closeDateModal();
          }}
        >
          <View style={styles.dateModalOverlayInner} pointerEvents="box-none">
            <View style={styles.dateModalCard}>
              {dateModalRoute ? (
                <>
                  <TouchableOpacity
                    onPress={closeDateModal}
                    style={styles.dateModalBackBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.dateModalBackArrow}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.dateModalRouteLabel}>
                    {dateModalRoute.from} → {dateModalRoute.to}
                  </Text>
                  <Text style={styles.dateModalTitle}>{t.home.chooseDate}</Text>
                  <DatePickerInput
                    label={t.home.date}
                    value={modalDate}
                    onChange={setModalDate}
                    placeholder={t.home.datePlaceholder}
                    onOpenChange={setDatePickerOpen}
                  />
                  <Button
                    label={t.home.showRides}
                    onPress={handleShowRidesFromModal}
                    style={styles.dateModalShowBtn}
                    disabled={datePickerOpen}
                  />
                </>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Modal>
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

  profileIconWrap: { marginLeft: spacing.sm },
  profileIcon: {
    width: PROFILE_ICON_SIZE,
    height: PROFILE_ICON_SIZE,
    borderRadius: PROFILE_ICON_SIZE / 2,
  },
  profileIconPlaceholder: {
    width: PROFILE_ICON_SIZE,
    height: PROFILE_ICON_SIZE,
    borderRadius: PROFILE_ICON_SIZE / 2,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },

  dateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  dateModalOverlayInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  dateModalCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 380,
    ...shadows.lg,
  },
  dateModalBackBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  dateModalBackArrow: {
    fontSize: 24,
    color: colors.text,
  },
  dateModalRouteLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateModalTitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.base,
  },
  dateModalShowBtn: {
    marginTop: spacing.lg,
  },
});
