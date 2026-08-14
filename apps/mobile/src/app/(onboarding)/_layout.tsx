import { Redirect, Stack } from "expo-router";
import { useUserStore } from "../../store/userStore";

export default function OnboardingLayout() {
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
      <Stack.Screen name="welcome" />
      <Stack.Screen name="goal-select" />
    </Stack>
  );
}
