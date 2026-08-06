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
    // Determine if we are currently inside the (onboarding) group
    const inOnboardingGroup = segments[0] === "(onboarding)";

    // If they haven't completed onboarding and aren't already in the onboarding flow, redirect them
    if (!hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace("/(onboarding)/welcome");
    } 
    // If they HAVE completed onboarding but are somehow in the onboarding flow, redirect them home
    else if (hasCompletedOnboarding && inOnboardingGroup) {
      router.replace("/");
    }
  }, [hasCompletedOnboarding, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
