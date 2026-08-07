import { Redirect, Stack } from "expo-router";
import { useUserStore } from "../../store/userStore";

export default function AuthLayout() {
  const { hasCompletedOnboarding } = useUserStore();

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
