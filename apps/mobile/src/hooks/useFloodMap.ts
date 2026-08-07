import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useMemo, useState } from "react";

import { mapClusters, subPointsForCluster, type SubPoint } from "../data/mapClusters";

// Dummy fallback so "get directions" always has somewhere to route from - used on web,
// simulators, or if location permission is denied. Central Accra, clearly not a real GPS fix.
const DUMMY_LOCATION = { latitude: 5.5731, longitude: -0.2469 };

export type LatLng = { latitude: number; longitude: number };

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function resolveUserLocation(): Promise<{ coords: LatLng; isDummy: boolean }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") throw new Error("permission denied");
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, isDummy: false };
  } catch {
    return { coords: DUMMY_LOCATION, isDummy: true };
  }
}

// Shared state/business-logic for the flood risk map - deliberately has zero map-library
// dependency, so the native (react-native-maps) and web (react-leaflet) screens both drive
// their own camera/marker rendering off this same hook instead of duplicating the logic.
export function useFloodMap() {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedSubPoint, setSelectedSubPoint] = useState<SubPoint | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [usedDummyLocation, setUsedDummyLocation] = useState(false);
  const [routeActive, setRouteActive] = useState(false);
  const [locating, setLocating] = useState(false);

  const selectedCluster = mapClusters.find((c) => c.id === selectedClusterId) ?? null;
  const visibleSubPoints = useMemo(
    () => (selectedClusterId ? subPointsForCluster(selectedClusterId) : []),
    [selectedClusterId],
  );

  function selectCluster(clusterId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClusterId(clusterId);
    setSelectedSubPoint(null);
    setRouteActive(false);
  }

  function selectSubPoint(subPoint: SubPoint) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSubPoint(subPoint);
    setRouteActive(false);
  }

  function exitIsolation() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClusterId(null);
    setSelectedSubPoint(null);
    setRouteActive(false);
  }

  function cancelRoute() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRouteActive(false);
  }

  async function handleGetDirections() {
    if (!selectedSubPoint) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocating(true);
    const { coords, isDummy } = await resolveUserLocation();
    setUserLocation(coords);
    setUsedDummyLocation(isDummy);
    setLocating(false);
    setRouteActive(true);
  }

  const routeDistanceKm =
    routeActive && userLocation && selectedSubPoint
      ? distanceKm(userLocation, { latitude: selectedSubPoint.lat, longitude: selectedSubPoint.lng })
      : null;

  return {
    selectedClusterId,
    selectedCluster,
    selectedSubPoint,
    visibleSubPoints,
    userLocation,
    usedDummyLocation,
    routeActive,
    routeDistanceKm,
    locating,
    selectCluster,
    selectSubPoint,
    exitIsolation,
    cancelRoute,
    handleGetDirections,
    goBackToCluster: () => setSelectedSubPoint(null),
  };
}
