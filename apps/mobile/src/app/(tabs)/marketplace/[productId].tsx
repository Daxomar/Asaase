import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

// TODO: fetch real product data by productId from backend
export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-4 h-56 items-center justify-center rounded-2xl bg-gray-100">
          <Ionicons name="gift" size={40} color="#9CA3AF" />
        </View>

        <Text className="mt-5 text-xs font-bold uppercase tracking-wide text-text-on-dark-muted">
          Product {productId}
        </Text>
        <Text className="mt-1 text-2xl font-bold text-black">Product name goes here</Text>
        <Text className="mt-3 text-base leading-6 text-gray-700">
          Product description goes here - replace with real content fetched by productId.
        </Text>

        <TouchableOpacity
          className="mb-8 mt-8 flex-row items-center justify-center rounded-full py-4"
          activeOpacity={0.85}
          style={{ backgroundColor: ACCENT }}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text className="text-base font-bold text-white">Redeem</Text>
          <Ionicons name="chevron-forward" size={22} color="#ffffff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}