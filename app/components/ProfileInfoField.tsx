import { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius } from "@/constants/theme";

export type ProfileInfoFieldIcon = "edit" | "lock" | "verified";

type ProfileInfoFieldProps = {
  label: string;
  value: string;
  mode: "editable" | "protected";
  icon: ProfileInfoFieldIcon;
  editing?: boolean;
  draft?: string;
  onDraftChange?: (text: string) => void;
  onStartEdit?: () => void;
  onSave?: () => void;
  onProtectedPress?: () => void;
  saving?: boolean;
};

export function ProfileInfoField({
  label,
  value,
  mode,
  icon,
  editing = false,
  draft = "",
  onDraftChange,
  onStartEdit,
  onSave,
  onProtectedPress,
  saving = false,
}: ProfileInfoFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayValue = value.trim() || "—";
  const isProtected = mode === "protected";

  const iconName = useMemo((): keyof typeof Ionicons.glyphMap => {
    if (mode === "editable") {
      return editing ? "checkmark" : "create-outline";
    }
    if (icon === "verified") return "shield-checkmark-outline";
    return "lock-closed-outline";
  }, [mode, editing, icon]);

  const iconColor =
    mode === "editable"
      ? editing
        ? colors.primary
        : colors.textMuted
      : icon === "verified"
        ? colors.success
        : colors.textMuted;

  const handleIconPress = () => {
    if (saving) return;
    if (mode === "editable") {
      if (editing) onSave?.();
      else onStartEdit?.();
      return;
    }
    if (onProtectedPress) onProtectedPress();
  };

  const rowContent = (
    <>
      <View style={styles.valueWrap}>
        {editing ? (
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            style={styles.input}
            placeholderTextColor={colors.textMuted}
            autoFocus
            editable={!saving}
          />
        ) : (
          <Text
            style={[styles.valueText, isProtected && styles.valueTextProtected]}
            numberOfLines={1}
          >
            {displayValue}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={handleIconPress}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={saving && mode === "editable"}
        activeOpacity={0.7}
      >
        {saving && mode === "editable" ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name={iconName} size={22} color={iconColor} />
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {isProtected && onProtectedPress ? (
        <TouchableOpacity
          onPress={onProtectedPress}
          style={styles.row}
          activeOpacity={0.8}
          disabled={saving}
        >
          {rowContent}
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>{rowContent}</View>
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: {
      gap: spacing.xs,
    },
    label: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      minHeight: 48,
    },
    valueWrap: {
      flex: 1,
      marginRight: spacing.sm,
    },
    valueText: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
      color: colors.text,
    },
    valueTextProtected: {
      color: colors.textSecondary,
    },
    input: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
      color: colors.text,
      padding: 0,
      margin: 0,
    },
    iconBtn: {
      width: 32,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
