import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius } from "@/constants/theme";

export type SettingsPickerOption = {
  id: string;
  label: string;
};

type SettingsPickerProps = {
  label: string;
  valueLabel: string;
  options: SettingsPickerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function SettingsPicker({
  label,
  valueLabel,
  options,
  selectedId,
  onSelect,
}: SettingsPickerProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
        activeOpacity={0.8}
      >
        <Text style={styles.headerText}>{valueLabel}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {open ? (
        <View style={styles.body}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.optionRow}
              onPress={() => {
                onSelect(opt.id);
                setOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
              {selectedId === opt.id ? (
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      marginTop: spacing.sm,
    },
    label: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
    },
    headerText: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
      color: colors.text,
    },
    body: {
      marginTop: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
    },
    optionText: {
      fontSize: typography.sizes.base,
      color: colors.text,
      fontWeight: typography.weights.medium,
    },
  });
}
