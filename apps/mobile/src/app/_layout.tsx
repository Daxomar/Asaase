import "../../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUserStore } from "../store/userStore";

export default function RootLayout() {
  const { hasCompletedOnboarding } = useUserStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // welcome (onboarding) hands off straight into sign-up/sign-in/verify (auth) — both groups
    // are pre-home territory, so neither should get bounced by the other.
    const inPreOnboardingFlow = segments[0] === "(onboarding)" || segments[0] === "(auth)";

    // If they haven't completed onboarding and aren't already in that flow, send them to start it
    if (!hasCompletedOnboarding && !inPreOnboardingFlow) {
      router.replace("/(onboarding)/welcome");
    }
    // If they HAVE completed onboarding but are somehow still in that flow, redirect them home
    else if (hasCompletedOnboarding && inPreOnboardingFlow) {
      router.replace("/");
    }
  }, [hasCompletedOnboarding, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
