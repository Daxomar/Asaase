import React, { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const XP_PER_LEVEL = 100;

function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const inLevel = xp % XP_PER_LEVEL;
  return { level, inLevel, progress: inLevel / XP_PER_LEVEL };
}

type XpBarProps = {
  xp: number;
};

export default function XpBar({ xp }: XpBarProps) {
  const { level, inLevel, progress } = levelInfo(xp);
  const width = useSharedValue(0);
  const prevLevel = useRef(level);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // Entrance animation on first mount
      width.value = withTiming(progress, { duration: 700 });
      isFirstRender.current = false;
      prevLevel.current = level;
      return;
    }

    if (level > prevLevel.current) {
      // Leveled up: fill to 100%, snap back to 0, fill to new progress
      width.value = withTiming(1, { duration: 350 }, (finished) => {
        "worklet";
        if (finished) {
          width.value = 0;
          width.value = withTiming(progress, { duration: 500 });
        }
      });
    } else {
      width.value = withTiming(progress, { duration: 700 });
    }

    prevLevel.current = level;
  }, [progress, level, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View className="w-full gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-sm font-bold text-gray-800">Level {level}</Text>
        <Text className="text-xs font-bold text-gray-500">
          {inLevel} / {XP_PER_LEVEL} XP
        </Text>
      </View>
      <View className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <Animated.View
          style={fillStyle}
          className="h-full rounded-full bg-[#ffc800]"
        />
      </View>
    </View>
  );
}