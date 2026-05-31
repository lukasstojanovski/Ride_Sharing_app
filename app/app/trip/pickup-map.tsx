import { View, Text, StyleSheet, StatusBar, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/AuthComponents";
import { GoogleMapView } from "@/components/GoogleMapView";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useI18n } from "@/lib/i18n";

export default function PickupMapScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    address?: string;
    fromCity?: string;
    mode?: "pickup" | "dropoff";
  }>();
  const latitude = Number(params.lat);
  const longitude = Number(params.lng);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mode = params.mode === "dropoff" ? "dropoff" : "pickup";
  const titleText = mode === "dropoff" ? t.offer.dropoffTitle : t.offer.pickupTitle;
  const noPointText = mode === "dropoff" ? t.trip.noDropoff : t.trip.noPickup;

  const openInMaps = async () => {
    if (!hasCoords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <AppHeader showBack onBack={() => router.back()} />
        <View style={styles.mapWrap}>
          {hasCoords ? (
            <GoogleMapView latitude={latitude} longitude={longitude} />
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.fallbackText}>{noPointText}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{titleText}</Text>
          <Text style={styles.value}>
            {params.address?.trim() || (hasCoords ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : noPointText)}
          </Text>
          {params.fromCity ? (
            <>
              <Text style={[styles.label, styles.cityLabel]}>{t.offer.from}</Text>
              <Text style={styles.value}>{params.fromCity}</Text>
            </>
          ) : null}
        </View>

        {hasCoords ? (
          <Button
            label={t.trip.openInMaps}
            variant="outline"
            onPress={openInMaps}
            style={styles.mapsBtn}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl },
  mapWrap: {
    height: "58%",
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapFallback: { flex: 1, justifyContent: "center", alignItems: "center" },
  fallbackText: {
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  cityLabel: {
    marginTop: spacing.md,
  },
  mapsBtn: {
    marginTop: spacing.lg,
  },
});
