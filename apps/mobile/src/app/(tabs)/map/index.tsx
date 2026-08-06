import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";

// TODO: replace this list with an actual map (react-native-maps or similar) once
// you're ready to integrate one — this list view is a functional placeholder so
// the route + navigation pattern exist now, without blocking on a mapping library.
const reports = [
  { id: "1", title: "Blocked drain — Spintex Rd", risk: "High", distanceKm: 0.4 },
  { id: "2", title: "Standing water — Achimota", risk: "Medium", distanceKm: 1.2 },
  { id: "3", title: "Cleared drain — East Legon", risk: "Low", distanceKm: 2.1 },
];

const riskColor: Record<string, string> = {
  High: "#DC2626",
  Medium: "#F59E0B",
  Low: "#3F7B1E",
};

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="ml-3 text-xl font-bold text-black">Flood risk near you</Text>
      </View>

      {/* Placeholder for a real map view */}
      <View className="mx-6 mt-5 h-48 items-center justify-center rounded-2xl bg-gray-100">
        <Ionicons name="map" size={36} color="#9CA3AF" />
        <Text className="mt-2 text-xs text-text-on-dark-muted">Map view coming soon</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-3 text-sm font-semibold text-black">Recent reports</Text>
        <View className="gap-2">
          {reports.map((r) => (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.85}
              className="flex-row items-center rounded-xl border border-gray-100 bg-white p-4"
              onPress={() => router.push(`/map/${r.id}`)}
            >
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: riskColor[r.risk] }}
              />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-black">{r.title}</Text>
                <Text className="mt-0.5 text-xs text-text-on-dark-muted">
                  {r.risk} risk · {r.distanceKm} km away
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}