import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="add-phone" />
      <Stack.Screen name="email-signup" />
      <Stack.Screen name="email-signin" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
