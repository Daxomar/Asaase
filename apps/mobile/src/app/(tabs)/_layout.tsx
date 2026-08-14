import { Tabs } from "expo-router";
import { TabBar } from "../../components/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: "Map" }}
      />
      <Tabs.Screen
        name="scan"
        options={{ title: "Scan" }}
      />
      <Tabs.Screen
        name="learn"
        options={{ title: "Learn" }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: "Ranks" }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{ title: "Rewards", href: null }}
      />

      {/* Reachable via drill-down, not top-level tabs */}
      <Tabs.Screen name="quiz" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}