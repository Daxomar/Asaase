import { Redirect } from "expo-router";
import { useUserStore } from "../store/userStore";

export default function Index() {
  const { hasCompletedOnboarding } = useUserStore();

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}
