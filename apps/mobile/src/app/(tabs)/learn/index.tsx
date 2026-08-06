import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#3F7B1E";
const AMBER = "#d9ac39";
const LOCKED_BG = "#E5E7EB";
const LOCKED_ICON = "#9CA3AF";

type Lesson = {
  id: string;
  title: string;
  brief: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// TODO: replace with real lesson data + progress from backend
const lessons: Lesson[] = [
  { id: "1", title: "What is urban flooding?", brief: "Why Accra floods fast: flat terrain, heavy rain, and drains that can't keep up.", meta: "Audio · 3 min", icon: "rainy" },
  { id: "2", title: "Why storm drains matter", brief: "A single blocked drain can back up an entire street in minutes.", meta: "Article · 2 min", icon: "water" },
  { id: "3", title: "Common drain blockages", brief: "Sachet water, PET bottles, silt, and weeds — the four things Asaase's AI looks for.", meta: "Article · 3 min", icon: "trash-bin" },
  { id: "4", title: "Reading a flood risk map", brief: "How to tell a critical chokepoint from a low-risk one at a glance.", meta: "Article · 3 min", icon: "map" },
  { id: "5", title: "Rainfall & flood thresholds", brief: "Every cluster has a rainfall number that tips it into danger — here's what that means.", meta: "Article · 4 min", icon: "cloud" },
  { id: "6", title: "Your neighborhood's flood history", brief: "Look up past flood events near where you live.", meta: "Interactive · 5 min", icon: "time" },
  { id: "7", title: "Building a flood emergency kit", brief: "What to pack before the rainy season peaks.", meta: "Article · 4 min", icon: "medkit" },
  { id: "8", title: "Flood warning signs & alerts", brief: "How to read a NADMO alert and what each severity level means for you.", meta: "Article · 3 min", icon: "warning" },
  { id: "9", title: "What to do during a flood warning", brief: "A calm, practical checklist for the first ten minutes.", meta: "Article · 3 min", icon: "alert-circle" },
  { id: "10", title: "Evacuation routes in Accra", brief: "Know your route before you need it.", meta: "Interactive · 5 min", icon: "navigate" },
  { id: "11", title: "Protecting your home from water damage", brief: "Cheap, effective steps that make a real difference.", meta: "Article · 4 min", icon: "home" },
  { id: "12", title: "After the flood: staying safe", brief: "The danger doesn't end when the water goes down.", meta: "Article · 3 min", icon: "shield-checkmark" },
  { id: "13", title: "How the scan-to-earn system works", brief: "From a photo on your phone to a real entry on the risk map.", meta: "Audio · 3 min", icon: "camera" },
  { id: "14", title: "Taking a clear drain photo", brief: "The angle and lighting that actually help the AI classify it correctly.", meta: "Article · 2 min", icon: "image" },
  { id: "15", title: "Understanding blockage types", brief: "Why the AI cares whether it's silt, plastic, or overgrowth.", meta: "Article · 3 min", icon: "layers" },
  { id: "16", title: "Why GPS accuracy matters", brief: "A few meters of drift can put your scan in the wrong cluster.", meta: "Article · 2 min", icon: "locate" },
  { id: "17", title: "How AI classifies your scan", brief: "A quick look at what happens between your photo and a confidence score.", meta: "Article · 4 min", icon: "hardware-chip" },
  { id: "18", title: "From scan to verified cluster", brief: "How PostGIS merges dozens of nearby reports into one dedup'd cluster.", meta: "Article · 4 min", icon: "git-network" },
  { id: "19", title: "Organizing a neighborhood clean-up", brief: "Turn a cluster of reports into an actual clearing crew.", meta: "Article · 5 min", icon: "people" },
  { id: "20", title: "Talking to your local assembly", brief: "How to bring verified data into a real conversation with officials.", meta: "Article · 5 min", icon: "chatbubbles" },
  { id: "21", title: "Reporting risks in your community", brief: "Encouraging your street to scan, not just you.", meta: "Article · 3 min", icon: "megaphone" },
  { id: "22", title: "Working with NADMO responders", brief: "What emergency crews actually do with a cluster's AI brief.", meta: "Article · 4 min", icon: "construct" },
  { id: "23", title: "Mentoring new scanners", brief: "Helping someone else complete their first scan.", meta: "Article · 3 min", icon: "school" },
  { id: "24", title: "Building a scan streak that lasts", brief: "The habit science behind why streaks work — and how to protect one.", meta: "Audio · 4 min", icon: "flame" },
  { id: "25", title: "Understanding PostGIS clustering", brief: "The 20-metre rule that decides whether two reports are the same chokepoint.", meta: "Article · 5 min", icon: "git-compare" },
  { id: "26", title: "How severity scores are calculated", brief: "Why severity climbs with every new report at the same spot.", meta: "Article · 4 min", icon: "stats-chart" },
  { id: "27", title: "Reading the NADMO command map", brief: "The web dashboard municipal responders actually use.", meta: "Interactive · 5 min", icon: "eye" },
  { id: "28", title: "Rainfall data & early warning systems", brief: "Where real forecast data enters the picture.", meta: "Article · 4 min", icon: "thunderstorm" },
  { id: "29", title: "Advocating for drainage infrastructure", brief: "Turning a season of data into a funding case.", meta: "Article · 5 min", icon: "trending-up" },
  { id: "30", title: "Becoming an Asaase community leader", brief: "The full picture — from one scan to a citywide defense network.", meta: "Audio · 5 min", icon: "ribbon" },
];

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
        <View style={{ height: lessons.length * ROW_HEIGHT + NODE_SIZE, width: "100%" }}>
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
