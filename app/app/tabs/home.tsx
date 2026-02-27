import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/AuthComponents";
import { colors, typography, spacing } from "@/constants/theme";

export default function HomeScreen() {
  const handleLogOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🚗 Home screen coming soon</Text>
      <TouchableOpacity
        style={styles.link}
        onPress={() => router.push("/auth/add-phone")}
      >
        <Text style={styles.linkText}>Add phone number</Text>
      </TouchableOpacity>
      <Button
        label="Log out"
        onPress={handleLogOut}
        variant="outline"
        style={styles.logOutBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  text: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
  },
  link: { paddingVertical: spacing.sm },
  linkText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  logOutBtn: { marginTop: spacing.lg, minWidth: 160 },
});
