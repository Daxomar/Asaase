# 📄 PRODUCT REQUIREMENT DOCUMENT (PRD)

## 1. Executive Summary & Vision

**Project Asaase** is an AI-driven, gamified climate action platform engineered to mitigate urban flooding in Accra by mobilizing youth. It bridges the gap between daily mobile engagement and municipal hydrology.

### Core Philosophy: Micro-Habitual Loop Mechanics

The platform operates on a persistent habit-formation loop rather than passive reporting.

* **1. Trigger:** Daily morning push notification or hyper-local weather alert.
* **2. Micro-Action:** 30-second Eco-Quiz or 5-second drain scan.
* **3. Instant Feedback:** Direct haptic/visual validation (<300ms) with streak counters and sound cues.
* **4. Variable Reward:** Earn Experience Points (XP) & Eco-Tokens redeemable for MTN data bundles, food vouchers, or green gear.

---

## 2. Architecture & Tech Stack Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOBILE CLIENT (EXPO / REACT NATIVE)             │
│   NativeWind v4 • Reanimated v3 • Moti • Expo Camera • expo/fetch     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Stream
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS.JS BACKEND (VERCEL / NODE)              │
│   TypeScript • Express • Prisma ORM • Vercel AI SDK Core (`ai`)        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  Vercel AI SDK Provider Switcher    │  │  PostgreSQL + PostGIS DB    │
│  - Dev/Local: @ai-sdk/openai        │  │  - Spatial 20m Clustering    │
│    -> Local Ollama (llama3.2/llava)  │  │  - Chokepoint Aggregation    │
│  - Prod: @ai-sdk/openai / anthropic  │  │                              │
└──────────────────────────────────────┘  └──────────────────────────────┘

```

* **Frontend:** React Native (Expo SDK 52+), `expo-router`, NativeWind v4, `react-native-reanimated`, `moti`, `lottie-react-native`, `expo/fetch`.
* **Backend:** Express.js on Node.js / TypeScript.
* **AI Subsystem (Local & Production Compatibility):** Vercel AI SDK (`ai`). Configured with `@ai-sdk/openai` pointed at local Ollama (`http://localhost:11434/v1`) during development, allowing seamless provider switching in production with **zero code refactoring**.
* **Database / Spatial Data:** PostgreSQL + PostGIS (Supabase / Prisma) with 20-meter coordinate radius clustering.

---

## 3. Functional Feature Specifications

| Feature ID | Feature Name | Core Functionality | Acceptance Criteria |
| --- | --- | --- | --- |
| **FEAT-001** | Daily Streak Engine | Measures consecutive days of active engagement. | Flame/Shield counter on dashboard. Resets to zero if inactive over 24h GMT. Push notification 4h before reset. |
| **FEAT-002** | Gamified Eco-Quizzes | 3-to-5 question interactive learning strings. | Instant visual/haptic response on answer select. Correct answers award +5 XP and 1 Eco-Token. |
| **FEAT-003** | Camera Scanner UI | Captures street drain images with metadata extraction. | Camera viewport with active bounding box overlay. Extracts high-accuracy GPS coordinates upon click. |
| **FEAT-004** | Token Marketplace | Redeems tokens for tangible commodities. | Grid view of partner rewards (MTN data, vouchers). Confetti Lottie animation upon redemption. |
| **FEAT-005** | Vision AI Pipeline | Categorizes blockage materials using Vercel AI SDK + LLM. | Classifies uploads into 4 arrays: `sachet_water_rubbers`, `pet_bottles`, `silt_sand`, or `overgrown_weeds`. |
| **FEAT-006** | PostGIS Clustering | Aggregates duplicate scans inside a 20m radius. | Prevents duplicate map pins. Automatically scales severity metric as report density increases within radius. |
| **FEAT-007** | LLM Intelligence Brief | Generates human-readable summaries for municipal response. | Streams concise action plans (e.g., "75% plastic, requires manual shovel crew") using Vercel AI SDK. |
| **FEAT-008** | NADMO Command Map | Web dashboard for municipal decision-makers. | Heatmap view color-coding chokepoints by severity. Provides API endpoint `GET /api/v1/alerts/summary`. |

---