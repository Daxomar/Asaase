import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizIndex() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
      <View>
        <Text className="text-center text-base text-gray-500">Quiz coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}
