import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

export default function OnboardingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-forest-deep">
      <View className="flex-1 px-6">
        {/* Logo header */}
        <View className="flex-row items-center justify-center gap-2 mt-4">
          <Ionicons name="leaf" size={24} color="#d9ac39" />
          <Text className="text-xl font-bold text-text-on-dark">
            Asaase
          </Text>
        </View>

        {/* Hero heading */}
        <Text className="mt-12 text-4xl font-bold text-text-on-dark text-center">
          {"Welcome to\n"}
          <Text className="text-gold">Asaase.</Text>
        </Text>

        {/* Subtitle */}
        <Text className="mt-4 text-center text-base text-text-on-dark-muted">
          Your personal eco-tracker for flood watching and community action.
        </Text>

        <View className="flex-1 items-center justify-center">
          <LottieView
            source={require("../../../assets/Greenify the Earth.json")}
            autoPlay
            loop
            style={{ width: 300, height: 300 }}
          />
        </View>
        {/* wanted to add a loop after two seconds so the animation plays continuously insted of popping up and animating */}
        {/* <LottieView
        ref={animationRef}
        source={animationData}
        autoPlay
        loop={false}
        style={{ width: 300, height: 300 }}
        onAnimationFinish={(isCancelled) => {
          if (!isCancelled) {
            // continuously replay the tail segment every time it finishes
            animationRef.current?.play(LOOP_START_FRAME, TOTAL_FRAMES);
          }
        }}
      // /> only problem it's not smooth
      // */} 

        {/* CTA button */}
        <TouchableOpacity
          className="mb-8 mt-4 flex-row items-center justify-center rounded-full bg-gold py-4"
          activeOpacity={0.85}
          onPress={() => {
            router.push("/(onboarding)/goal-select");
          }}
        >
          <Text className="text-base font-bold text-forest-deep">
            Get Started
          </Text>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#093016"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
