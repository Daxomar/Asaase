// AI provider switcher — ORCHESTRATOR_CONTRACT.md §4. Single module; call sites import
// getVisionModel()/getTextModel(), never construct a provider inline (A-02). Dev → local
// Ollama via the OpenAI-compatible endpoint; prod → real cloud provider. No mock/stub
// providers here — an unreachable provider surfaces as a thrown/rejected call at the call
// site, which maps that to AI_PROVIDER_UNAVAILABLE (no fallback text, no stub classification).
import type { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const isProd = process.env.NODE_ENV === "production";

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama", // unused but required by the OpenAI-compatible client shape
});

const cloud =
  process.env.AI_PROVIDER === "anthropic"
    ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getVisionModel = (): LanguageModel =>
  isProd ? cloud(process.env.AI_VISION_MODEL ?? "gpt-4o-mini") : ollama("llava");

export const getTextModel = (): LanguageModel =>
  isProd ? cloud(process.env.AI_TEXT_MODEL ?? "gpt-4o-mini") : ollama("llama3.2");
