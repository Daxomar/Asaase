// Move your real marketplace.tsx content into this file. Remember: this file
// now lives one folder deeper than the old flat marketplace.tsx did, so any
// relative import needs one extra "../" — e.g.
//   "../../lib/api"        ->  "../../../lib/api"
//   "../../store/userStore" -> "../../../store/userStore"
//   "../../../assets/..."   -> "../../../../assets/..."
// This is a placeholder — it exists only so the route has a valid export and
// nothing crashes while the real content is restored.

import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MarketplaceScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
      <View>
        <Text className="text-center text-base text-gray-500">
          Paste your real marketplace.tsx content here.
        </Text>
      </View>
    </SafeAreaView>
  );
}