import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 pt-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>

          {/* Logo header */}
          <View className="mt-6 flex-row items-center gap-2">
            <Ionicons name="leaf" size={40} color="#3F7B1E" />
          </View>

          {/* Heading */}
          <Text className="mt-4 text-3xl font-bold text-black">
            Create your account
          </Text>
          <Text className="mt-2 text-base text-text-on-dark-muted">
            Join Asaase and start tracking, learning, and earning.
          </Text>

          {/* Form */}
          <View className="mt-8 gap-4">
            <View>
              <Text className="mb-2 text-sm font-semibold text-black">
                Full name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Kwame Mensah"
                placeholderTextColor="#9CA3AF"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-black"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-black">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-black"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-semibold text-black">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-black"
              />
            </View>
          </View>

          {/* Continue button */}
          <TouchableOpacity
            className="mb-4 mt-8 flex-row items-center justify-center rounded-full bg-[#3F7B1E] py-4"
            activeOpacity={0.85}
            onPress={() => {
              router.push("/(auth)/verify");
            }}
          >
            <Text className="text-base font-bold text-white">Continue</Text>
            <Ionicons
              name="chevron-forward"
              size={22}
              color="#ffffff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View className="my-2 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="text-xs text-text-on-dark-muted">
              or continue with
            </Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>

          {/* Social buttons */}
          <View className="mt-4 flex-row justify-center gap-4">
            <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <Ionicons name="logo-google" size={22} color="#1a1a1a" />
            </TouchableOpacity>
            <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <Ionicons name="logo-apple" size={22} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <View className="mb-8 mt-6 flex-row justify-center">
            <Text className="text-sm text-text-on-dark-muted">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
              <Text className="text-sm font-bold text-[#3F7B1E]">
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}