import { Ionicons } from "@expo/vector-icons";
import { Text, View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../../store/userStore";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useState } from "react";

const REWARDS = [
  {
    id: "1",
    title: "Golden Leaf Badge",
    description: "A permanent gold badge on your profile, visible to everyone on the leaderboard.",
    cost: 500,
    icon: "medal" as const,
    category: "Badge",
  },
  {
    id: "2",
    title: "Forest Guardian Frame",
    description: "An animated leaf border around your profile avatar.",
    cost: 150,
    icon: "images" as const,
    category: "Flair",
  },
  {
    id: "3",
    title: "Explorer Title",
    description: "Unlock the 'Explorer' title tag shown next to your name.",
    cost: 300,
    icon: "ribbon" as const,
    category: "Title",
  },
  {
    id: "4",
    title: "Streak Freeze",
    description: "Protect your streak for one missed day. Use it whenever you need.",
    cost: 100,
    icon: "snow" as const,
    category: "Utility",
  },
];

export default function RewardsScreen() {
  const { user, setUser } = useUserStore();
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  if (!user) return null;

  const handleUnlock = (reward: (typeof REWARDS)[0]) => {
    if (!user || unlocked.includes(reward.id)) return;
    if (user.tokens < reward.cost) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setUnlocking(reward.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setUser({ ...user, tokens: user.tokens - reward.cost });
      setUnlocked((prev) => [...prev, reward.id]);
      setUnlocking(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white rounded-b-3xl shadow-sm z-10">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Rewards</Text>
          <Text className="text-sm font-medium text-gray-500">Unlock badges and flair</Text>
        </View>
        <View className="flex-row items-center bg-[#F2F8EC] px-4 py-2 rounded-2xl border border-[#3F7B1E]/20">
          <Ionicons name="leaf" size={20} color="#3F7B1E" />
          <Text className="ml-2 font-bold text-[#3F7B1E] text-lg">{user.tokens}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-400">
          Unlockables
        </Text>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {REWARDS.map((reward, index) => {
            const isUnlocked = unlocked.includes(reward.id);
            const canAfford = user.tokens >= reward.cost;
            const isUnlocking = unlocking === reward.id;

            return (
              <MotiView
                key={reward.id}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 400, delay: index * 80 }}
                style={{ width: "48%" }}
              >
                <Pressable
                  disabled={isUnlocked || isUnlocking}
                  onPress={() => handleUnlock(reward)}
                  className="rounded-3xl bg-white p-4 shadow-sm"
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                  }}
                >
                  <View
                    className={`h-16 w-16 rounded-2xl items-center justify-center mb-3 ${
                      isUnlocked ? "bg-[#3F7B1E]" : "bg-[#F2F8EC]"
                    }`}
                  >
                    <Ionicons
                      name={reward.icon}
                      size={28}
                      color={isUnlocked ? "#fff" : "#3F7B1E"}
                    />
                    {isUnlocked && (
                      <View className="absolute -top-1 -right-1 bg-white rounded-full">
                        <Ionicons name="checkmark-circle" size={20} color="#3F7B1E" />
                      </View>
                    )}
                  </View>

                  <Text className="text-xs font-bold uppercase text-gray-400 mb-1">
                    {reward.category}
                  </Text>
                  <Text className="text-base font-bold text-gray-900 mb-1">{reward.title}</Text>
                  <Text
                    className="text-xs text-gray-500 mb-3 leading-relaxed"
                    numberOfLines={2}
                  >
                    {reward.description}
                  </Text>

                  {isUnlocked ? (
                    <View className="flex-row items-center justify-center rounded-xl py-2 bg-[#F2F8EC]">
                      <Text className="text-xs font-bold text-[#3F7B1E]">Unlocked</Text>
                    </View>
                  ) : (
                    <View
                      className={`flex-row items-center justify-center rounded-xl py-2 ${
                        isUnlocking
                          ? "bg-gray-200"
                          : canAfford
                            ? "bg-[#3F7B1E]"
                            : "bg-gray-100"
                      }`}
                    >
                      {isUnlocking ? (
                        <Text className="text-xs font-bold text-gray-500">Unlocking...</Text>
                      ) : (
                        <>
                          <Ionicons
                            name="leaf"
                            size={12}
                            color={canAfford ? "#fff" : "#9CA3AF"}
                          />
                          <Text
                            className={`ml-1 text-xs font-bold ${
                              canAfford ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {reward.cost}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </Pressable>
              </MotiView>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}