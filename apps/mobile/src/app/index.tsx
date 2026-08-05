import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "../store/userStore";
import { bootstrapDevice, fetchMe, pingStreak, submitQuiz } from "../lib/api";
import { getOrCreateDeviceId } from "../lib/device";
import { scheduleStreakReminder } from "../lib/streakReminder";

// ponytail: flat threshold, no XP curve — every 100 XP is one level. Revisit only if a designer
// asks for level-scaling; a naive constant is the whole feature until then.
const XP_PER_LEVEL = 100;

function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const inLevel = xp % XP_PER_LEVEL;
  return { level, inLevel, progress: inLevel / XP_PER_LEVEL };
}

// Animated flame/shield: shield while the streak is dormant (0), flame once it's alive, with a
// slow breathing loop that only runs while lit — reduce-motion is inherited for free since
// Reanimated's withTiming/withSpring default to ReducedMotion.System (honors the OS setting).
function StreakIcon({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 14 }}
      className="h-28 w-28 items-center justify-center rounded-full"
      style={{ backgroundColor: active ? "rgba(217,172,57,0.16)" : "rgba(30,138,70,0.14)" }}
    >
      <MotiView
        animate={{ scale: active ? 1.08 : 1 }}
        transition={{ type: "timing", duration: 1100, loop: active, repeatReverse: true }}
      >
        <Ionicons name={active ? "flame" : "shield-checkmark"} size={52} color={active ? "#d9ac39" : "#1e8a46"} />
      </MotiView>
    </MotiView>
  );
}

function XpBar({ xp }: { xp: number }) {
  const { level, inLevel, progress } = levelInfo(xp);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 700 });
  }, [progress, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View className="w-full gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-sm font-semibold text-text-on-dark">Level {level}</Text>
        <Text className="text-xs text-text-on-dark-muted">
          {inLevel} / {XP_PER_LEVEL} XP
        </Text>
      </View>
      <View className="h-3 w-full overflow-hidden rounded-full bg-forest-ink">
        <Animated.View style={fillStyle} className="h-full rounded-full bg-gold" />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user, status, errorMessage, setUser, setStatus } = useUserStore();
  const [busy, setBusy] = useState(false);

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

  // Quiz (T12) awards XP/tokens server-side while this screen is off-focus. Re-pull the real
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

  async function handleCheckIn() {
    if (status !== "ready" || busy || !user) return;
    setBusy(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const { streak, lastActivityAt } = await pingStreak(deviceId);
      setUser({ ...user, streak, lastActivityAt });
      scheduleStreakReminder(lastActivityAt).catch(() => {});
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  // Stand-in trigger for this task only: the real token-increment moment ships with the quiz
  // (T12) and scan (T13) flows. This button proves the flame/XP/haptic mechanism end to end
  // against the real backend now, without waiting on those screens.
  async function handleLogEcoAction() {
    if (status !== "ready" || busy || !user) return;
    setBusy(true);
    const prevTokens = user.tokens;
    try {
      const deviceId = await getOrCreateDeviceId();
      const { xp, tokens } = await submitQuiz(deviceId, "manual-checkin", true);
      if (tokens > prevTokens) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setUser({ ...user, xp, tokens });
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || !user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-forest-deep">
        <ActivityIndicator color="#d9ac39" />
        <Text className="mt-3 text-sm text-text-on-dark-muted">Loading your flood watch…</Text>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-forest-deep px-8">
        <Ionicons name="alert-circle" size={40} color="#b8382f" />
        <Text className="text-center text-base text-text-on-dark">{errorMessage}</Text>
        <TouchableOpacity onPress={load} className="rounded-full bg-gold px-6 py-3 active:scale-95">
          <Text className="font-semibold text-forest-deep">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-forest-deep">
      <View className="flex-1 justify-between px-6 py-8">
        <View>
          <Text className="text-2xl font-bold text-text-on-dark">Asaase</Text>
          <Text className="text-sm text-text-on-dark-muted">Your flood-watch profile</Text>
        </View>

        <View className="items-center gap-8">
          <StreakIcon streak={user.streak} />
          <View className="items-center gap-1">
            <Text className="text-4xl font-bold text-text-on-dark">{user.streak}</Text>
            <Text className="text-sm uppercase tracking-wide text-text-on-dark-muted">
              day streak
            </Text>
          </View>

          <XpBar xp={user.xp} />

          <View className="flex-row items-center gap-2 rounded-full bg-forest-ink px-4 py-2">
            <Ionicons name="leaf" size={16} color="#d9ac39" />
            <Text className="text-sm font-medium text-text-on-dark">{user.tokens} Eco-Tokens</Text>
          </View>
        </View>

        <View className="gap-3">
          <TouchableOpacity
            onPress={handleCheckIn}
            disabled={busy}
            className="items-center rounded-full bg-green px-6 py-4 active:scale-95 disabled:opacity-50"
          >
            <Text className="font-semibold text-text-on-dark">Check in today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/scan")}
            disabled={busy}
            className="flex-row items-center justify-center gap-2 rounded-full bg-forest-ink px-6 py-4 active:scale-95 disabled:opacity-50"
          >
            <Ionicons name="camera" size={18} color="#d9ac39" />
            <Text className="font-semibold text-text-on-dark">Scan a drain</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/quiz")}
            disabled={busy}
            className="flex-row items-center justify-center gap-2 rounded-full bg-forest-ink px-6 py-4 active:scale-95 disabled:opacity-50"
          >
            <Ionicons name="school" size={18} color="#d9ac39" />
            <Text className="font-semibold text-text-on-dark">Take the eco quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/marketplace")}
            disabled={busy}
            className="flex-row items-center justify-center gap-2 rounded-full bg-forest-ink px-6 py-4 active:scale-95 disabled:opacity-50"
          >
            <Ionicons name="gift" size={18} color="#d9ac39" />
            <Text className="font-semibold text-text-on-dark">Redeem Eco-Tokens</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogEcoAction}
            disabled={busy}
            className="items-center rounded-full border border-gold px-6 py-4 active:scale-95 disabled:opacity-50"
          >
            <Text className="font-semibold text-gold">Log eco action</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
