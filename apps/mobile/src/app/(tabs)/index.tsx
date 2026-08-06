import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUserStore } from "../../store/userStore";
import { bootstrapDevice, fetchMe, pingStreak, submitQuiz } from "../../lib/api";
import { getOrCreateDeviceId } from "../../lib/device";
import { scheduleStreakReminder } from "../../lib/streakReminder";

const XP_PER_LEVEL = 100;

function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const inLevel = xp % XP_PER_LEVEL;
  return { level, inLevel, progress: inLevel / XP_PER_LEVEL };
}

function StreakIcon({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 14 }}
      className="h-28 w-28 items-center justify-center rounded-full"
      style={{ backgroundColor: active ? "rgba(255,150,0,0.15)" : "#f3f4f6" }}
    >
      <MotiView
        animate={{ scale: active ? 1.08 : 1 }}
        transition={{ type: "timing", duration: 1100, loop: active, repeatReverse: true }}
      >
        <Ionicons name={active ? "flame" : "shield-checkmark"} size={52} color={active ? "#ff9600" : "#d1d5db"} />
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
        <Text className="text-sm font-bold text-gray-800">Level {level}</Text>
        <Text className="text-xs font-bold text-gray-500">
          {inLevel} / {XP_PER_LEVEL} XP
        </Text>
      </View>
      <View className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <Animated.View style={fillStyle} className="h-full rounded-full bg-[#ffc800]" />
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
      scheduleStreakReminder(fetchedUser.lastActivityAt).catch(() => {});
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Could not reach Asaase.");
    }
  }, [setStatus, setUser]);

  useEffect(() => {
    load();
  }, [load]);

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
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#58cc02" />
        <Text className="mt-3 text-sm font-medium text-gray-500">Loading your profile…</Text>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-white px-8">
        <Ionicons name="alert-circle" size={40} color="#ff4b4b" />
        <Text className="text-center text-base font-bold text-gray-800">{errorMessage}</Text>
        <TouchableOpacity onPress={load} className="rounded-full bg-blue-500 px-6 py-3 active:scale-95">
          <Text className="font-bold text-white uppercase">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between px-6 py-8">
        <View>
          <Text className="text-3xl font-extrabold text-gray-800">Asaase</Text>
          <Text className="text-base font-medium text-gray-500 mt-1">Your eco-tracker profile</Text>
        </View>

        <View className="items-center gap-8 mt-8">
          <StreakIcon streak={user.streak} />
          <View className="items-center gap-1">
            <Text className="text-5xl font-black text-gray-800">{user.streak}</Text>
            <Text className="text-sm font-bold uppercase tracking-widest text-orange-400">
              day streak
            </Text>
          </View>

          <XpBar xp={user.xp} />

          <View className="flex-row items-center gap-2 rounded-2xl bg-green-100 px-5 py-3 border-b-4 border-green-200">
            <Ionicons name="leaf" size={18} color="#58cc02" />
            <Text className="text-base font-bold text-green-600">{user.tokens} Eco-Tokens</Text>
          </View>
        </View>

        <View className="gap-4 mt-8">
          <TouchableOpacity
            onPress={handleCheckIn}
            disabled={busy}
            className="items-center rounded-2xl bg-[#58cc02] px-6 py-4 active:scale-95 disabled:opacity-50 border-b-4 border-[#58a700]"
          >
            <Text className="text-lg font-bold uppercase tracking-wider text-white">Check in today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogEcoAction}
            disabled={busy}
            className="items-center rounded-2xl bg-white border-2 border-gray-200 px-6 py-4 active:scale-95 disabled:opacity-50 border-b-4"
          >
            <Text className="text-lg font-bold uppercase tracking-wider text-blue-500">Log manual action</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
