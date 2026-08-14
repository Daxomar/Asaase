import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { BLOCKAGE_LABEL, mapClusters, type SubPoint } from "../data/mapClusters";
import { THREAT, bandFromSeverity } from "../data/threat";

// Pure presentational panels shared by the native (react-native-maps) and web (react-leaflet)
// map screens - no map-library dependency here, so this half of the feature isn't duplicated
// per platform.

export function DefaultPanel() {
  return (
    <View>
      <Text className="text-base font-bold text-black">Flood risk near you</Text>
      <Text className="mt-1 text-xs text-text-on-dark-muted">
        Tap a colored zone to see cluster details and reports
      </Text>
      <View className="mt-4 flex-row gap-4">
        {(["red", "amber", "green"] as const).map((band) => (
          <View key={band} className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: THREAT[band].color }} />
            <Text className="text-xs text-gray-600">{THREAT[band].label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ClusterPanel({
  cluster,
  subPointCount,
}: {
  cluster: (typeof mapClusters)[number];
  subPointCount: number;
}) {
  const band = bandFromSeverity(cluster.severity);
  const threat = THREAT[band];
  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-black">{cluster.name}</Text>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: threat.bg }}>
          <Text className="text-xs font-bold" style={{ color: threat.color }}>
            Severity {cluster.severity} · {threat.label}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="camera" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600">{cluster.scanCount} scans</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="layers" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600">{BLOCKAGE_LABEL[cluster.dominantBlockage]}</Text>
        </View>
      </View>
      <Text className="mt-3 text-sm text-gray-500">
        {subPointCount} sub-reports shown below - tap one to help clear it.
      </Text>
    </View>
  );
}

export function SubPointPanel({
  subPoint,
  locating,
  onHelp,
  onBack,
}: {
  subPoint: SubPoint;
  locating: boolean;
  onHelp: () => void;
  onBack: () => void;
}) {
  return (
    <View>
      <TouchableOpacity onPress={onBack} className="mb-2 flex-row items-center gap-1">
        <Ionicons name="chevron-back" size={14} color="#9CA3AF" />
        <Text className="text-xs text-gray-400">Back to cluster</Text>
      </TouchableOpacity>

      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "#FAF0D6" }}>
          <Ionicons name="water" size={16} color="#d9ac39" />
        </View>
        <View>
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-text-on-dark-muted">
            {BLOCKAGE_LABEL[subPoint.blockageType]} · Reported {subPoint.reportedAt}
          </Text>
          <Text className="text-base font-bold text-black">Report #{subPoint.id.split("-").pop()}</Text>
        </View>
      </View>

      <View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "#F2F8EC" }}>
        <Text className="text-sm font-bold text-black">🤝 Civic duty</Text>
        <Text className="mt-1 text-xs leading-relaxed text-gray-600">
          Help clear this chokepoint yourself. We'll map a path from your location to this exact spot.
        </Text>
      </View>

      <TouchableOpacity
        disabled={locating}
        onPress={onHelp}
        className="mt-4 flex-row items-center justify-center rounded-full py-4"
        activeOpacity={0.85}
        style={{ backgroundColor: "#3F7B1E" }}
      >
        {locating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-base font-bold text-white">Help clean this - get directions</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function RoutePanel({
  distanceKm: km,
  isDummy,
  onCancel,
}: {
  distanceKm: number;
  isDummy: boolean;
  onCancel: () => void;
}) {
  const walkMinutes = Math.max(1, Math.round((km / 5) * 60));
  return (
    <View>
      <Text className="text-base font-bold text-black">Path to clearing</Text>
      <Text className="mt-1 text-sm text-gray-500">
        {km.toFixed(1)} km away · ~{walkMinutes} min walk
      </Text>

      {isDummy && (
        <View className="mt-3 flex-row items-start gap-2 rounded-2xl bg-gray-100 px-3 py-2.5">
          <Ionicons name="information-circle" size={16} color="#9CA3AF" style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs text-gray-500">
            Using an approximate location - enable location services for a precise route.
          </Text>
        </View>
      )}

      <Text className="mt-3 text-xs text-gray-400">
        Straight-line distance shown - turn-by-turn road directions aren't wired up yet.
      </Text>

      <TouchableOpacity
        onPress={onCancel}
        className="mt-4 flex-row items-center justify-center rounded-full border py-4"
        activeOpacity={0.85}
        style={{ borderColor: "#E5E7EB" }}
      >
        <Text className="text-base font-bold text-gray-700">Cancel route</Text>
      </TouchableOpacity>
    </View>
  );
}
