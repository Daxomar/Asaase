import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [isFocused, setIsFocused] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // We only want the camera to be active when the tab is focused
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#3F7B1E" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="camera" size={32} color="#9CA3AF" />
        </View>
        <Text className="mb-4 text-center text-xl font-bold text-gray-900">
          We need your permission to show the camera
        </Text>
        <Text className="mb-8 text-center text-base text-gray-500">
          To report blocked drains or flooding, Asaase requires access to your camera.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="flex-row items-center justify-center rounded-full bg-[#3F7B1E] px-8 py-4"
        >
          <Text className="font-bold text-white">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  async function takePicture() {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (photo && photo.uri) {
        // Navigate to confirm screen
        router.push({ pathname: "/scan/confirm", params: { photoUri: photo.uri } });
      }
    } catch (e) {
      console.warn("Failed to take picture", e);
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <View className="flex-1 bg-black">
      {isFocused ? (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
        >
          <SafeAreaView className="flex-1 justify-between">
            {/* Top Bar */}
            <View className="flex-row items-center justify-between px-6 pt-4">
              <TouchableOpacity
                onPress={() => router.push("/")}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
              >
                <Ionicons name="camera-reverse" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View className="items-center pb-20">
              <View className="mb-6 rounded-full bg-black/40 px-4 py-2">
                <Text className="text-sm font-semibold text-white">Align the blocked drain in frame</Text>
              </View>

              <View className="flex-row items-center gap-12">
                <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-full bg-black/40">
                  <Ionicons name="images" size={22} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={takePicture}
                  disabled={isCapturing}
                  className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-transparent"
                >
                  <View className="h-16 w-16 rounded-full bg-white opacity-90" />
                </TouchableOpacity>

                <View className="h-12 w-12" /> {/* Spacer to balance flex-row */}
              </View>
            </View>
          </SafeAreaView>
        </CameraView>
      ) : (
        <View className="flex-1 bg-black" />
      )}
    </View>
  );
}