import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../../store/userStore";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyScreen() {
  const { completeOnboarding } = useUserStore();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (text: string, index: number) => {
    // handle paste of full code
    if (text.length > 1) {
      const digits = text.slice(0, CODE_LENGTH).split("");
      const next = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = d;
      });
      setCode(next);
      const lastFilled = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputs.current[lastFilled]?.focus();
      return;
    }

    const next = [...code];
    next[index] = text;
    setCode(next);

    if (text && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isComplete = code.every((d) => d !== "");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>

          {/* Logo */}
          <View className="mt-6 flex-row items-center gap-2">
            <Ionicons name="leaf" size={40} color="#3F7B1E" />
          </View>

          {/* Heading */}
          <Text className="mt-4 text-3xl font-bold text-black">
            Verify your number
          </Text>
          <Text className="mt-2 text-base text-text-on-dark-muted">
            {"We sent a 6-digit code to your phone. Enter it below to "}
            continue.
          </Text>

          {/* Code inputs */}
          <View className="mt-10 flex-row justify-between gap-2">
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputs.current[i] = ref;
                }}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                textAlign="center"
                className={`h-14 w-12 rounded-xl border text-xl font-bold text-center text-black ${
                  digit
                    ? "border-[#3F7B1E] bg-[#F2F8EC]"
                    : "border-gray-200 bg-gray-50"
                }`}
              />
            ))}
          </View>

          {/* Resend */}
          <View className="mt-6 flex-row justify-center">
            {secondsLeft > 0 ? (
              <Text className="text-sm text-text-on-dark-muted">
                Resend code in {secondsLeft}s
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setSecondsLeft(RESEND_SECONDS)}>
                <Text className="text-sm font-bold text-[#3F7B1E]">
                  Resend code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            disabled={!isComplete}
            className={`mb-8 mt-auto flex-row items-center justify-center rounded-full py-4 ${
              isComplete ? "bg-[#3F7B1E]" : "bg-gray-200"
            }`}
            activeOpacity={0.85}
            onPress={() => {
              // No real OTP check against the backend (device-id auth has no email/phone
              // concept, ORCHESTRATOR_CONTRACT.md §6) - this is the terminal step of the
              // cosmetic sign-up flow. Real identity gets established silently on the home
              // screen via getOrCreateDeviceId()/bootstrapDevice(), same as every other path.
              completeOnboarding();
              router.replace("/");
            }}
          >
            <Text
              className={`text-base font-bold ${
                isComplete ? "text-white" : "text-gray-400"
              }`}
            >
              Verify
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}