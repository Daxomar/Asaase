// import LottieView from "lottie-react-native";
// import { MotiView } from "moti";
import { Text, TouchableOpacity, View } from "react-native";

// import sampleLottie from "../../assets/lottie/sample.json";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-slate-950 p-6">
      <Text className="text-xl font-semibold text-red-500">Asaase Mobile</Text>

      {/* some way some how, this is causing issues, lottie */}

      {/* <MotiView
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
      /> */}

      <TouchableOpacity
        onPress={() => {
          console.log("Button pressed");
        }}
        className="rounded-lg bg-yellow-400 px-4 py-2"
      >
        <Text className="text-white">Me</Text>
        
      </TouchableOpacity>
      
    </View>
  );
}
