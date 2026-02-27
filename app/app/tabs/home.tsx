import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input } from "@/components/AuthComponents";
import {
  getRecentSearches,
  addRecentSearch,
  type RecentSearch,
} from "@/lib/recentSearches";
import { colors, typography, spacing, radius } from "@/constants/theme";

export default function HomeScreen() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("1");
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    getRecentSearches().then(setRecent);
  }, []);

  const handleSearch = async () => {
    const f = from.trim();
    const t = to.trim();
    const d = date.trim();
    const s = seats.trim() || "1";
    if (!f || !t || !d) return;
    await addRecentSearch({ from: f, to: t, date: d, seats: s });
    setRecent(await getRecentSearches());
    router.push({
      pathname: "/search-results",
      params: { from: f, to: t, date: d, seats: s },
    });
  };

  const handleRecentPress = (r: RecentSearch) => {
    setFrom(r.from);
    setTo(r.to);
    setDate(r.date);
    setSeats(r.seats);
    router.push({
      pathname: "/search-results",
      params: { from: r.from, to: r.to, date: r.date, seats: r.seats },
    });
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Find a ride</Text>
        <TouchableOpacity onPress={() => router.push("/auth/add-phone")}>
          <Text style={styles.link}>Add phone</Text>
        </TouchableOpacity>
      </View>

      <Input
        label="From"
        value={from}
        onChangeText={setFrom}
        placeholder="City"
        autoCapitalize="words"
      />
      <Input
        label="To"
        value={to}
        onChangeText={setTo}
        placeholder="City"
        autoCapitalize="words"
      />
      <Input
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />
      <Input
        label="Seats"
        value={seats}
        onChangeText={(v) => setSeats(v.replace(/\D/g, "") || "1")}
        placeholder="1"
        keyboardType="number-pad"
      />

      <Button
        label="Search"
        onPress={handleSearch}
        disabled={!from.trim() || !to.trim() || !date.trim()}
        style={styles.searchBtn}
      />

      {recent.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.recentLabel}>Recent searches</Text>
          {recent.map((r, i) => (
            <TouchableOpacity
              key={`${r.from}-${r.to}-${r.date}-${i}`}
              style={styles.chip}
              onPress={() => handleRecentPress(r)}
            >
              <Text style={styles.chipText}>
                {r.from} → {r.to} ({r.date})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogOut}>
          <Text style={styles.link}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
  },
  link: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  searchBtn: { marginTop: spacing.lg },
  recent: { marginTop: spacing["2xl"] },
  recentLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  chipText: {
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  footer: { marginTop: spacing["2xl"] },
});
