import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import { Text, View } from "react-native";

import sampleLottie from "../../assets/lottie/sample.json";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-slate-950 p-6">
      <Text className="text-xl font-semibold text-white">Asaase Mobile</Text>

      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 600 }}
        className="h-16 w-16 rounded-full bg-sky-500"
      />

      <LottieView
        source={sampleLottie}
        autoPlay
        loop
        style={{ width: 120, height: 120 }}
      />
    </View>
  );
}
