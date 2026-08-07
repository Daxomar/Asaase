import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { lessons } from "../../../data/lessons";
import { submitQuiz } from "../../../lib/api";
import { getOrCreateDeviceId } from "../../../lib/device";

const ACCENT = "#3F7B1E";
const ACCENT_SOFT = "#F2F8EC";
const AMBER = "#d9ac39";

type Phase = "cards" | "quiz" | "result";

// TODO: swap for the real Unsplash API (`/photos/random?query=...`) once a key is available —
// this is a deterministic Picsum placeholder (real photos, zero setup) not theme-matched content.
function heroImageFor(lessonId: string) {
  return `https://picsum.photos/seed/asaase-lesson-${lessonId}/900/700`;
}

export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = lessons.find((l) => l.id === lessonId);

  const [cardIndex, setCardIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("cards");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ xp: number; tokens: number; correct: boolean } | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Stop any in-flight narration the moment the card changes or the screen unmounts — otherwise
  // it keeps reading the previous card's text over whatever you navigate to next.
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);
  useEffect(() => {
    Speech.stop();
    setSpeaking(false);
  }, [cardIndex]);

  if (!lesson) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-base text-gray-500">Lesson not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="font-semibold" style={{ color: ACCENT }}>
            Go back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isLastCard = cardIndex === lesson.cards.length - 1;
  const card = lesson.cards[cardIndex];

  function toggleSpeak() {
    if (!card) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeaking(true);
    Speech.speak(`${card.heading}. ${card.body}`, {
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
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
      // Reward is a bonus, not the point of finishing the lesson — don't block completion
      // over a network hiccup, just show it without an earned amount.
      setResult({ xp: 0, tokens: 0, correct });
    } finally {
      setSubmitting(false);
      setPhase("result");
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Hero — fixed backdrop for the whole lesson, persists across cards + quiz phases */}
      <Image
        source={{ uri: heroImageFor(lesson.id) }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
        resizeMode="cover"
      />
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
          {phase === "cards" && (
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
            </View>
          )}
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Content sheet — overlaps the hero's bottom edge. Content scrolls, footer button is
          pinned separately, so the sheet's height always matches what's actually on screen
          instead of stretching to fill leftover space with nothing in it. */}
      <View className="flex-1" style={{ marginTop: 190 }}>
        <View
          className="flex-1 rounded-t-[32px] bg-white"
          style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } }}
        >
          {phase === "cards" && card && (
            <>
              <ScrollView
                className="flex-1 px-6 pt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <Text className="text-xs font-bold uppercase tracking-wide text-text-on-dark-muted">
                  {lesson.meta} · Card {cardIndex + 1} of {lesson.cards.length}
                </Text>
                <Text className="mt-2 text-2xl font-bold text-black">{lesson.title}</Text>

                <MotiView
                  key={cardIndex}
                  from={{ opacity: 0, translateX: 24 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: "timing", duration: 280 }}
                  className="mt-6 rounded-3xl p-6"
                  style={{ backgroundColor: ACCENT_SOFT, minHeight: 260 }}
                >
                  <View className="flex-row items-start justify-between">
                    <Text className="flex-1 pr-3 text-xl font-bold text-black">{card.heading}</Text>
                    <TouchableOpacity
                      onPress={toggleSpeak}
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: speaking ? ACCENT : "#fff" }}
                    >
                      <Ionicons name={speaking ? "stop" : "mic"} size={18} color={speaking ? "#fff" : ACCENT} />
                    </TouchableOpacity>
                  </View>
                  <Text className="mt-4 text-base leading-relaxed text-gray-700">{card.body}</Text>
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
                </MotiView>
              </ScrollView>

              <View className="px-6">
                <TouchableOpacity
                  className="mb-6 flex-row items-center justify-center rounded-full py-4"
                  activeOpacity={0.85}
                  style={{ backgroundColor: ACCENT }}
                  onPress={() => {
                    Speech.stop();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isLastCard) {
                      setPhase("quiz");
                    } else {
                      setCardIndex((i) => i + 1);
                    }
                  }}
                >
                  <Text className="text-base font-bold text-white">
                    {isLastCard ? "Take the quiz" : "Next"}
                  </Text>
                  <Ionicons name="chevron-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {phase === "quiz" && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 280 }}
              className="flex-1 px-6 pt-6"
            >
              <Text className="text-xs font-bold uppercase tracking-wide text-text-on-dark-muted">
                Quick check
              </Text>
              <Text className="mt-3 text-xl font-bold text-black">{lesson.quiz.question}</Text>

              <View className="mt-6 gap-3">
                {lesson.quiz.options.map((option, i) => {
                  const isSelected = selectedOption === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.8}
                      onPress={() => setSelectedOption(i)}
                      className="flex-row items-center rounded-2xl border p-4"
                      style={{
                        borderColor: isSelected ? ACCENT : "#E5E7EB",
                        backgroundColor: isSelected ? ACCENT_SOFT : "#fff",
                      }}
                    >
                      <View
                        className="mr-3 h-5 w-5 items-center justify-center rounded-full border-2"
                        style={{ borderColor: isSelected ? ACCENT : "#D1D5DB" }}
                      >
                        {isSelected && <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />}
                      </View>
                      <Text className="flex-1 text-sm font-medium text-black">{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                disabled={selectedOption === null || submitting}
                className="mb-8 mt-auto flex-row items-center justify-center rounded-full py-4"
                activeOpacity={0.85}
                style={{ backgroundColor: selectedOption === null ? "#E5E7EB" : ACCENT }}
                onPress={handleSubmitAnswer}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    className="text-base font-bold"
                    style={{ color: selectedOption === null ? "#9CA3AF" : "#fff" }}
                  >
                    Submit answer
                  </Text>
                )}
              </TouchableOpacity>
            </MotiView>
          )}
        </View>
      </View>

      {/* Completion popup */}
      <Modal visible={phase === "result"} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <View className="w-full items-center rounded-3xl bg-white px-6 py-8">
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: result?.correct ? ACCENT_SOFT : "#F3F4F6" }}
            >
              <Ionicons
                name={result?.correct ? "checkmark-circle" : "book"}
                size={34}
                color={result?.correct ? ACCENT : "#9CA3AF"}
              />
            </View>

            <Text className="mt-4 text-xl font-bold text-black">
              {result?.correct ? "Good work!" : "Lesson complete"}
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-500">
              {result?.correct
                ? "You got it right and finished the lesson."
                : "Not quite on the quiz, but you finished the lesson — that's what counts."}
            </Text>

            {result?.correct && (result.xp > 0 || result.tokens > 0) && (
              <View
                className="mt-4 flex-row items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: "#FAF0D6" }}
              >
                <Ionicons name="flash" size={16} color={AMBER} />
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
              <Text className="text-base font-bold text-white">Back to path</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
