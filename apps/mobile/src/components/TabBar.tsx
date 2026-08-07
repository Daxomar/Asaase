import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_HEIGHT = 64;

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  name: string; // The route name
};

const TABS: TabConfig[] = [
  { label: "Home", icon: "home-outline", activeIcon: "home", name: "index" },
  { label: "Map", icon: "map-outline", activeIcon: "map", name: "map" },
  { label: "Scan", icon: "camera-outline", activeIcon: "camera", name: "scan" },
  { label: "Learn", icon: "book-outline", activeIcon: "book", name: "learn" },
  { label: "Store", icon: "storefront-outline", activeIcon: "storefront", name: "marketplace" },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.wrapper, { bottom: insets.bottom || 24 }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          // Find config
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tab,
                isFocused && styles.tabActive
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={22}
                color={isFocused ? "#000" : "#a3a3a3"}
              />
              {isFocused && <Text style={styles.label}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#0F0F0F",
    borderRadius: 32,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    width: "100%",
    justifyContent: "space-between",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  tabActive: {
    backgroundColor: "#ffffff",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    marginLeft: 6,
  },
});
