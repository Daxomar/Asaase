import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, fetchMe, redeemReward } from "../../lib/api";
import { getOrCreateDeviceId } from "../../lib/device";

// CATALOG GAP (flagging for orchestrator, not silently working around it): ORCHESTRATOR_CONTRACT
// §3's route table only names POST /api/marketplace/redeem for T10 — no GET catalog-listing
// endpoint exists (confirmed by reading apps/backend/src/routes/gamification.ts directly; T10's
// own handoff comment says the same and punts a listing route to this task if needed live).
// Redeem is server-authoritative on price/balance either way, so this list is READ ONLY for
// rendering the grid — mirrored verbatim from that file's REWARD_CATALOG, not invented. If the
// backend catalog changes, this goes stale silently; real fix is a GET /api/marketplace/catalog
// route (or promoting this table into shared/domain) — both are backend edits out of this task's
// bound-ok (apps/mobile/** only).
const REWARD_CATALOG: Record<string, { cost: number; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  "mtn-data-1gb": { cost: 20, label: "MTN 1GB Data Bundle", icon: "cellular" },
  "mtn-airtime-5": { cost: 40, label: "MTN GHS 5 Airtime Voucher", icon: "call" },
  "cleanup-gear-kit": { cost: 60, label: "Cleanup Gear Kit (gloves + bags)", icon: "construct" },
  "eco-tshirt": { cost: 100, label: "Asaase Eco T-Shirt", icon: "shirt" },
};

type Screen =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tokens: number };

function RewardCard({
  rewardId,
  cost,
  label,
  icon,
  balance,
  busy,
  onRedeem,
  rejected,
}: {
  rewardId: string;
  cost: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  balance: number;
  busy: boolean;
  onRedeem: (rewardId: string, cost: number) => void;
  rejected: boolean;
}) {
  const affordable = balance >= cost;
  const shakeX = useSharedValue(0);

  useEffect(() => {
    // ponytail: one-shot shake on the exact card the server just rejected — denial feedback is
    // the motivated case for this motion, not decoration (design-taste: motion needs a reason).
    if (rejected) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [rejected, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <Animated.View style={[shakeStyle, { width: "48%" }]}>
      <TouchableOpacity
        disabled={busy}
        onPress={() => onRedeem(rewardId, cost)}
        className={`gap-3 rounded-2xl border p-4 active:scale-95 disabled:opacity-50 ${
          affordable ? "border-forest-ink bg-forest-ink" : "border-forest-ink/60 bg-forest-ink/40"
        }`}
      >
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: affordable ? "rgba(217,172,57,0.18)" : "rgba(159,176,162,0.14)" }}
        >
          <Ionicons name={icon} size={22} color={affordable ? "#d9ac39" : "#9fb0a2"} />
        </View>
        <Text className="text-sm font-semibold text-text-on-dark">{label}</Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="leaf" size={13} color={affordable ? "#d9ac39" : "#9fb0a2"} />
          <Text className={`text-xs font-medium ${affordable ? "text-gold" : "text-text-on-dark-muted"}`}>
            {cost} tokens
          </Text>
        </View>
        {!affordable ? (
          <Text className="text-[11px] text-text-on-dark-muted">Need {cost - balance} more</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MarketplaceScreen() {
  const [screen, setScreen] = useState<Screen>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    setScreen({ status: "loading" });
    try {
      const deviceId = await getOrCreateDeviceId();
      const user = await fetchMe(deviceId);
      setScreen({ status: "ready", tokens: user.tokens });
    } catch (err) {
      setScreen({ status: "error", message: err instanceof Error ? err.message : "Could not load marketplace." });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleRedeem(rewardId: string, cost: number) {
    if (screen.status !== "ready" || busy) return;
    setBusy(true);
    setRejectedId(null);
    try {
      const deviceId = await getOrCreateDeviceId();
      const { tokens } = await redeemReward(deviceId, rewardId, cost);
      setScreen({ status: "ready", tokens });
      setCelebrating(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Redeem failed.";
      setRejectedId(rewardId);
      flashToast(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // clear the shake trigger next tick so re-tapping the same card can re-trigger it
      setTimeout(() => setRejectedId(null), 50);
    } finally {
      setBusy(false);
    }
  }

  if (screen.status === "loading") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-forest-deep">
        <ActivityIndicator color="#d9ac39" />
        <Text className="mt-3 text-sm text-text-on-dark-muted">Loading rewards…</Text>
      </SafeAreaView>
    );
  }

  if (screen.status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-forest-deep px-8">
        <Ionicons name="alert-circle" size={40} color="#b8382f" />
        <Text className="text-center text-base text-text-on-dark">{screen.message}</Text>
        <TouchableOpacity onPress={load} className="rounded-full bg-gold px-6 py-3 active:scale-95">
          <Text className="font-semibold text-forest-deep">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-forest-deep">
      <View className="flex-1 px-6 py-6">
        <View className="mb-2 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="#f3f1e6" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2 rounded-full bg-forest-ink px-4 py-2">
            <Ionicons name="leaf" size={16} color="#d9ac39" />
            <Text className="text-sm font-medium text-text-on-dark">{screen.tokens} Eco-Tokens</Text>
          </View>
        </View>

        <Text className="mb-1 text-2xl font-bold text-text-on-dark">Marketplace</Text>
        <Text className="mb-6 text-sm text-text-on-dark-muted">Redeem tokens for real partner rewards</Text>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {Object.entries(REWARD_CATALOG).map(([rewardId, reward]) => (
            <RewardCard
              key={rewardId}
              rewardId={rewardId}
              cost={reward.cost}
              label={reward.label}
              icon={reward.icon}
              balance={screen.tokens}
              busy={busy}
              onRedeem={handleRedeem}
              rejected={rejectedId === rewardId}
            />
          ))}
        </View>
      </View>

      {toast ? (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 200 }}
          className="absolute bottom-10 left-6 right-6 flex-row items-center gap-2 rounded-2xl border border-critical/40 bg-forest-ink px-4 py-3"
        >
          <Ionicons name="close-circle" size={18} color="#b8382f" />
          <Text className="flex-1 text-sm text-text-on-dark">{toast}</Text>
        </MotiView>
      ) : null}

      {celebrating ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <LottieView
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- RN static asset loading requires require()
            source={require("../../../assets/lottie/confetti.json")}
            autoPlay
            loop={false}
            style={{ width: 280, height: 320 }}
            onAnimationFinish={() => setCelebrating(false)}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
