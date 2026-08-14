// Move your real scan.tsx content into this file. After a photo is captured,
// navigate to the confirm screen, e.g.:
//   router.push({ pathname: "/scan/confirm", params: { photoUri } });
// This is a placeholder — it exists only so the route has a valid export and
// nothing crashes while the real content is restored.

import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
      <View>
        <Text className="text-center text-base text-gray-500">
          Paste your real scan.tsx content here.
        </Text>
      </View>
    </SafeAreaView>
  );
}