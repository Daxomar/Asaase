import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useRef, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Scan } from "@asaase/shared";
import { analyzeScan, API_URL } from "../../lib/api";
import { getOrCreateDeviceId } from "../../lib/device";

// ORCHESTRATOR_CONTRACT.md §7 — human labels for the PRD's 4-value enum, quiz.tsx has no
// equivalent map since it only names blockages in prose; this is the first screen that renders
// the enum value itself to a user.
const BLOCKAGE_LABEL: Record<Scan["blockageType"], string> = {
  sachet_water_rubbers: "Sachet water rubbers",
  pet_bottles: "PET bottles",
  silt_sand: "Silt & sand",
  overgrown_weeds: "Overgrown weeds",
};

type Screen =
  | { status: "camera-denied" }
  | { status: "ready" }
  | { status: "capturing" }
  | { status: "result"; scan: Scan }
  | { status: "error"; message: string };

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [screen, setScreen] = useState<Screen>({ status: "ready" });
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (screen.status === "capturing" || !cameraRef.current) return;
    setScreen({ status: "capturing" });
    try {
      // PRD FEAT-003: GPS is pulled at capture time, not on screen mount — no reason to hold a
      // location lock while the user is just framing the shot.
      const locPermission = await Location.requestForegroundPermissionsAsync();
      if (!locPermission.granted) {
        setScreen({ status: "error", message: "Location access is required to log where this drain is." });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) throw new Error("Camera did not return a photo.");

      const deviceId = await getOrCreateDeviceId();
      const { scan } = await analyzeScan(deviceId, photo.uri, position.coords.latitude, position.coords.longitude);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreen({ status: "result", scan });
    } catch (err) {
      setScreen({ status: "error", message: err instanceof Error ? err.message : "Scan failed." });
    }
  }

  function reset() {
    setScreen({ status: "ready" });
  }

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-forest-deep">
        <ActivityIndicator color="#d9ac39" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-forest-deep px-8">
        <Ionicons name="camera-outline" size={40} color="#9fb0a2" />
        <Text className="text-center text-base text-text-on-dark">
          Asaase needs camera access to photograph blocked drains.
        </Text>
        {permission.canAskAgain ? (
          <TouchableOpacity onPress={requestPermission} className="rounded-full bg-gold px-6 py-3 active:scale-95">
            <Text className="font-semibold text-forest-deep">Grant camera access</Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-center text-sm text-text-on-dark-muted">
            Camera access was denied. Enable it from your device Settings to scan a drain.
          </Text>
        )}
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-sm text-text-on-dark-muted">Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen.status === "result") {
    const { scan } = screen;
    return (
      <SafeAreaView className="flex-1 bg-forest-deep">
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <Image source={{ uri: `${API_URL}${scan.imageUrl}` }} className="h-48 w-48 rounded-2xl" />
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-text-on-dark">{BLOCKAGE_LABEL[scan.blockageType]}</Text>
            <Text className="text-sm text-text-on-dark-muted">
              {Math.round(scan.confidence * 100)}% confidence
            </Text>
          </View>
          <View className="flex-row gap-4">
            <View className="items-center rounded-2xl bg-forest-ink px-5 py-3">
              <Text className="text-xl font-bold text-gold">{scan.severity}/5</Text>
              <Text className="text-xs text-text-on-dark-muted">Severity</Text>
            </View>
          </View>
          <View className="w-full gap-3">
            <TouchableOpacity onPress={reset} className="items-center rounded-full bg-gold px-6 py-4 active:scale-95">
              <Text className="font-semibold text-forest-deep">Scan another drain</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} className="items-center p-2">
              <Text className="text-sm text-text-on-dark-muted">Back to home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen.status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-forest-deep px-8">
        <Ionicons name="alert-circle" size={40} color="#b8382f" />
        <Text className="text-center text-base text-text-on-dark">{screen.message}</Text>
        <TouchableOpacity onPress={reset} className="rounded-full bg-gold px-6 py-3 active:scale-95">
          <Text className="font-semibold text-forest-deep">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const capturing = screen.status === "capturing";

  return (
    <View className="flex-1 bg-forest-deep">
      <CameraView ref={cameraRef} className="flex-1" facing="back">
        <SafeAreaView className="flex-1">
          <TouchableOpacity onPress={() => router.back()} className="m-4 h-10 w-10 items-center justify-center rounded-full bg-black/40">
            <Ionicons name="close" size={22} color="#f3f1e6" />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center">
            {/* Bounding-box overlay affordance (PRD FEAT-003) — a reticle suggesting where to aim,
                not real-time object detection. Breathing pulse reuses the same MotiView pattern as
                the home screen's StreakIcon for a consistent, motivated micro-motion language. */}
            <MotiView
              from={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 1400, loop: true, repeatReverse: true }}
              className="h-64 w-64"
            >
              <Corner className="left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl" />
              <Corner className="right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl" />
              <Corner className="bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl" />
              <Corner className="bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl" />
            </MotiView>
            <Text className="mt-6 text-sm text-text-on-dark-muted">Aim at the drain or chokepoint</Text>
          </View>

          <View className="items-center pb-8">
            <TouchableOpacity
              onPress={handleCapture}
              disabled={capturing}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-gold bg-forest-deep active:scale-95 disabled:opacity-60"
            >
              {capturing ? <ActivityIndicator color="#d9ac39" /> : <View className="h-14 w-14 rounded-full bg-gold" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

function Corner({ className }: { className: string }) {
  return <View className={`absolute h-8 w-8 border-gold ${className}`} />;
}
