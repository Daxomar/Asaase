import { router } from "expo-router";

import OnboardingSlide from "../../components/OnboardingSlide";

export default function AboutScreen() {
  return (
    <OnboardingSlide
      imageSeed="asaase-onboard-network"
      eyebrow="Every citizen. Every drain."
      headline="One climate\ndefense network."
      body="Accra floods when storm drains get blocked. Asaase turns everyday citizens into the sensor network that finds those chokepoints before the rain does."
      step={1}
      totalSteps={3}
      ctaLabel="Next"
      onNext={() => router.push("/(onboarding)/learn-more")}
    />
  );
}
