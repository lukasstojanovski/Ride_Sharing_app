import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/AuthComponents";
import { colors, typography, spacing } from "@/constants/theme";

export default function SignupSuccessScreen() {
  const handleGoToLogin = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Successfully signed up!</Text>
      <Text style={styles.subtitle}>Your account has been created.</Text>
      <Button
        label="Go back to Log in"
        onPress={handleGoToLogin}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
