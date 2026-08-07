import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClusterPanel, DefaultPanel, RoutePanel, SubPointPanel } from "../../../components/map-panels";
import { mapClusters } from "../../../data/mapClusters";
import { THREAT, bandFromSeverity } from "../../../data/threat";
import { useFloodMap } from "../../../hooks/useFloodMap";

const ACCRA_REGION = { latitude: 5.6, longitude: -0.19, latitudeDelta: 0.16, longitudeDelta: 0.16 };

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const m = useFloodMap();

  // Camera moves are native-map-specific (react-leaflet's web sibling drives its own map
  // instance the same way) - the shared hook only owns the business state, not the camera.
  useEffect(() => {
    if (m.selectedCluster) {
      mapRef.current?.animateToRegion(
        { latitude: m.selectedCluster.lat, longitude: m.selectedCluster.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        400,
      );
    } else {
      mapRef.current?.animateToRegion(ACCRA_REGION, 400);
    }
  }, [m.selectedCluster]);

  useEffect(() => {
    if (m.routeActive && m.userLocation && m.selectedSubPoint) {
      const target = { latitude: m.selectedSubPoint.lat, longitude: m.selectedSubPoint.lng };
      mapRef.current?.fitToCoordinates([m.userLocation, target], {
        edgePadding: { top: 100, right: 60, bottom: 320, left: 60 },
        animated: true,
      });
    }
  }, [m.routeActive, m.userLocation, m.selectedSubPoint]);

  return (
    <View className="flex-1 bg-white">
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={ACCRA_REGION}>
        {mapClusters
          .filter((c) => !m.selectedClusterId || c.id === m.selectedClusterId)
          .map((cluster) => {
            const band = bandFromSeverity(cluster.severity);
            const threat = THREAT[band];
            const isSelected = cluster.id === m.selectedClusterId;
            return (
              <View key={cluster.id}>
                <Circle
                  center={{ latitude: cluster.lat, longitude: cluster.lng }}
                  radius={cluster.radius}
                  fillColor={`${threat.color}59`}
                  strokeColor={threat.color}
                  strokeWidth={1.5}
                />
                <Marker
                  coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
                  onPress={() => m.selectCluster(cluster.id)}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View
                    style={{ height: 18, width: 18, borderRadius: 9, backgroundColor: threat.color, borderWidth: 2, borderColor: "#fff" }}
                  />
                </Marker>
                {isSelected && band === "red" && (
                  <Marker coordinate={{ latitude: cluster.lat, longitude: cluster.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                    <MotiView
                      from={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ type: "timing", duration: 1400, loop: true }}
                      style={{ height: 18, width: 18, borderRadius: 9, backgroundColor: threat.color }}
                    />
                  </Marker>
                )}
              </View>
            );
          })}

        {m.visibleSubPoints.map((sp) => {
          const isSelected = sp.id === m.selectedSubPoint?.id;
          return (
            <Marker
              key={sp.id}
              coordinate={{ latitude: sp.lat, longitude: sp.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => m.selectSubPoint(sp)}
            >
              <View
                style={{
                  height: isSelected ? 16 : 10,
                  width: isSelected ? 16 : 10,
                  borderRadius: 8,
                  backgroundColor: isSelected ? "#d9ac39" : "#fff",
                  borderWidth: isSelected ? 0 : 2,
                  borderColor: "#d9ac39",
                }}
              />
            </Marker>
          );
        })}

        {m.userLocation && (
          <Marker coordinate={m.userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={{ height: 16, width: 16, borderRadius: 8, backgroundColor: "#2563eb", borderWidth: 3, borderColor: "#fff" }} />
          </Marker>
        )}

        {m.routeActive && m.userLocation && m.selectedSubPoint && (
          <Polyline
            coordinates={[m.userLocation, { latitude: m.selectedSubPoint.lat, longitude: m.selectedSubPoint.lng }]}
            strokeColor="#d9ac39"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
          />
        )}
      </MapView>

      <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <View className="flex-row items-center justify-end px-6 pt-2">
          {m.selectedClusterId && (
            <TouchableOpacity onPress={m.exitIsolation} className="flex-row items-center gap-1.5 rounded-full bg-black/30 px-3 py-2">
              <Ionicons name="close" size={14} color="#fff" />
              <Text className="text-xs font-semibold text-white">Show all clusters</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <View className="absolute bottom-0 left-0 right-0">
        <View
          className="rounded-t-[28px] bg-white px-6 pb-32 pt-5"
          style={{ shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200" />

          {m.routeActive && m.selectedSubPoint && m.routeDistanceKm !== null ? (
            <RoutePanel distanceKm={m.routeDistanceKm} isDummy={m.usedDummyLocation} onCancel={m.cancelRoute} />
          ) : m.selectedSubPoint ? (
            <SubPointPanel
              subPoint={m.selectedSubPoint}
              locating={m.locating}
              onHelp={m.handleGetDirections}
              onBack={m.goBackToCluster}
            />
          ) : m.selectedCluster ? (
            <ClusterPanel cluster={m.selectedCluster} subPointCount={m.visibleSubPoints.length} />
          ) : (
            <DefaultPanel />
          )}
        </View>
      </View>
    </View>
  );
}
