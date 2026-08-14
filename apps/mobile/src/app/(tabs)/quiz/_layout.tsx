// Move your real quiz.tsx content into this file. On quiz submit, navigate to
// the results screen, e.g.:
//   router.push({ pathname: "/quiz/result", params: { score: "4", total: "5" } });
// This is a placeholder — it exists only so the route has a valid export and
// nothing crashes while the real content is restored.

import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
      <View>
        <Text className="text-center text-base text-gray-500">
          Paste your real quiz.tsx content here.
        </Text>
      </View>
    </SafeAreaView>
  );
}