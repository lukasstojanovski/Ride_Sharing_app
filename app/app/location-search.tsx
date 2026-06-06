import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/ThemeContext";
import { useLocationSearch } from "@/lib/LocationSearchContext";
import { getRecentCities } from "@/lib/recentCitySelections";
import type { LocationSuggestion } from "@/lib/locationSearch/types";
import type { AppColors } from "@/constants/colorPalettes";
import { radius, spacing, typography } from "@/constants/theme";

const SUGGESTION_LIMIT = 8;

export default function LocationSearchScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { request, dataSource, completeSelection, cancelSearch } =
    useLocationSearch();

  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const field = request?.field ?? "from";
  const title =
    field === "from" ? t.locationSearch.titleFrom : t.locationSearch.titleTo;
  const placeholder =
    request?.placeholder ??
    (field === "from"
      ? t.locationSearch.placeholderFrom
      : t.locationSearch.placeholderTo);

  useEffect(() => {
    dataSource.preload?.();
  }, [dataSource]);

  useEffect(() => {
    if (!request) return;
    setQuery(request.initialValue?.trim() ?? "");
  }, [request]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRecents(true);
      const list = await getRecentCities(field);
      if (mounted) {
        setRecents(list);
        setLoadingRecents(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [field]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let mounted = true;
    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      const results = await dataSource.search(q, { limit: SUGGESTION_LIMIT });
      if (mounted) {
        setSuggestions(results);
        setLoadingSuggestions(false);
      }
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [query, dataSource]);

  const handleSelect = useCallback(
    (city: string) => {
      completeSelection(city);
    },
    [completeSelection],
  );

  const showRecents = query.trim().length === 0;
  const showSuggestions = query.trim().length > 0;

  const listData = useMemo(() => {
    if (showRecents) {
      return recents.map((label) => ({ type: "recent" as const, id: label, label }));
    }
    return suggestions.map((s) => ({
      type: "suggestion" as const,
      id: s.id,
      label: s.label,
    }));
  }, [showRecents, recents, suggestions]);

  const renderItem = useCallback(
    ({ item }: { item: { type: "recent" | "suggestion"; id: string; label: string } }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => handleSelect(item.label)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.type === "recent" ? "time-outline" : "location-outline"}
          size={20}
          color={colors.textMuted}
          style={styles.rowIcon}
        />
        <Text style={styles.rowText}>{item.label}</Text>
      </TouchableOpacity>
    ),
    [styles, colors.textMuted, handleSelect],
  );

  const listHeader = useMemo(() => {
    if (showRecents && recents.length > 0) {
      return <Text style={styles.sectionTitle}>{t.locationSearch.recent}</Text>;
    }
    if (showSuggestions && suggestions.length > 0) {
      return null;
    }
    return null;
  }, [showRecents, recents.length, suggestions.length, styles, t]);

  const listEmpty = useMemo(() => {
    if (showRecents) {
      if (loadingRecents) {
        return (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        );
      }
      return (
        <Text style={styles.emptyText}>{t.locationSearch.startTyping}</Text>
      );
    }
    if (loadingSuggestions) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.emptySub}>{t.locationSearch.loading}</Text>
        </View>
      );
    }
    return <Text style={styles.emptyText}>{t.locationSearch.noResults}</Text>;
  }, [showRecents, loadingRecents, loadingSuggestions, styles, colors.primary, t]);

  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <AppHeader showBack onBack={cancelSearch} title={title} />
        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={listData}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: spacing.xl },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
      flex: 1,
      fontSize: typography.sizes.base,
      color: colors.text,
      paddingVertical: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: spacing["3xl"],
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowIcon: { marginRight: spacing.md },
    rowText: {
      flex: 1,
      fontSize: typography.sizes.base,
      color: colors.text,
      fontWeight: typography.weights.medium,
    },
    emptyWrap: {
      paddingTop: spacing["2xl"],
      alignItems: "center",
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: typography.sizes.base,
      color: colors.textMuted,
      textAlign: "center",
      paddingTop: spacing.xl,
    },
    emptySub: {
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });
}
