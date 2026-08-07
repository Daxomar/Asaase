import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

// Full-bleed photo + gradient scrim + headline — same structural DNA as the reference
// (jogging/water-bottle onboarding cards), reused across all three "what is Asaase" slides
// so each one is just content, not a rebuild.
type OnboardingSlideProps = {
  imageSeed: string;
  eyebrow: string;
  headline: string;
  body: string;
  step: number; // 1-based, among the explainer slides only (welcome screen isn't counted)
  totalSteps: number;
  ctaLabel: string;
  onNext: () => void;
  showBack?: boolean;
};

export default function OnboardingSlide({
  imageSeed,
  eyebrow,
  headline,
  body,
  step,
  totalSteps,
  ctaLabel,
  onNext,
  showBack = true,
}: OnboardingSlideProps) {
  return (
    <View className="flex-1 bg-black">
      <Image
        source={{ uri: `https://picsum.photos/seed/${imageSeed}/900/1600` }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1 justify-between">
        <View className="flex-row items-center justify-between px-6 pt-2">
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View className="flex-row gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <View
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === step - 1 ? 20 : 8,
                  backgroundColor: i === step - 1 ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View className="px-6 pb-8">
          <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#B7E4C7" }}>
            {eyebrow}
          </Text>
          <Text className="mt-2 text-4xl font-bold text-white">{headline}</Text>
          <Text className="mt-3 text-base leading-relaxed text-white/80">{body}</Text>

          <TouchableOpacity
            className="mt-8 flex-row items-center justify-center rounded-full py-4"
            activeOpacity={0.85}
            style={{ backgroundColor: ACCENT }}
            onPress={onNext}
          >
            <Text className="text-base font-bold text-white">{ctaLabel}</Text>
            <Ionicons name="chevron-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
