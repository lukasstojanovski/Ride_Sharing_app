import { useState, useEffect, useMemo, useCallback } from "react";
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
import { ProfileInfoField } from "@/components/ProfileInfoField";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/ThemeContext";
import { capitalizeName } from "@/lib/formatName";
import { requestPhoneNumberChange } from "@/lib/profilePhoneChange";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius } from "@/constants/theme";

const AVATAR_SIZE = 96;

type EditableField = "firstName" | "lastName";

export default function ProfileScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberSinceYear, setMemberSinceYear] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [savingField, setSavingField] = useState<EditableField | null>(null);

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
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, first_name, last_name, phone, email, phone_verified")
        .eq("id", user.id)
        .single();

      if (data) {
        const row = data as {
          avatar_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          email?: string | null;
          phone_verified?: boolean;
        };
        setAvatarUrl(row.avatar_url ?? null);
        setFirstName(row.first_name?.trim() ?? "");
        setLastName(row.last_name?.trim() ?? "");
        setPhone(row.phone?.trim() ?? "");
        if (row.email?.trim()) setEmail(row.email.trim());
        setPhoneVerified(row.phone_verified ?? false);
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

  const startEdit = useCallback(
    (field: EditableField) => {
      if (savingField) return;
      setEditingField(field);
      if (field === "firstName") setDraftFirstName(firstName);
      else setDraftLastName(lastName);
      setError(null);
    },
    [firstName, lastName, savingField]
  );

  const saveField = useCallback(
    async (field: EditableField) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const raw = field === "firstName" ? draftFirstName : draftLastName;
      const formatted = capitalizeName(raw.trim());
      const nextFirst = field === "firstName" ? formatted : firstName;
      const nextLast = field === "lastName" ? formatted : lastName;
      const fullName = [nextFirst, nextLast].filter(Boolean).join(" ").trim() || null;

      setSavingField(field);
      setError(null);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: nextFirst || null,
          last_name: nextLast || null,
          full_name: fullName,
        })
        .eq("id", user.id);

      setSavingField(null);
      if (updateError) {
        setError(updateError.message || t.profile.saveError);
        return;
      }

      setFirstName(nextFirst);
      setLastName(nextLast);
      setEditingField(null);
    },
    [draftFirstName, draftLastName, firstName, lastName, t.profile.saveError]
  );

  const handlePhonePress = useCallback(() => {
    requestPhoneNumberChange(
      (title, message) => Alert.alert(title, message),
      t.profile
    );
  }, [t.profile]);

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

          <View style={styles.infoSection}>
            <ProfileInfoField
              label={t.profile.firstName}
              value={firstName}
              mode="editable"
              icon="edit"
              editing={editingField === "firstName"}
              draft={draftFirstName}
              onDraftChange={setDraftFirstName}
              onStartEdit={() => startEdit("firstName")}
              onSave={() => saveField("firstName")}
              saving={savingField === "firstName"}
            />
            <ProfileInfoField
              label={t.profile.lastName}
              value={lastName}
              mode="editable"
              icon="edit"
              editing={editingField === "lastName"}
              draft={draftLastName}
              onDraftChange={setDraftLastName}
              onStartEdit={() => startEdit("lastName")}
              onSave={() => saveField("lastName")}
              saving={savingField === "lastName"}
            />
            <ProfileInfoField
              label={t.profile.phoneNumber}
              value={phone}
              mode="protected"
              icon={phoneVerified ? "verified" : "lock"}
              onProtectedPress={handlePhonePress}
            />
            <ProfileInfoField
              label={t.profile.email}
              value={email}
              mode="protected"
              icon="lock"
            />
          </View>

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
    infoSection: {
      gap: spacing.base,
      marginTop: spacing.sm,
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
