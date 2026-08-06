import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
const CIRCLE_SIZE = 52;
const TAB_HEIGHT = 64;

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  name: string; // The route name
};

const TABS: TabConfig[] = [
  { label: "Home", icon: "home-outline", activeIcon: "home", name: "index" },
  { label: "Scan", icon: "camera-outline", activeIcon: "camera", name: "scan" },
  { label: "Quiz", icon: "school-outline", activeIcon: "school", name: "quiz" },
  { label: "Market", icon: "gift-outline", activeIcon: "gift", name: "marketplace" },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabWidth = SCREEN_WIDTH / TABS.length;

  const indicatorX = useSharedValue(
    state.index * tabWidth + (tabWidth - CIRCLE_SIZE) / 2
  );

  useEffect(() => {
    indicatorX.value = withSpring(
      state.index * tabWidth + (tabWidth - CIRCLE_SIZE) / 2,
      { damping: 18, stiffness: 160 }
    );
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {state.routes.map((route, index) => {
        // Fallback for route mapping in case of mismatches
        const tabIndex = TABS.findIndex(t => t.name === route.name);
        const tab = TABS[tabIndex !== -1 ? tabIndex : index];
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
            style={styles.tab}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFocused ? tab.activeIcon : tab.icon}
              size={24}
              color={isFocused ? "#ffffff" : "#a3a3a3"}
            />
            {!isFocused && <Text style={styles.label}>{tab.label}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  indicator: {
    position: "absolute",
    top: (TAB_HEIGHT - CIRCLE_SIZE) / 2,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#58cc02", // Duolingo green!
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_HEIGHT,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#a3a3a3",
    marginTop: 3,
  },
});
