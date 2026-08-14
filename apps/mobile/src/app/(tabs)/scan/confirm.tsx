import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

// TODO: wire submit to your real upload/report endpoint
export default function ScanConfirmScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="mt-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="ml-3 text-xl font-bold text-black">Confirm report</Text>
      </View>

      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: "100%", height: 320, borderRadius: 16, marginTop: 20 }}
          resizeMode="cover"
        />
      ) : (
        <View className="mt-5 h-80 items-center justify-center rounded-2xl bg-gray-100">
          <Ionicons name="image" size={40} color="#9CA3AF" />
        </View>
      )}

      <Text className="mt-6 text-sm text-text-on-dark-muted">
        Add a short note about what's shown (optional), then submit to flag it for your area.
      </Text>

      <TouchableOpacity
        className="mb-8 mt-auto flex-row items-center justify-center rounded-full py-4"
        activeOpacity={0.85}
        style={{ backgroundColor: ACCENT }}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-base font-bold text-white">Submit report</Text>
        <Ionicons name="chevron-forward" size={22} color="#ffffff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}