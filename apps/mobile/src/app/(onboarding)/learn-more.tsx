import { router } from "expo-router";

import OnboardingSlide from "../../components/OnboardingSlide";

export default function LearnMoreScreen() {
  return (
    <OnboardingSlide
      imageSeed="asaase-onboard-learn"
      eyebrow="Bite-sized, not boring"
      headline="Learn as\nyou go."
      body="A guided learning path teaches you flood safety, how the AI behind Asaase works, and why your five-second scan actually matters — a few minutes at a time."
      step={2}
      totalSteps={3}
      ctaLabel="Next"
      onNext={() => router.push("/(onboarding)/civic-duty")}
    />
  );
}
