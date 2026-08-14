import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { lessons } from "../../../data/lessons";
import { submitQuiz } from "../../../lib/api";
import { getOrCreateDeviceId } from "../../../lib/device";

const ACCENT = "#3F7B1E";
const ACCENT_SOFT = "#F2F8EC";
const AMBER = "#d9ac39";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type Phase = "cards" | "quiz-prompt" | "quiz" | "result";

function heroImageFor(lessonId: string) {
  return `https://picsum.photos/seed/asaase-lesson-${lessonId}/900/700`;
}

/* ─────────────────────────── Swipeable Card ─────────────────────────── */

function SwipeableCard({
  heading,
  body,
  index,
  totalCards,
  isTop,
  onSwiped,
}: {
  heading: string;
  body: string;
  index: number;
  totalCards: number;
  isTop: boolean;
  onSwiped: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  function toggleSpeak() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeaking(true);
    Speech.speak(`${heading}. ${body}`, {
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  const handleSwiped = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwiped();
  }, [onSwiped]);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4; // dampen vertical drag
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        // Swipe away!
        const direction = e.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 300 });
        translateY.value = withTiming(e.translationY * 0.6, { duration: 300 });
        runOnJS(handleSwiped)();
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Background card: offset slightly below + scaled down to create a peek effect
  const stackStyle = useAnimatedStyle(() => {
    if (isTop) return {};
    return {
      transform: [{ scale: 0.95 }, { translateY: 12 }],
    };
  });

  const swipeIndicatorLeftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], "clamp"),
  }));

  const swipeIndicatorRightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], "clamp"),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: "100%",
            zIndex: isTop ? 10 : 1,
          },
          isTop ? cardStyle : stackStyle,
        ]}
      >
        <View
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: isTop ? ACCENT_SOFT : "#E2EDDA",
            minHeight: 320,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          {isTop ? (
            <View className="p-6" style={{ minHeight: 320 }}>
              {/* Swipe indicators */}
              <Animated.View
                style={[
                  swipeIndicatorRightStyle,
                  {
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: ACCENT,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    zIndex: 20,
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>NEXT →</Text>
              </Animated.View>
              <Animated.View
                style={[
                  swipeIndicatorLeftStyle,
                  {
                    position: "absolute",
                    top: 16,
                    left: 16,
                    backgroundColor: "#6B7280",
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    zIndex: 20,
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>← BACK</Text>
              </Animated.View>

              {/* Card number badge */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center bg-white/80 rounded-full px-3 py-1.5">
                  <Ionicons name="layers" size={14} color={ACCENT} />
                  <Text className="ml-1.5 text-xs font-bold" style={{ color: ACCENT }}>
                    {index + 1} / {totalCards}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={toggleSpeak}
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: speaking ? ACCENT : "#fff" }}
                >
                  <Ionicons name={speaking ? "stop" : "volume-high"} size={18} color={speaking ? "#fff" : ACCENT} />
                </TouchableOpacity>
              </View>

              <Text className="text-xl font-bold text-gray-900 mb-3">{heading}</Text>
              <Text className="text-base leading-relaxed text-gray-700">{body}</Text>

              {speaking && (
                <View className="mt-4 flex-row items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <MotiView
                      key={i}
                      from={{ height: 4 }}
                      animate={{ height: 14 }}
                      transition={{ type: "timing", duration: 380, loop: true, repeatReverse: true, delay: i * 120 }}
                      style={{ width: 3, borderRadius: 2, backgroundColor: ACCENT }}
                    />
                  ))}
                  <Text className="ml-1 text-xs font-medium" style={{ color: ACCENT }}>
                    Reading aloud…
                  </Text>
                </View>
              )}

              {/* Swipe hint at bottom */}
              <View className="mt-auto pt-6 flex-row items-center justify-center">
                <Ionicons name="swap-horizontal" size={16} color="#9CA3AF" />
                <Text className="ml-2 text-xs font-medium text-gray-400">Swipe to continue</Text>
              </View>
            </View>
          ) : (
            /* Background card: just a solid empty block that peeks out below */
            <View style={{ minHeight: 320 }} />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

/* ─────────────────────────── Main Screen ─────────────────────────── */

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = lessons.find((l) => l.id === lessonId);

  const [cardIndex, setCardIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("cards");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ xp: number; tokens: number; correct: boolean } | null>(null);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  if (!lesson) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-base text-gray-500">Lesson not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="font-semibold" style={{ color: ACCENT }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalCards = lesson.cards.length;
  const progress = phase === "cards" ? cardIndex / totalCards : 1;

  function handleCardSwiped() {
    const nextIndex = cardIndex + 1;
    if (nextIndex >= totalCards) {
      setPhase("quiz-prompt");
    } else {
      setCardIndex(nextIndex);
    }
  }

  async function handleSubmitAnswer() {
    if (selectedOption === null || !lesson) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    const correct = selectedOption === lesson.quiz.correctIndex;
    try {
      const deviceId = await getOrCreateDeviceId();
      const { xp, tokens } = await submitQuiz(deviceId, `lesson-${lesson.id}`, correct);
      if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ xp, tokens, correct });
    } catch {
      setResult({ xp: 0, tokens: 0, correct });
    } finally {
      setSubmitting(false);
      setPhase("result");
    }
  }

  // Only render the top 2 cards for performance
  const visibleCards = lesson.cards.slice(cardIndex, cardIndex + 2).reverse();

  return (
    <View className="flex-1 bg-white">
      {/* Hero backdrop */}
      <Image
        source={{ uri: heroImageFor(lesson.id) }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
        resizeMode="cover"
      />

      {/* Top bar */}
      <SafeAreaView edges={["top"]}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <TouchableOpacity
            onPress={() => {
              Speech.stop();
              router.back();
            }}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Progress dots */}
          <View className="flex-row gap-1.5 rounded-full bg-black/30 px-3 py-2">
            {lesson.cards.map((_, i) => (
              <View
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === cardIndex ? 20 : 8,
                  backgroundColor: i <= cardIndex ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
            {/* Quiz dot */}
            <View
              className="h-1.5 rounded-full"
              style={{
                width: phase !== "cards" ? 20 : 8,
                backgroundColor: phase !== "cards" ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            />
          </View>

          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Content sheet */}
      <View className="flex-1" style={{ marginTop: 190 }}>
        <View
          className="flex-1 rounded-t-[32px] bg-white"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          {/* ── Card phase: swipeable deck ── */}
          {phase === "cards" && (
            <View className="flex-1 px-6 pt-6">
              <Text className="text-xs font-bold uppercase tracking-wide text-gray-400">
                {lesson.meta}
              </Text>
              <Text className="mt-2 mb-6 text-2xl font-bold text-gray-900">{lesson.title}</Text>

              {/* Card deck container */}
              <View style={{ flex: 1, position: "relative", marginBottom: 24 }}>
                {visibleCards.map((card) => {
                  const actualIndex = lesson.cards.indexOf(card);
                  return (
                    <SwipeableCard
                      key={`card-${actualIndex}`}
                      heading={card.heading}
                      body={card.body}
                      index={actualIndex}
                      totalCards={totalCards}
                      isTop={actualIndex === cardIndex}
                      onSwiped={handleCardSwiped}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Quiz prompt phase ── */}
          {phase === "quiz-prompt" && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 400 }}
              className="flex-1 items-center justify-center px-8"
            >
              <View className="h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT_SOFT }}>
                <Ionicons name="school" size={36} color={ACCENT} />
              </View>

              <Text className="mt-6 text-2xl font-bold text-gray-900 text-center">Lesson Complete!</Text>
              <Text className="mt-3 text-center text-base text-gray-500 leading-relaxed">
                Great job reading through all the cards. Ready to test what you've learned?
              </Text>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setPhase("quiz");
                }}
                activeOpacity={0.8}
                className="mt-8 w-full flex-row items-center justify-center rounded-full border-2 py-4"
                style={{ borderColor: ACCENT }}
              >
                <Ionicons name="help-circle" size={20} color={ACCENT} style={{ marginRight: 8 }} />
                <Text className="text-base font-bold" style={{ color: ACCENT }}>Take the Quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/learn")}
                activeOpacity={0.7}
                className="mt-4"
              >
                <Text className="text-sm font-medium text-gray-400">Skip for now</Text>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* ── Quiz phase ── */}
          {phase === "quiz" && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 350 }}
              className="flex-1 px-6 pt-6"
            >
              <View className="flex-row items-center mb-2">
                <View className="bg-[#FFF3CD] rounded-full px-3 py-1.5 flex-row items-center">
                  <Ionicons name="help-circle" size={16} color={AMBER} />
                  <Text className="ml-1.5 text-xs font-bold" style={{ color: AMBER }}>QUIZ TIME</Text>
                </View>
              </View>

              <Text className="mt-3 text-xl font-bold text-gray-900">{lesson.quiz.question}</Text>

              <View className="mt-6 gap-3">
                {lesson.quiz.options.map((option, i) => {
                  const isSelected = selectedOption === i;
                  return (
                    <MotiView
                      key={i}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: "timing", duration: 400, delay: i * 80 }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedOption(i);
                        }}
                        className="flex-row items-center rounded-2xl border-2 p-4"
                        style={{
                          borderColor: isSelected ? ACCENT : "#E5E7EB",
                          backgroundColor: isSelected ? ACCENT_SOFT : "#fff",
                        }}
                      >
                        <View
                          className="mr-3 h-6 w-6 items-center justify-center rounded-full border-2"
                          style={{ borderColor: isSelected ? ACCENT : "#D1D5DB", backgroundColor: isSelected ? ACCENT : "transparent" }}
                        >
                          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text className="flex-1 text-sm font-semibold" style={{ color: isSelected ? ACCENT : "#374151" }}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    </MotiView>
                  );
                })}
              </View>

              <View className="mt-auto pb-6">
                <TouchableOpacity
                  disabled={selectedOption === null || submitting}
                  className="flex-row items-center justify-center rounded-full py-4"
                  activeOpacity={0.85}
                  style={{ backgroundColor: selectedOption === null ? "#E5E7EB" : ACCENT }}
                  onPress={handleSubmitAnswer}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={selectedOption === null ? "#9CA3AF" : "#fff"}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        className="text-base font-bold "
                        style={{ color: selectedOption === null ? "#9CA3AF" : "#fff" }}
                      >
                        Submit Answer
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </View>
      </View>

      {/* ── Completion popup ── */}
      <Modal visible={phase === "result"} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 180 }}
          >
            <View className="w-full items-center rounded-3xl bg-white px-6 py-8" style={{ minWidth: 300 }}>
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: result?.correct ? ACCENT_SOFT : "#F3F4F6" }}
              >
                <Ionicons
                  name={result?.correct ? "checkmark-circle" : "book"}
                  size={42}
                  color={result?.correct ? ACCENT : "#9CA3AF"}
                />
              </View>

              <Text className="mt-4 text-2xl font-bold text-gray-900">
                {result?.correct ? "Nailed it! 🎉" : "Lesson Complete"}
              </Text>
              <Text className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
                {result?.correct
                  ? "You got it right and crushed this lesson!"
                  : "Not quite on the quiz, but finishing the lesson is what counts."}
              </Text>

              {result?.correct && (result.xp > 0 || result.tokens > 0) && (
                <View
                  className="mt-5 flex-row items-center gap-3 rounded-2xl px-5 py-3"
                  style={{ backgroundColor: "#FAF0D6" }}
                >
                  <Ionicons name="flash" size={18} color={AMBER} />
                  <Text className="text-sm font-bold" style={{ color: AMBER }}>
                    +{result.xp} XP · +{result.tokens} Eco-Token{result.tokens === 1 ? "" : "s"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="mt-6 w-full flex-row items-center justify-center rounded-full py-4"
                activeOpacity={0.85}
                style={{ backgroundColor: ACCENT }}
                onPress={() => router.replace("/learn")}
              >
                <Text className="text-base font-bold text-white">Back to Learning Path</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}
