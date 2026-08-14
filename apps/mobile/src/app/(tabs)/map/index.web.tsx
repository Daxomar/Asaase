import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import "leaflet/dist/leaflet.css"; // safe: CSS import has no window access
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClusterPanel, DefaultPanel, RoutePanel, SubPointPanel } from "../../../components/map-panels";
import { mapClusters } from "../../../data/mapClusters";
import { THREAT, bandFromSeverity } from "../../../data/threat";
import { useFloodMap } from "../../../hooks/useFloodMap";

const ACCRA_CENTER: [number, number] = [5.6, -0.19];

// Loaded dynamically on the client only — leaflet touches `window` at module
// evaluation time, so it can never be imported statically in a file that Expo
// Router's web build may evaluate during SSR/manifest generation.
type LeafletModule = typeof import("leaflet");
type ReactLeafletModule = typeof import("react-leaflet");

export default function MapScreen() {
  const m = useFloodMap();
  const [ready, setReady] = useState(false);
  const [mods, setMods] = useState<{ L: LeafletModule; RL: ReactLeafletModule } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [L, RL] = await Promise.all([
        import("leaflet"),
        import("react-leaflet"),
      ]);
      if (mounted) {
        setMods({ L: (L as any).default ?? L, RL });
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready || !mods) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Loading map…</Text>
      </View>
    );
  }

  return <MapCanvas L={mods.L} RL={mods.RL} m={m} />;
}

function MapCanvas({
  L,
  RL,
  m,
}: {
  L: LeafletModule;
  RL: ReactLeafletModule;
  m: ReturnType<typeof useFloodMap>;
}) {
  const { MapContainer, TileLayer, Circle, Marker, Polyline } = RL;
  const mapRef = useRef<import("leaflet").Map | null>(null);

  function dotIcon(color: string, size: number, selected: boolean) {
    return L.divIcon({
      className: "flood-map-dot",
      html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:${
        selected ? "0 0 0 3px rgba(217,172,57,0.5)" : "0 1px 4px rgba(0,0,0,.3)"
      };"></span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  useEffect(() => {
    if (m.selectedCluster) {
      mapRef.current?.flyTo([m.selectedCluster.lat, m.selectedCluster.lng], 15, { duration: 0.5 });
    } else {
      mapRef.current?.flyTo(ACCRA_CENTER, 12, { duration: 0.5 });
    }
  }, [m.selectedCluster]);

  useEffect(() => {
    if (m.routeActive && m.userLocation && m.selectedSubPoint && mapRef.current) {
      const bounds = L.latLngBounds(
        [m.userLocation.latitude, m.userLocation.longitude],
        [m.selectedSubPoint.lat, m.selectedSubPoint.lng],
      );
      mapRef.current.fitBounds(bounds, { paddingTopLeft: [60, 100], paddingBottomRight: [60, 320] });
    }
  }, [m.routeActive, m.userLocation, m.selectedSubPoint]);

  return (
    <View className="flex-1 bg-white">
      <MapContainer ref={mapRef} center={ACCRA_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mapClusters
          .filter((c) => !m.selectedClusterId || c.id === m.selectedClusterId)
          .map((cluster) => {
            const band = bandFromSeverity(cluster.severity);
            const threat = THREAT[band];
            return (
              <span key={cluster.id}>
                <Circle
                  center={[cluster.lat, cluster.lng]}
                  radius={cluster.radius}
                  pathOptions={{ color: threat.color, fillColor: threat.color, fillOpacity: 0.35, weight: 1.5 }}
                />
                <Marker
                  position={[cluster.lat, cluster.lng]}
                  icon={dotIcon(threat.color, 18, cluster.id === m.selectedClusterId)}
                  eventHandlers={{ click: () => m.selectCluster(cluster.id) }}
                />
              </span>
            );
          })}

        {m.visibleSubPoints.map((sp) => (
          <Marker
            key={sp.id}
            position={[sp.lat, sp.lng]}
            icon={dotIcon("#d9ac39", sp.id === m.selectedSubPoint?.id ? 16 : 10, sp.id === m.selectedSubPoint?.id)}
            eventHandlers={{ click: () => m.selectSubPoint(sp) }}
          />
        ))}

        {m.userLocation && (
          <Marker position={[m.userLocation.latitude, m.userLocation.longitude]} icon={dotIcon("#2563eb", 16, false)} />
        )}

        {m.routeActive && m.userLocation && m.selectedSubPoint && (
          <Polyline
            positions={[
              [m.userLocation.latitude, m.userLocation.longitude],
              [m.selectedSubPoint.lat, m.selectedSubPoint.lng],
            ]}
            pathOptions={{ color: "#d9ac39", weight: 3, dashArray: "8 6" }}
          />
        )}
      </MapContainer>

      <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          {m.selectedClusterId && (
            <TouchableOpacity onPress={m.exitIsolation} className="flex-row items-center gap-1.5 rounded-full bg-black/30 px-3 py-2">
              <Ionicons name="close" size={14} color="#fff" />
              <Text className="text-xs font-semibold text-white">Show all clusters</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <View className="absolute bottom-0 left-0 right-0" style={{ zIndex: 1000, paddingBottom: 80 }}>
        <View
          className="rounded-t-[28px] bg-white px-6 pb-8 pt-5"
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