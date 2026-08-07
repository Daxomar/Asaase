import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { lessons, type Lesson } from "../../../data/lessons";

// Deterministic scatter so the background texture doesn't shuffle on every re-render —
// a soft, low-opacity pattern behind the path (not random noise, same seed every time).
function scatterDots(width: number, height: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const seed = i * 97 + 13;
    return {
      key: i,
      left: (((seed * 53) % 100) / 100) * width,
      top: (((seed * 31) % 100) / 100) * height,
      size: 4 + (seed % 5),
    };
  });
}

const ACCENT = "#3F7B1E";
const AMBER = "#d9ac39";
const LOCKED_BG = "#E5E7EB";
const LOCKED_ICON = "#9CA3AF";

const DONE_COUNT = 2; // first N lessons already completed
const NEXT_ID = lessons[DONE_COUNT]?.id; // the single "up next" node

const NODE_SIZE = 64;
const ROW_HEIGHT = 130;
const X_PATTERN = [0.5, 0.78, 0.5, 0.22]; // fraction across the track width — the zigzag

function angleDeg(dx: number, dy: number) {
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export default function LearnScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const trackWidth = screenWidth - 48 - NODE_SIZE; // minus screen padding + node radius clearance
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState<Lesson | null>(null);

  // Path renders advanced-lesson-first (top) -> start-lesson-last (bottom), matching a skill
  // tree you climb upward. Land the initial scroll at the bottom so "up next" is on-screen
  // immediately instead of buried above 29 locked nodes.
  const displayOrder = [...lessons].reverse();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  const xFor = (i: number) => (X_PATTERN[i % X_PATTERN.length] ?? 0.5) * trackWidth + NODE_SIZE / 2;
  const yFor = (i: number) => i * ROW_HEIGHT + NODE_SIZE / 2;

  const doneIds = new Set(lessons.slice(0, DONE_COUNT).map((l) => l.id));
  const pathHeight = lessons.length * ROW_HEIGHT + NODE_SIZE;
  const nextDisplayIndex = displayOrder.findIndex((l) => l.id === NEXT_ID);
  const dots = useMemo(
    () => scatterDots(screenWidth, pathHeight, Math.round(pathHeight / 90)),
    [screenWidth, pathHeight],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <View className="ml-3">
          <Text className="text-lg font-bold text-black">Learning path</Text>
          <Text className="text-xs text-text-on-dark-muted">
            {DONE_COUNT}/{lessons.length} complete
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 24 }}
      >
        <View style={{ height: pathHeight, width: "100%" }}>
          {/* Soft background texture — decorative, sits behind everything else on the path */}
          {dots.map((d) => (
            <View
              key={d.key}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: d.left,
                top: d.top,
                width: d.size,
                height: d.size,
                borderRadius: d.size / 2,
                backgroundColor: ACCENT,
                opacity: 0.06,
              }}
            />
          ))}

          {/* "You are here" marker — floats above the up-next node */}
          {nextDisplayIndex >= 0 && (
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: -6 }}
              transition={{ type: "timing", duration: 700, loop: true, repeatReverse: true }}
              style={{
                position: "absolute",
                left: 24 + xFor(nextDisplayIndex) - 60,
                top: yFor(nextDisplayIndex) - NODE_SIZE / 2 - 54,
                width: 120,
                alignItems: "center",
              }}
            >
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: AMBER }}>
                <Text className="text-[10px] font-bold text-white">You are here</Text>
              </View>
              <Ionicons name="caret-down" size={16} color={AMBER} style={{ marginTop: -2 }} />
            </MotiView>
          )}

          {/* Connectors — drawn first so nodes render on top */}
          {displayOrder.map((_, i) => {
            if (i === displayOrder.length - 1) return null;
            const x1 = xFor(i);
            const y1 = yFor(i);
            const x2 = xFor(i + 1);
            const y2 = yFor(i + 1);
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.hypot(dx, dy);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            // Segment leads toward a later (more locked) lesson than the one below it —
            // color it by whether the node it's climbing FROM is already unlocked.
            const fromLesson = displayOrder[i + 1]; // lower node = earlier in the real path
            if (!fromLesson) return null;
            const segmentLit = doneIds.has(fromLesson.id) || fromLesson.id === NEXT_ID;

            return (
              <View
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: 24 + midX - length / 2,
                  top: midY - 1.5,
                  width: length,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: segmentLit ? ACCENT : LOCKED_BG,
                  transform: [{ rotate: `${angleDeg(dx, dy)}deg` }],
                }}
              />
            );
          })}

          {/* Nodes */}
          {displayOrder.map((lesson, i) => {
            const done = doneIds.has(lesson.id);
            const isNext = lesson.id === NEXT_ID;
            const locked = !done && !isNext;
            const distanceFromNext = Math.abs(
              lessons.findIndex((l) => l.id === lesson.id) - DONE_COUNT,
            );
            const fadeOpacity = locked ? Math.max(0.35, 1 - distanceFromNext * 0.08) : 1;

            return (
              <TouchableOpacity
                key={lesson.id}
                activeOpacity={0.8}
                onPress={() => setSelected(lesson)}
                style={{
                  position: "absolute",
                  left: 24 + xFor(i) - NODE_SIZE / 2,
                  top: yFor(i) - NODE_SIZE / 2,
                  width: NODE_SIZE,
                  alignItems: "center",
                  opacity: fadeOpacity,
                }}
              >
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    height: NODE_SIZE,
                    width: NODE_SIZE,
                    backgroundColor: done ? ACCENT : locked ? LOCKED_BG : "#fff",
                    borderWidth: isNext ? 3 : 0,
                    borderColor: AMBER,
                  }}
                >
                  <Ionicons
                    name={done ? "checkmark" : locked ? "lock-closed" : lesson.icon}
                    size={done || locked ? 22 : 24}
                    color={done ? "#fff" : locked ? LOCKED_ICON : AMBER}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  className="mt-2 text-center text-[11px] font-semibold text-black"
                  style={{ width: 92 }}
                >
                  {lesson.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Lesson preview — quick brief before committing to the full lesson screen */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="rounded-t-3xl bg-white px-6 pb-8 pt-3">
              <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200" />
              {selected && (
                <>
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#F2F8EC" }}
                    >
                      <Ionicons name={selected.icon} size={20} color={ACCENT} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wide text-text-on-dark-muted">
                        {selected.meta}
                      </Text>
                      <Text className="text-base font-bold text-black">{selected.title}</Text>
                    </View>
                  </View>

                  <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                    {selected.brief}
                  </Text>

                  {(() => {
                    const isLocked =
                      !doneIds.has(selected.id) && selected.id !== NEXT_ID;
                    return isLocked ? (
                      <View className="mt-6 flex-row items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                        <Ionicons name="lock-closed" size={16} color={LOCKED_ICON} />
                        <Text className="text-xs text-gray-500">
                          Complete the lessons before this one to unlock it
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="mt-6 flex-row items-center justify-center rounded-full py-4"
                        activeOpacity={0.85}
                        style={{ backgroundColor: ACCENT }}
                        onPress={() => {
                          const id = selected.id;
                          setSelected(null);
                          router.push(`/learn/${id}`);
                        }}
                      >
                        <Text className="text-base font-bold text-white">
                          {doneIds.has(selected.id) ? "Review lesson" : "Start lesson"}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    );
                  })()}
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
