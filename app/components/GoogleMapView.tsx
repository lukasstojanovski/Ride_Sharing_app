import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { colors, typography } from "@/constants/theme";

const DEFAULT_DELTA = 0.05;

type GoogleMapViewProps = {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  interactive?: boolean;
  onLocationChange?: (latitude: number, longitude: number) => void;
  style?: StyleProp<ViewStyle>;
};

export function GoogleMapView({
  latitude,
  longitude,
  latitudeDelta = DEFAULT_DELTA,
  longitudeDelta = DEFAULT_DELTA,
  interactive = false,
  onLocationChange,
  style,
}: GoogleMapViewProps) {
  if (Platform.OS === "web") {
    return (
      <View style={[styles.unavailable, style]}>
        <Text style={styles.unavailableText}>Google Maps is not available on web.</Text>
      </View>
    );
  }

  const region: Region = {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[styles.map, style]}
      region={region}
      onPress={
        interactive && onLocationChange
          ? (event) => {
              const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
              onLocationChange(lat, lng);
            }
          : undefined
      }
    >
      <Marker
        coordinate={{ latitude, longitude }}
        draggable={interactive}
        onDragEnd={
          interactive && onLocationChange
            ? (event) => {
                const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
                onLocationChange(lat, lng);
              }
            : undefined
        }
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  unavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  unavailableText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
