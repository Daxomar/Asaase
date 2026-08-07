import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, ScrollView, TextInput, Image, ImageBackground, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { useUserStore } from "../../store/userStore";
import { bootstrapDevice, fetchMe } from "../../lib/api";
import { getOrCreateDeviceId } from "../../lib/device";
import { scheduleStreakReminder } from "../../lib/streakReminder";

const XP_PER_LEVEL = 100;
function levelOf(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function StatBadge({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap, value: string | number, label: string, color: string }) {
  return (
    <View className="flex-1 items-center justify-center rounded-2xl bg-white/15 py-3" style={{ backdropFilter: "blur(8px)" }}>
      <Ionicons name={icon} size={20} color={color} className="mb-1" />
      <Text className="text-[17px] font-bold text-white">{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{label}</Text>
    </View>
  );
}

function GoalItem({ icon, iconColor, title, subtitle, done }: { icon: any, iconColor: string, title: string, subtitle: string, done: boolean }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white p-4 mb-3 shadow-sm" style={{ shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          <Ionicons name={icon} size={22} color={done ? "#3F7B1E" : iconColor} />
        </View>
        <View>
          <Text className={`text-[15px] font-bold ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{title}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
        </View>
      </View>
      <View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${done ? 'bg-[#3F7B1E] border-[#3F7B1E]' : 'border-gray-200'}`}>
        {done && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user, status, errorMessage, setUser, setStatus } = useUserStore();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const deviceId = await getOrCreateDeviceId();
      await bootstrapDevice(deviceId);
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
        } catch {}
      })();
    }, [status, setUser]),
  );

  if (status === "loading" || !user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F7FA]">
        <ActivityIndicator color="#3F7B1E" />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-[#F5F7FA] px-8">
        <Ionicons name="alert-circle" size={40} color="#b8382f" />
        <Text className="text-center text-base text-black">{errorMessage}</Text>
        <TouchableOpacity onPress={load} className="rounded-full bg-[#3F7B1E] px-6 py-3 active:scale-95">
          <Text className="font-semibold text-white">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* HERO SECTION WITH STATS */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          <ImageBackground 
            source={{ uri: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800" }} 
            className="overflow-hidden rounded-b-[40px]"
            imageStyle={{ opacity: 0.8 }}
          >
            <View className="bg-[#3F7B1E]/85" style={{ backdropFilter: "blur(20px)" }}>
              <SafeAreaView edges={["top"]} />
              <View className="px-6 pb-10 pt-4">
                
                {/* Top Bar: Logo & Actions */}
                <View className="flex-row items-center justify-between">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                    <Ionicons name="leaf" size={24} color="#3F7B1E" />
                  </View>

                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                      onPress={() => setShareModalVisible(true)}
                      className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
                    >
                      <Ionicons name="qr-code-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setProfileModalVisible(true)}
                      className="h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white/20"
                    >
                      <Ionicons name="person" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

              {/* Headline */}
              <Text className="mt-8 text-[32px] font-bold leading-tight text-white">
                All Your Climate{"\n"}Risks In One Place
              </Text>

              {/* User Stats Dashboard */}
              <View className="mt-8 flex-row items-center justify-between gap-3">
                <StatBadge icon="flame" value={user.streak} label="Streak" color="#ff9600" />
                <StatBadge icon="star" value={levelOf(user.xp)} label="Level" color="#fbbf24" />
                <StatBadge icon="leaf" value={user.tokens} label="Tokens" color="#86efac" />
              </View>

              </View>
            </View>
          </ImageBackground>
        </MotiView>

        {/* ACTIVE CLIMATE ALERTS (MAP FEATURE) */}
        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-bold uppercase tracking-wider text-gray-500">
              Active Climate Alerts
            </Text>
            <TouchableOpacity onPress={() => router.push("/map")}>
              <Text className="text-[13px] font-semibold text-gray-400">See Map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.9} 
            className="mt-4 overflow-hidden rounded-3xl bg-white"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: 8 },
              elevation: 3,
            }}
            onPress={() => router.push("/map")}
          >
            {/* Mock Map Background */}
            <ImageBackground 
              source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" }} 
              className="h-48 w-full p-4 justify-between"
              imageStyle={{ opacity: 0.7 }}
            >
              {/* Status Badge */}
              <View className="self-start rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-orange-500" />
                  <Text className="text-[11px] font-bold text-gray-800">High Risk Zone</Text>
                </View>
              </View>

              {/* Floating Alert Card inside Map */}
              <View className="flex-row items-center justify-between rounded-2xl bg-white/95 p-4 shadow-sm" style={{ backdropFilter: "blur(10px)" }}>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <Ionicons name="warning" size={18} color="#DC2626" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-gray-900">Osu Drain Blockage</Text>
                    <Text className="text-xs text-gray-500">Reported 2 hrs ago</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* DAILY GOALS */}
        <View className="mt-10 px-6">
          <Text className="mb-4 text-[13px] font-bold uppercase tracking-wider text-gray-500">
            Daily Goals
          </Text>
          
          <GoalItem 
            icon="camera" 
            iconColor="#D97706" 
            title="Scan 1 Blocked Drain" 
            subtitle="+50 XP" 
            done={false} 
          />
          <GoalItem 
            icon="book" 
            iconColor="#DC2626" 
            title="Complete 1 Lesson" 
            subtitle="+25 XP" 
            done={true} 
          />
          <GoalItem 
            icon="flame" 
            iconColor="#ff9600" 
            title="Maintain your streak" 
            subtitle="Log in today" 
            done={true} 
          />
        </View>

      </ScrollView>

      {/* PROFILE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={() => setProfileModalVisible(false)} />
          <View className="rounded-t-[32px] bg-white px-6 pb-10 pt-6" style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: -10 }, elevation: 10 }}>
            
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">Your Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-8 items-center">
              <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="person" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-[22px] font-bold text-gray-900">{user.name || "Climate Hero"}</Text>
              <Text className="text-base text-gray-500">{user.email || "hero@asaase.earth"}</Text>
            </View>

            <TouchableOpacity 
              className="flex-row items-center justify-center rounded-2xl bg-gray-100 py-4"
              onPress={() => {
                setProfileModalVisible(false);
                // logout logic would go here
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" className="mr-2" />
              <Text className="ml-2 text-base font-bold text-red-500">Log Out</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* SHARE PROFILE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Pressable className="flex-1" onPress={() => setShareModalVisible(false)} />
          <View className="rounded-t-[32px] bg-white px-6 pb-10 pt-6" style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: -10 }, elevation: 10 }}>
            
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">Connect with friends</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-center text-sm text-gray-500 mb-6">Scan this QR code to add me as a friend and see my climate impact.</Text>

            <View className="items-center mb-6">
              <View className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                {/* Mock QR Code */}
                <Ionicons name="qr-code" size={140} color="#1F2937" />
              </View>
            </View>

            <View className="flex-row justify-center gap-4 mb-4">
              <View className="bg-[#FFF1E0] px-4 py-3 rounded-2xl flex-row items-center border border-[#ff9600]/20">
                <Ionicons name="flame" size={20} color="#ff9600" />
                <Text className="ml-2 font-bold text-gray-800">{user.streak} Day Streak</Text>
              </View>
              <View className="bg-[#F2F8EC] px-4 py-3 rounded-2xl flex-row items-center border border-[#3F7B1E]/20">
                <Ionicons name="star" size={20} color="#fbbf24" />
                <Text className="ml-2 font-bold text-gray-800">Level {levelOf(user.xp)}</Text>
              </View>
            </View>

            <TouchableOpacity 
              className="mt-4 flex-row items-center justify-center rounded-2xl bg-[#3F7B1E] py-4 shadow-sm"
              onPress={() => setShareModalVisible(false)}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" className="mr-2" />
              <Text className="ml-2 text-base font-bold text-white">Share Link</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}