import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Lesson {
  id: string;
  title: string;
  xpReward: number;
}

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isInProgress: boolean;
  onPress: () => void;
}

export function LessonCard({
  lesson,
  index,
  isCompleted,
  isInProgress,
  onPress,
}: LessonCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, isInProgress && styles.cardInProgress]}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xs font-bold text-gray-500 uppercase">Lesson {index + 1}</Text>
          {isInProgress && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>In progress</Text>
            </View>
          )}
        </View>

        <Text
          className="text-lg font-bold text-gray-800"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>

        <Text className="text-sm font-medium text-gray-500 mt-1">
          {lesson.xpReward} XP Reward
        </Text>
      </View>

      {isCompleted && (
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}

      {isInProgress && (
        <View style={styles.playCircle}>
          <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: "#e5e5e5",
    marginBottom: 16,
  },
  cardInProgress: {
    backgroundColor: "#eaffdb",
    borderColor: "#58cc02",
  },
  badge: {
    backgroundColor: "#58cc02",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffc800", // Gold star/check
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#58cc02",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  }
});
