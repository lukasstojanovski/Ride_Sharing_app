import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";
import { Button, Input } from "@/components/AuthComponents";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius } from "@/constants/theme";

const AVATAR_SIZE = 96;

export default function ProfileScreen() {
  const { t, setLanguage, language } = useI18n();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [carInfo, setCarInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [langAccordionOpen, setLangAccordionOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
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
        .select("avatar_url, car_info")
        .eq("id", user.id)
        .single();
      if (data) {
        const row = data as { avatar_url?: string | null; car_info?: string | null };
        setAvatarUrl(row.avatar_url ?? null);
        setCarInfo(row.car_info ?? "");
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

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: e } = await supabase
      .from("profiles")
      .update({
        car_info: carInfo.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.profile.deleteAccount,
      language === "mk"
        ? "Ова ќе ја избрише вашата сметка, е-пошта, лозинка и сите податоци. Нема да можете да се вратите. Дали сте сигурни?"
        : "This will permanently delete your account, email, password and all saved data. You will not be able to sign in again. Are you sure?",
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.profile.deleteAccount,
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            setError(null);
            try {
              const { data, error: fnError } = await supabase.functions.invoke("delete-account");
              if (fnError) {
                setError(fnError.message || "Failed to delete account");
                setDeletingAccount(false);
                return;
              }
              const body = data as { ok?: boolean; message?: string } | null;
              if (body && !body.ok) {
                setError(body.message || "Failed to delete account");
                setDeletingAccount(false);
                return;
              }
              await supabase.auth.signOut();
              router.replace("/login");
            } catch (_e) {
              router.replace("/login");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const currentLangLabel = language === "en" ? "English" : "Македонски";

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t.profile.title}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
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

          <Input
            label={t.profile.car}
            value={carInfo}
            onChangeText={setCarInfo}
            placeholder={t.profile.carPlaceholder}
          />

          <View style={styles.langRow}>
            <Text style={styles.langLabel}>{t.profile.language}</Text>
            <TouchableOpacity
              onPress={() => setLangAccordionOpen((o) => !o)}
              style={styles.langAccordionHeader}
              activeOpacity={0.8}
            >
              <Text style={styles.langAccordionHeaderText}>{currentLangLabel}</Text>
              <Ionicons
                name={langAccordionOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {langAccordionOpen ? (
              <View style={styles.langAccordionBody}>
                <TouchableOpacity
                  style={styles.langOptionRow}
                  onPress={() => {
                    setLanguage("en");
                    setLangAccordionOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langOptionText}>English</Text>
                  {language === "en" ? (
                    <Ionicons name="checkmark" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.langOptionRow}
                  onPress={() => {
                    setLanguage("mk");
                    setLangAccordionOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langOptionText}>Македонски</Text>
                  {language === "mk" ? (
                    <Ionicons name="checkmark" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            label={saved ? t.profile.saved : t.profile.save}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveBtn}
          />

          <TouchableOpacity
            onPress={handleLogOut}
            style={styles.logOutBtn}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            <View style={styles.logOutBtnContent}>
              <Ionicons name="log-out-outline" size={22} color={colors.text} />
              <Text style={styles.logOutBtnText}>{t.home.logOut}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={[styles.deleteAccountBtn, deletingAccount && styles.deleteAccountBtnDisabled]}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            <Text style={styles.deleteAccountBtnText}>
              {deletingAccount ? (language === "mk" ? "Се брише…" : "Deleting…") : t.profile.deleteAccount}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  langRow: {
    marginTop: spacing.sm,
  },
  langLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  langAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  langAccordionHeaderText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  langAccordionBody: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  langOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  langOptionText: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
  },
  logOutBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logOutBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logOutBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  deleteAccountBtn: {
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAccountBtnDisabled: {
    opacity: 0.6,
  },
  deleteAccountBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.error,
  },
});
