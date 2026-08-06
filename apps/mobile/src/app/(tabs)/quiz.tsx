import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { submitQuiz } from "../../lib/api";
import { getOrCreateDeviceId } from "../../lib/device";

// PRD FEAT-002 / A-07 — fresh Ghana flood + eco-awareness content. Loosely mapped onto the same
// 4 blockage types scan.tsx renders (sachet water rubbers, PET bottles, silt/sand, weeds) so the
// quiz reinforces what the scanner is actually looking for; doesn't need to match any prior
// wording word-for-word (T12 was rebuilt from scratch per T12-remediation).
type Question = { id: string; prompt: string; options: string[]; correctIndex: number };

const QUESTIONS: Question[] = [
  {
    id: "gutter-clog",
    prompt: "Which of these is a top cause of clogged gutters in Accra after heavy rain?",
    options: ["Sachet water rubbers", "Fresh rainwater", "Sunlight", "Nothing — drains stay clear on their own"],
    correctIndex: 0,
  },
  {
    id: "bottle-disposal",
    prompt: "You just finished a drink near a drain. What's the eco-safe move with the empty PET bottle?",
    options: ["Toss it in the gutter", "Carry it to a bin or recycling point", "Bury it in the soil", "Leave it on the roadside"],
    correctIndex: 1,
  },
  {
    id: "flood-distance",
    prompt: "A flood warning is out for your area. How far should you stay from a fast-flowing drain or channel?",
    options: [
      "Right at the edge is fine",
      "A few metres back, on higher ground",
      "Only move once it's already flooding",
      "Distance doesn't matter",
    ],
    correctIndex: 1,
  },
  {
    id: "silt-cause",
    prompt: "What mainly causes drains to fill up with silt and sand in the rainy season?",
    options: ["Eroded soil washing in with runoff", "Too much sunlight", "Extra oxygen in the water", "Cold weather"],
    correctIndex: 0,
  },
  {
    id: "weeds-effect",
    prompt: "Overgrown weeds growing inside a drain channel mainly cause what problem?",
    options: ["They slow the water flow and trap debris", "They purify the water", "They have no real effect", "They cool the water down"],
    correctIndex: 0,
  },
];

type Screen =
  | { status: "question"; index: number; selectedIndex: number | null; feedback: "correct" | "incorrect" | null; submitting: boolean }
  | { status: "done"; correctCount: number; xp: number; tokens: number }
  | { status: "error"; message: string };

export default function QuizScreen() {
  const [screen, setScreen] = useState<Screen>({
    status: "question",
    index: 0,
    selectedIndex: null,
    feedback: null,
    submitting: false,
  });
  const [correctCount, setCorrectCount] = useState(0);

  async function handleSelect(optionIndex: number) {
    if (screen.status !== "question" || screen.selectedIndex !== null || screen.submitting) return;
    const question = QUESTIONS[screen.index]!;
    const correct = optionIndex === question.correctIndex;

    // Instant visual+haptic feedback (A-07) fires here, before the network call resolves — the
    // border/icon swap below and this haptic are both driven by local state set synchronously;
    // the real POST to T10's /api/quiz/submit happens after, so a slow network never delays the
    // "did I get it right" signal.
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    setScreen({ ...screen, selectedIndex: optionIndex, feedback: correct ? "correct" : "incorrect", submitting: true });

    try {
      const deviceId = await getOrCreateDeviceId();
      // Real T10 endpoint — server owns the +5XP/+1 token math (only on `correct: true`); this
      // screen never adds XP/tokens locally, it just renders whatever the response says.
      const { xp, tokens } = await submitQuiz(deviceId, question.id, correct);
      const nextCorrectCount = correctCount + (correct ? 1 : 0);
      setCorrectCount(nextCorrectCount);

      const nextIndex = screen.index + 1;
      setTimeout(() => {
        if (nextIndex >= QUESTIONS.length) {
          setScreen({ status: "done", correctCount: nextCorrectCount, xp, tokens });
        } else {
          setScreen({ status: "question", index: nextIndex, selectedIndex: null, feedback: null, submitting: false });
        }
      }, 650);
    } catch (err) {
      setScreen({ status: "error", message: err instanceof Error ? err.message : "Could not submit your answer." });
    }
  }

  if (screen.status === "error") {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-forest-deep px-8">
        <Ionicons name="alert-circle" size={40} color="#b8382f" />
        <Text className="text-center text-base text-text-on-dark">{screen.message}</Text>
        <TouchableOpacity onPress={() => router.back()} className="rounded-full bg-gold px-6 py-3 active:scale-95">
          <Text className="font-semibold text-forest-deep">Back to home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen.status === "done") {
    return (
      <SafeAreaView className="flex-1 bg-forest-deep">
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <MotiView
            from={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14 }}
            className="h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(217,172,57,0.16)" }}
          >
            <Ionicons name="school" size={48} color="#d9ac39" />
          </MotiView>
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-text-on-dark">Quiz complete</Text>
            <Text className="text-sm text-text-on-dark-muted">
              {screen.correctCount} / {QUESTIONS.length} correct
            </Text>
          </View>
          <View className="flex-row gap-4">
            <View className="items-center rounded-2xl bg-forest-ink px-5 py-3">
              <Text className="text-xl font-bold text-gold">{screen.xp}</Text>
              <Text className="text-xs text-text-on-dark-muted">Total XP</Text>
            </View>
            <View className="items-center rounded-2xl bg-forest-ink px-5 py-3">
              <Text className="text-xl font-bold text-gold">{screen.tokens}</Text>
              <Text className="text-xs text-text-on-dark-muted">Eco-Tokens</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.back()} className="items-center rounded-full bg-gold px-6 py-4 active:scale-95">
            <Text className="font-semibold text-forest-deep">Back to home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const question = QUESTIONS[screen.index]!;

  return (
    <SafeAreaView className="flex-1 bg-forest-deep">
      <View className="flex-1 px-6 py-6">
        <View className="mb-6 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="#f3f1e6" />
          </TouchableOpacity>
          <Text className="text-sm text-text-on-dark-muted">
            {screen.index + 1} / {QUESTIONS.length}
          </Text>
        </View>

        <Text className="mb-8 text-xl font-bold text-text-on-dark">{question.prompt}</Text>

        <View className="gap-3">
          {question.options.map((option, i) => {
            const isSelected = screen.selectedIndex === i;
            const isCorrectOption = i === question.correctIndex;
            const revealed = screen.selectedIndex !== null;

            let borderClass = "border-forest-ink bg-forest-ink";
            let icon: keyof typeof Ionicons.glyphMap | null = null;
            let iconColor = "#d9ac39";

            if (revealed && isSelected && screen.feedback === "correct") {
              borderClass = "border-green bg-green/20";
              icon = "checkmark-circle";
              iconColor = "#1e8a46";
            } else if (revealed && isSelected && screen.feedback === "incorrect") {
              borderClass = "border-critical bg-critical/10";
              icon = "close-circle";
              iconColor = "#b8382f";
            } else if (revealed && isCorrectOption) {
              // Reveal the right answer even on a miss, so the feedback teaches something.
              borderClass = "border-green/60 bg-forest-ink";
              icon = "checkmark-circle-outline";
              iconColor = "#1e8a46";
            }

            return (
              <TouchableOpacity
                key={option}
                onPress={() => handleSelect(i)}
                disabled={revealed || screen.submitting}
                className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 active:scale-95 disabled:opacity-90 ${borderClass}`}
              >
                <Text className="flex-1 pr-3 text-sm font-medium text-text-on-dark">{option}</Text>
                {icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {screen.submitting ? (
          <View className="mt-6 items-center">
            <ActivityIndicator color="#d9ac39" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
