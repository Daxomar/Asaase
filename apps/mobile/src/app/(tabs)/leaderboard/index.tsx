import { Ionicons } from "@expo/vector-icons";
import { Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../../store/userStore";
import { MotiView } from "moti";

type LeaderboardEntry = {
  id: string;
  name: string;
  tokens: number;
  tier: "Bronze" | "Silver" | "Gold" | "Emerald";
};

const TIER_COLORS: Record<LeaderboardEntry["tier"], string> = {
  Bronze: "#B08D57",
  Silver: "#A8A8A8",
  Gold: "#D4AF37",
  Emerald: "#3F7B1E",
};

const AVATAR_BG: Record<LeaderboardEntry["tier"], string> = {
  Bronze: "#F3EDE3",
  Silver: "#EFEFEF",
  Gold: "#FFF8E7",
  Emerald: "#F2F8EC",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Replace with real data from your backend/store
const LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", name: "Ama Owusu", tokens: 1240, tier: "Emerald" },
  { id: "2", name: "Kwame Boateng", tokens: 980, tier: "Gold" },
  { id: "3", name: "Efua Mensah", tokens: 875, tier: "Gold" },
  { id: "4", name: "You", tokens: 620, tier: "Silver" },
  { id: "5", name: "Kojo Asante", tokens: 410, tier: "Bronze" },
];

function AvatarCircle({
  name,
  tier,
  size = 40,
  borderWidth = 2,
}: {
  name: string;
  tier: LeaderboardEntry["tier"];
  size?: number;
  borderWidth?: number;
}) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_BG[tier],
        borderWidth,
        borderColor: TIER_COLORS[tier],
      }}
    >
      <Text
        style={{
          fontSize: size * 0.35,
          fontWeight: "800",
          color: TIER_COLORS[tier],
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { user } = useUserStore();
  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]" edges={["top"]}>
      <View className="px-6 py-4 bg-white rounded-b-3xl shadow-sm z-10">
        <Text className="text-2xl font-bold text-gray-900">Leaderboard</Text>
        <Text className="text-sm font-medium text-gray-500">See how you rank this week</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3 podium */}
        <View className="flex-row items-end justify-center mb-8 gap-3">
          {[1, 0, 2].map((order, visualIndex) => {
            const podiumEntry = LEADERBOARD[order];
            const heights = [90, 110, 75];
            if (!podiumEntry) return null;
            return (
              <MotiView
                key={podiumEntry.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 500, delay: visualIndex * 100 }}
                className="items-center"
                style={{ width: 90 }}
              >
                <AvatarCircle
                  name={podiumEntry.name}
                  tier={podiumEntry.tier}
                  size={56}
                  borderWidth={3}
                />
                <Text className="text-xs font-bold text-gray-900 mt-2" numberOfLines={1}>
                  {podiumEntry.name}
                </Text>
                <Text className="text-[10px] text-gray-500 mb-2">{podiumEntry.tokens} pts</Text>
                <View
                  className="w-full rounded-t-xl items-center justify-start pt-2"
                  style={{
                    height: heights[visualIndex],
                    backgroundColor: TIER_COLORS[podiumEntry.tier],
                  }}
                >
                  <Text className="text-white font-bold text-lg">{order + 1}</Text>
                </View>
              </MotiView>
            );
          })}
        </View>

        <Text className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Full Ranking
        </Text>

        <View className="gap-3">
          {LEADERBOARD.map((entry, index) => {
            const isMe = entry.name === "You";
            return (
              <MotiView
                key={entry.id}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "timing", duration: 400, delay: index * 60 }}
              >
                <View
                  className={`flex-row items-center rounded-2xl p-4 ${
                    isMe ? "bg-[#3F7B1E]" : "bg-white"
                  }`}
                  style={
                    !isMe
                      ? {
                          elevation: 1,
                          shadowColor: "#000",
                          shadowOpacity: 0.04,
                          shadowRadius: 6,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`w-6 text-center font-bold ${isMe ? "text-white" : "text-gray-400"}`}
                  >
                    {index + 1}
                  </Text>
                  <View className="mx-3">
                    {isMe ? (
                      <View
                        className="items-center justify-center rounded-full"
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderWidth: 2,
                          borderColor: "rgba(255,255,255,0.5)",
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                          {getInitials(entry.name)}
                        </Text>
                      </View>
                    ) : (
                      <AvatarCircle name={entry.name} tier={entry.tier} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold ${isMe ? "text-white" : "text-gray-900"}`}>
                      {entry.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <View
                        className="h-2 w-2 rounded-full mr-1"
                        style={{ backgroundColor: isMe ? "#fff" : TIER_COLORS[entry.tier] }}
                      />
                      <Text className={`text-xs ${isMe ? "text-white/80" : "text-gray-500"}`}>
                        {entry.tier}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="leaf" size={14} color={isMe ? "#fff" : "#3F7B1E"} />
                    <Text className={`ml-1 font-bold ${isMe ? "text-white" : "text-gray-900"}`}>
                      {entry.tokens}
                    </Text>
                  </View>
                </View>
              </MotiView>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
