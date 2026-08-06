import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../store/userStore";

const GOALS = [
  { id: "1", title: "Track Floods", icon: "water" },
  { id: "2", title: "Scan Drains", icon: "camera" },
  { id: "3", title: "Learn & Earn", icon: "school" },
  { id: "4", title: "Community Action", icon: "people" },
];

export default function GoalSelectScreen() {
  const { completeOnboarding } = useUserStore();

  return (
    <SafeAreaView className="flex-1 bg-forest-deep">
      <View className="flex-1 px-6">
        <View className="flex-row items-center mt-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#d9ac39" />
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-3xl font-bold text-text-on-dark text-center">
          What is your primary goal?
        </Text>

        <View className="flex-1 mt-10">
          <FlatList
            data={GOALS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center justify-between rounded-2xl bg-forest-ink p-5 active:scale-95"
                onPress={() => {
                  completeOnboarding();
                  router.replace("/");
                }}
              >
                <View className="flex-row items-center gap-4">
                  <Ionicons name={item.icon as any} size={28} color="#d9ac39" />
                  <Text className="text-lg font-bold text-text-on-dark">{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#d9ac39" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
