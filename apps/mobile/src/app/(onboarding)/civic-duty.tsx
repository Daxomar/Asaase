import { router } from "expo-router";

import OnboardingSlide from "../../components/OnboardingSlide";

export default function CivicDutyScreen() {
  return (
    <OnboardingSlide
      imageSeed="asaase-onboard-civic"
      eyebrow="Civic duty, gamified"
      headline="Find it.\nClear it.\nEarn it."
      body="Use the map to find the flood-prone chokepoints nearest you, help clear them yourself, and earn streaks, XP, and Eco-Tokens for every bit of civic duty."
      step={3}
      totalSteps={3}
      ctaLabel="Get started"
      onNext={() => router.push("/(auth)/sign-up")}
    />
  );
}
