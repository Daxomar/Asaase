import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "../store/userStore";
import { bootstrapDevice, fetchMe } from "../lib/api";
import { getOrCreateDeviceId } from "../lib/device";
import { scheduleStreakReminder } from "../lib/streakReminder";

// ponytail: flat threshold, no XP curve — every 100 XP is one level. Revisit only if a designer
// asks for level-scaling; a naive constant is the whole feature until then.
const XP_PER_LEVEL = 100;

const ACCENT = "#3F7B1E";
const ACCENT_SOFT = "#F2F8EC";
const AMBER = "#d9ac39";

function levelOf(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View>
      <Text className="text-[28px] font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-[11px] uppercase tracking-wide text-white/70">
        {label}
      </Text>
    </View>
  );
}

type QuickActionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

// The four required home-screen surfaces (learning path, scan-to-earn, point store, map/impact)
// all render through this one card shape — same tap-target, same anatomy, differ only by content.
function QuickActionCard({ icon, iconBg, iconColor, title, subtitle, onPress }: QuickActionCardProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.85}
      className="w-[48%] rounded-2xl border border-gray-100 bg-white p-4"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text className="mt-3 text-[15px] font-semibold text-black">{title}</Text>
      <Text className="mt-1 text-xs text-text-on-dark-muted">{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user, status, errorMessage, setUser, setStatus } = useUserStore();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const deviceId = await getOrCreateDeviceId();
      await bootstrapDevice(deviceId); // first-launch upsert, no-op after (ORCHESTRATOR_CONTRACT.md §6)
      const fetchedUser = await fetchMe(deviceId);
      setUser(fetchedUser);
      // A-06, best-effort local reminder only — never let a scheduling hiccup break the screen.
      scheduleStreakReminder(fetchedUser.lastActivityAt).catch(() => {});
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Could not reach Asaase.");
    }
  }, [setStatus, setUser]);

  useEffect(() => {
    load();
  }, [load]);

  // Quiz/scan award XP/tokens server-side while this screen is off-focus. Re-pull the real
  // totals whenever the user returns here instead of trusting whatever was last rendered.
  useFocusEffect(
    useCallback(() => {
      if (status !== "ready") return;
      (async () => {
        try {
          const deviceId = await getOrCreateDeviceId();
          const fetchedUser = await fetchMe(deviceId);
          setUser(fetchedUser);
          scheduleStreakReminder(fetchedUser.lastActivityAt).catch(() => {});
        } catch {
          // best-effort refresh — keep showing the last known totals rather than bouncing
          // to an error screen over a transient refetch failure
        }
      })();
    }, [status, setUser]),
  );

  if (status === "loading" || !user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={ACCENT} />
        <Text className="mt-3 text-sm text-text-on-dark-muted">Loading your flood watch…</Text>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-white px-8">
        <Ionicons name="alert-circle" size={40} color="#b8382f" />
        <Text className="text-center text-base text-black">{errorMessage}</Text>
        <TouchableOpacity
          onPress={load}
          className="rounded-full px-6 py-3 active:scale-95"
          style={{ backgroundColor: ACCENT }}
        >
          <Text className="font-semibold text-white">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header panel — identity + at-a-glance stats, brand green chrome (reserved for
          headers/nav, not full-screen surfaces — matches the dashboard's own rule). */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
        className="rounded-b-[28px] px-6 pb-7 pt-4"
        style={{ backgroundColor: ACCENT }}
      >
        <Text className="text-2xl font-bold text-white">Asaase</Text>
        <Text className="text-sm text-white/70">Climate Resolution</Text>

        <View className="mt-6 flex-row justify-between pr-4">
          <StatBlock value={user.streak} label="Day streak" />
          <StatBlock value={levelOf(user.xp)} label="Level" />
          <StatBlock value={user.tokens} label="Eco-Tokens" />
        </View>
      </MotiView>

      {/* Quick actions — the four surfaces every visit needs to surface: scan-to-earn, the
          learning path, the point store, and community/map impact. */}
      <View className="flex-1 px-6 pt-6">
        <Text className="mb-3 text-[15px] font-semibold text-black">Quick actions</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <QuickActionCard
            icon="camera"
            iconBg={ACCENT_SOFT}
            iconColor={ACCENT}
            title="Scan a drain"
            subtitle="Earn points instantly"
            onPress={() => router.push("/scan")}
          />
          <QuickActionCard
            icon="school"
            iconBg={ACCENT_SOFT}
            iconColor={ACCENT}
            title="Learning path"
            subtitle="Grow your eco-score"
            onPress={() => router.push("/quiz")}
          />
          <QuickActionCard
            icon="gift"
            iconBg="#FAF0D6"
            iconColor={AMBER}
            title="Point store"
            subtitle={`${user.tokens} tokens available`}
            onPress={() => router.push("/marketplace")}
          />
          <QuickActionCard
            icon="map"
            iconBg={ACCENT_SOFT}
            iconColor={ACCENT}
            title="Flood map"
            subtitle="See risk near you"
            onPress={() =>
              // No mobile map screen exists yet (PRD's mobile inventory is Home/Quiz/Scan/
              // Marketplace only — the live map is the web dashboard). Placeholder, not a
              // silent dead route, until a real in-app map screen is built.
              Alert.alert("Flood map", "Coming soon on mobile — live now on the web dashboard.")
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}