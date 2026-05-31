import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius } from "@/constants/theme";

const AVATAR_SIZE = 96;

export default function ProfileScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberSinceYear, setMemberSinceYear] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      if (user.created_at) {
        setMemberSinceYear(new Date(user.created_at).getFullYear());
      }
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        const row = data as { avatar_url?: string | null };
        setAvatarUrl(row.avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const pickAndUploadAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t.common.cancel,
        "Permission to access the photo library is required to set a profile photo."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const base64 = asset.base64;
    if (!base64) {
      setError("Could not read image data.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploadingPhoto(true);
    setError(null);
    try {
      const ext = asset.uri?.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = ext === "png" ? "image/png" : "image/jpeg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, decode(base64), { contentType, upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }
      setAvatarUrl(urlWithCacheBust);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t.profile.title}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AutoScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader showBack onBack={() => router.back()} />

        <Text style={styles.title}>{t.profile.title}</Text>

        <View style={styles.formCard}>
          <TouchableOpacity
            onPress={pickAndUploadAvatar}
            disabled={uploadingPhoto}
            style={styles.avatarWrap}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image
                key={avatarUrl}
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {uploadingPhoto ? "…" : "+"}
                </Text>
              </View>
            )}
            <Text style={styles.changePhotoText}>
              {uploadingPhoto ? "…" : t.profile.changePhoto}
            </Text>
          </TouchableOpacity>

          {memberSinceYear != null ? (
            <Text style={styles.memberSince}>
              {t.profile.memberSince} {memberSinceYear}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push("/profile/settings")}
            style={styles.settingsRow}
            activeOpacity={0.8}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
              <Text style={styles.settingsRowText}>{t.profile.settings}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </AutoScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    loadingText: {
      fontSize: typography.sizes.base,
      color: colors.textMuted,
    },
    title: {
      fontSize: typography.sizes["2xl"],
      fontWeight: typography.weights.extrabold,
      color: colors.text,
      marginBottom: spacing.xl,
      letterSpacing: -0.5,
    },
    formCard: {
      backgroundColor: colors.background,
      paddingVertical: spacing.lg,
      gap: spacing.base,
    },
    avatarWrap: {
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      overflow: "hidden",
      backgroundColor: colors.surfaceAlt,
    },
    avatarPlaceholder: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarPlaceholderText: {
      fontSize: 36,
      color: colors.textMuted,
      fontWeight: typography.weights.medium,
    },
    changePhotoText: {
      marginTop: spacing.xs,
      fontSize: typography.sizes.sm,
      color: colors.primary,
      fontWeight: typography.weights.semibold,
    },
    memberSince: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.textMuted,
      marginBottom: spacing.xs,
      alignSelf: "center",
    },
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      marginTop: spacing.sm,
    },
    settingsRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    settingsRowText: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
      color: colors.text,
    },
    errorText: {
      color: colors.error,
      fontSize: typography.sizes.sm,
      marginTop: spacing.xs,
    },
  });
}
