# 🛠️ ENGINEERING TASK BREAKDOWN

This task breakdown is structured for sprint execution during the hackathon.

```
📁 project-asaase/
├── 📁 server/                     # Express.js Backend API
│   ├── 📁 src/
│   │   ├── 📁 ai/                 # Vercel AI SDK & Provider configs
│   │   ├── 📁 controllers/        # Route logic
│   │   ├── 📁 services/           # PostGIS clustering & DB handlers
│   │   └── index.ts
│   ├── prisma/                    # DB Schemas
│   └── package.json
└── 📁 mobile/                     # React Native Expo Application
    ├── 📁 app/                    # expo-router pages
    ├── 📁 components/             # Reusable UI & Animations
    └── package.json

```

---

### Phase 1: Local Environment & AI Engine Setup

#### `TASK-1.0`: Express Backend & Local Ollama Setup

* **Owner:** Backend Lead
* **Steps:**
1. Initialize Node/Express project: `npm init -y && npm i express cors ai @ai-sdk/openai zod dotenv`
2. Install dev dependencies: `npm i -D typescript ts-node-dev @types/express @types/node`
3. Set up the Vercel AI SDK local provider factory in `src/ai/provider.ts`:



```typescript
import { createOpenAI } from '@ai-sdk/openai';

// Local Ollama instance via OpenAI-compatible endpoint
export const localOllama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama', // Unused but required by standard client initialization
});

export const defaultModel = process.env.NODE_ENV === 'production' 
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o-mini')
  : localOllama('llama3.2');

```

4. Ensure Ollama is running locally: `ollama run llama3.2` and `ollama run llava`.

#### `TASK-1.1`: Database Schema & PostGIS Integration

* **Owner:** Backend / Database Engineer
* **Steps:**
1. Spin up Supabase PostgreSQL instance and execute: `CREATE EXTENSION IF NOT EXISTS postgis;`
2. Define Prisma schema in `prisma/schema.prisma`:



```prisma
model User {
  id        String   @id @default(uuid())
  streak    Int      @default(0)
  xp        Int      @default(0)
  tokens    Int      @default(0)
  scans     Scan[]
}

model Scan {
  id           String            @id @default(uuid())
  imageUrl     String
  latitude     Float
  longitude    Float
  blockageType String
  clusterId    String?
  cluster      ChokepointCluster? @relation(fields: [clusterId], references: [id])
  createdAt    DateTime          @default(now())
}

model ChokepointCluster {
  id             String   @id @default(uuid())
  latitude       Float
  longitude      Float
  severity       Int      @default(1)
  summaryText    String?
  scans          Scan[]
}

```

#### `TASK-1.2`: Mobile Expo App Setup

* **Owner:** Mobile Lead
* **Steps:**
1. Create Expo project: `npx create-expo-app@latest mobile --template tabs`
2. Install dependencies: `npx expo install nativewind react-native-reanimated moti lottie-react-native expo-camera expo-location expo-haptics`
3. Install `@ai-sdk/react` and `expo/fetch` for streaming capabilities on native mobile runtime.



---

### Phase 2: Core Feature Engineering

#### `TASK-2.0`: Mobile Gamification Dashboard (UI/UX)

* **Owner:** Mobile Engineer
* **Tasks:**
* Build top status bar with `MotiView` animated fire icon for daily streak counter.
* Implement smooth XP progress bar animation using `react-native-reanimated`.
* Add haptic feedback trigger (`expo-haptics`) upon token count increments.



#### `TASK-2.1`: AI Vision Scan Endpoint & Multimodal Capture

* **Owner:** Fullstack Engineer
* **Tasks:**
* **Mobile:** Build camera viewport with `expo-camera`. On button press, pull GPS via `expo-location` and transmit Base64 image payload + lat/lng coordinates to server.
* **Backend:** Implement `POST /api/scans/analyze` route using Vercel AI SDK's `generateObject`:



```typescript
import { generateObject } from 'ai';
import { localOllama } from '../ai/provider';
import { z } from 'zod';

export async function analyzeScan(req, res) {
  const { imageBase64, latitude, longitude } = req.body;

  const { object } = await generateObject({
    model: localOllama('llava'), // Uses local multimodal model for local vision processing
    schema: z.object({
      blockageType: z.enum(['sachet_water_rubbers', 'pet_bottles', 'silt_sand', 'overgrown_weeds']),
      confidence: z.number(),
      estimatedSeverity: z.number().min(1).max(5),
    }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this drainage photo and identify the primary blockage material.' },
          { type: 'image', image: imageBase64 },
        ],
      },
    ],
  });

  // Save to DB & trigger PostGIS spatial clustering task...
  res.json({ success: true, analysis: object });
}

```

#### `TASK-2.2`: Spatial Clustering Logic (PostGIS)

* **Owner:** Backend Engineer
* **Tasks:**
* Execute a spatial query inside the scan creation flow to check for existing clusters within 20 meters:



```sql
SELECT id FROM "ChokepointCluster" 
WHERE ST_DWithin(
  ST_MakePoint(longitude, latitude)::geography, 
  ST_MakePoint($1, $2)::geography, 
  20
) LIMIT 1;

```

* If a cluster exists, attach `scan.id` to it and increment severity. Otherwise, instantiate a new `ChokepointCluster`.

#### `TASK-2.3`: LLM Intelligence Briefing Generator

* **Owner:** Backend AI Engineer
* **Tasks:**
* Create route `GET /api/clusters/:id/summary` using Vercel AI SDK's `streamText`:



```typescript
import { streamText } from 'ai';
import { localOllama } from '../ai/provider';

export async function getClusterSummary(req, res) {
  const { clusterData } = req.body;

  const result = streamText({
    model: localOllama('llama3.2'),
    prompt: `You are a municipal flood expert. Summarize this chokepoint data for NADMO clearance crews: ${JSON.stringify(clusterData)}. Provide required cleanup equipment recommendations.`,
  });

  result.pipeDataStreamToResponse(res);
}

```

---

### Phase 3: Institutional Web View & Final Polish

#### `TASK-3.0`: NADMO Spatial Command Map

* **Owner:** Web/Frontend Engineer
* **Tasks:**
* Build a lightweight web view rendering an interactive Leaflet/Mapbox map.
* Render clustered chokepoints color-coded by severity (Green: 1-2, Amber: 3, Red: 4-5).
* Clicking a cluster triggers the streaming summary endpoint (`TASK-2.3`) to show real-time clearing instructions.



#### `TASK-3.1`: End-to-End System Testing

* **Owner:** Entire Team
* **Tasks:**
1. Test flow locally: Snap photo on mobile app -> Vision model categorizes via local Ollama -> PostGIS clusters point -> Web map updates -> LLM generates summary instructions.
2. Validate streak reset timers and token marketplace redemption flows.