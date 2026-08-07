import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { MotiView } from "moti";
import { useUserStore } from "../../store/userStore";

const GOALS = [
  { id: "1", title: "Track Floods", subtitle: "Monitor local risk levels", icon: "water" },
  { id: "2", title: "Scan Drains", subtitle: "Report blockages in your area", icon: "camera" },
  { id: "3", title: "Learn & Earn", subtitle: "Complete quizzes for rewards", icon: "school" },
  { id: "4", title: "Community Action", subtitle: "Connect and coordinate", icon: "people" },
];

export default function GoalSelectScreen() {
  const { completeOnboarding } = useUserStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <View className="h-2 w-8 rounded-full bg-gray-200" />
            <View className="h-2 w-8 rounded-full bg-[#3F7B1E]" />
          </View>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
          <Text className="mt-8 text-3xl font-bold text-gray-900 text-center">
            What's your primary goal?
          </Text>
          <Text className="mt-3 text-center text-base text-gray-500 mb-8">
            This helps us personalize your Asaase dashboard and recommendations.
          </Text>
        </MotiView>

        <View className="flex-1">
          <FlatList
            data={GOALS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isSelected = selectedGoal === item.id;
              return (
                <MotiView
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: "timing", duration: 500, delay: index * 100 }}
                >
                  <Pressable
                    onPress={() => setSelectedGoal(item.id)}
                    className={`flex-row items-center justify-between rounded-3xl p-5 border-2 ${
                      isSelected ? "border-[#3F7B1E] bg-[#F2F8EC]" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${isSelected ? "bg-[#3F7B1E]" : "bg-white"}`}>
                        <Ionicons name={item.icon as any} size={24} color={isSelected ? "#fff" : "#6B7280"} />
                      </View>
                      <View>
                        <Text className={`text-lg font-bold ${isSelected ? "text-[#3F7B1E]" : "text-gray-900"}`}>{item.title}</Text>
                        <Text className="text-sm text-gray-500 mt-1">{item.subtitle}</Text>
                      </View>
                    </View>
                    <View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#3F7B1E] bg-[#3F7B1E]" : "border-gray-300"}`}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                </MotiView>
              );
            }}
          />
        </View>

        <View className="absolute bottom-10 left-6 right-6">
          <MotiView
            animate={{ opacity: selectedGoal ? 1 : 0.5, scale: selectedGoal ? 1 : 0.95 }}
            transition={{ type: "timing", duration: 200 }}
          >
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-full bg-[#3F7B1E] py-4"
              activeOpacity={0.85}
              disabled={!selectedGoal}
              onPress={() => {
                completeOnboarding();
                router.replace("/(tabs)");
              }}
            >
              <Text className="text-base font-bold text-white">Continue to Dashboard</Text>
              <Ionicons name="arrow-forward" size={22} color="#ffffff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </MotiView>
        </View>
      </View>
    </SafeAreaView>
  );
}
