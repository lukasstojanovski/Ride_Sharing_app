import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { Button } from "@/components/AuthComponents";
import { GoogleMapView } from "@/components/GoogleMapView";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useOfferWizard } from "./OfferWizardContext";
import { stepStyles } from "./stepStyles";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const FALLBACK_REGION: Region = {
  latitude: 41.9981,
  longitude: 21.4254,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function OfferDropoffScreen() {
  const { t } = useI18n();
  const {
    to,
    dropoffAddress,
    setDropoffAddress,
    dropoffLat,
    setDropoffLat,
    dropoffLng,
    setDropoffLng,
    setError,
  } = useOfferWizard();
  const [region, setRegion] = useState<Region | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);

  const currentRegion = useMemo(() => {
    if (region) return region;
    if (dropoffLat !== null && dropoffLng !== null) {
      return { latitude: dropoffLat, longitude: dropoffLng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    return FALLBACK_REGION;
  }, [dropoffLat, dropoffLng, region]);

  const resolveAddress = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const result = await Location.reverseGeocodeAsync({ latitude, longitude });
        const first = result[0];
        if (!first) {
          setDropoffAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          return;
        }
        const parts = [first.name, first.street, first.city, first.region].filter(Boolean);
        setDropoffAddress(parts.length > 0 ? parts.join(", ") : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } catch {
        setDropoffAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    },
    [setDropoffAddress]
  );

  const updateDropoff = useCallback(
    async (latitude: number, longitude: number) => {
      setDropoffLat(latitude);
      setDropoffLng(longitude);
      await resolveAddress(latitude, longitude);
      setError(null);
    },
    [resolveAddress, setDropoffLat, setDropoffLng, setError]
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (dropoffLat !== null && dropoffLng !== null) {
          if (!mounted) return;
          setRegion({
            latitude: dropoffLat,
            longitude: dropoffLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          return;
        }
        const query = to.trim();
        const geo = query ? await Location.geocodeAsync(query) : [];
        const first = geo[0];
        const next = first
          ? {
              latitude: first.latitude,
              longitude: first.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }
          : FALLBACK_REGION;
        if (!mounted) return;
        setRegion(next);
        await updateDropoff(next.latitude, next.longitude);
      } finally {
        if (mounted) setLoadingMap(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [to, dropoffLat, dropoffLng, updateDropoff]);

  const canNext = dropoffLat !== null && dropoffLng !== null;
  const mapLatitude = dropoffLat ?? currentRegion.latitude;
  const mapLongitude = dropoffLng ?? currentRegion.longitude;

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

          <Text style={stepStyles.title}>{t.offer.dropoffTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.dropoffSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <View style={styles.mapWrap}>
              {loadingMap ? (
                <View style={styles.mapLoading}>
                  <Text style={styles.mapLoadingText}>...</Text>
                </View>
              ) : (
                <GoogleMapView
                  latitude={mapLatitude}
                  longitude={mapLongitude}
                  interactive
                  onLocationChange={(latitude, longitude) => {
                    void updateDropoff(latitude, longitude);
                  }}
                />
              )}
            </View>
            <Text style={styles.pointLabel}>{t.offer.dropoffSelected}</Text>
            <Text style={styles.pointValue}>
              {dropoffAddress ||
                (dropoffLat !== null && dropoffLng !== null
                  ? `${dropoffLat.toFixed(5)}, ${dropoffLng.toFixed(5)}`
                  : t.trip.noDropoff)}
            </Text>
          </View>

          <Button
            label={t.offer.next}
            onPress={() => router.push("/tabs/offer/when")}
            disabled={!canNext}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 320,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLoadingText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  pointLabel: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  pointValue: {
    color: colors.text,
    fontSize: typography.sizes.base,
  },
});
