# NutriVoice

NutriVoice is a polished Expo React Native MVP for AI-powered voice nutrition tracking. Users can record what they ate, review the transcript, run meal analysis, save meals, monitor daily totals, and unlock premium coaching flows tailored to fat loss, maintenance, or muscle gain.

## Project overview

This project is structured like a production-ready mobile app rather than a demo:

- Expo + Expo Router + TypeScript
- Supabase-ready authentication and data layer
- Mock AI transcription, meal parsing, nutrition matching, and coaching services
- Clean reusable component architecture
- Zustand stores for auth, profile, and meal flow state
- Seeded demo data so the app feels complete in development mode

The app runs in two modes:

- Supabase mode: enabled when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Mock mode: used automatically when those env vars are missing, with local demo auth plus seeded meals and profile data

## Features

- Welcome, register, login, onboarding, dashboard, history, premium, settings
- Protected routing with session restore
- Voice meal logging flow with recording state and transcript review
- Real OpenAI transcription path via Supabase Edge Function when configured
- Real OpenAI meal parsing path via Supabase Edge Function when configured
- Quick-add typed meal path alongside voice logging
- Editable transcription before analysis
- Mock AI meal parsing and nutrition enrichment
- Daily totals for calories, protein, carbs, fat, fiber, sugar, and sodium
- Meal detail, day detail, edit meal, delete meal
- Premium coaching screen with goal-aware recommendations
- Better inline errors and retry flows in key meal logging screens
- Improved edit-meal flow with meal type selection, re-parse from text, and item duplication
- Weekly overview scaffold and dashboard insight banner
- Offline status banner scaffold for future sync-aware behavior
- Premium mock toggle in settings for fast testing

## Tech stack

- Expo
- React Native
- TypeScript
- Expo Router
- Supabase
- Zustand
- React Hook Form
- Zod
- AsyncStorage
- Expo AV
- Expo Haptics
- Expo Linear Gradient
- Expo Network

## File structure

```text
app/
  (auth)/
  (onboarding)/
  (tabs)/
  meal/
  day/
components/
  common/
  dashboard/
  meal/
  premium/
  settings/
constants/
hooks/
lib/
repositories/
services/
store/
types/
utils/
supabase/schema.sql
```

## How to install

1. Install Node.js 20.19.4 or newer.
2. Install dependencies:

```bash
npm install
```

## How to run in Expo

```bash
npm run start
```

Then launch:

- `npm run android`
- `npm run web`
- `npm run ios` on macOS

## Typecheck

```bash
npm run typecheck
```

## Required environment variables

Create a `.env` file from `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

If these are missing, the app falls back to mock mode so you can still explore the full MVP.

## How to connect Supabase

1. Create a Supabase project.
2. Copy your project URL and anon key into `.env`.
3. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.
4. Disable email confirmation in Supabase Auth for the fastest MVP flow, or adapt signup handling if confirmation stays enabled.
5. Deploy the transcription function:

```bash
supabase functions deploy transcribe-audio
supabase functions deploy parse-meal
```

If you see `401 Unauthorized` / `Invalid JWT` from the edge function gateway, redeploy using the `supabase/config.toml` included in this project or run:

```bash
supabase functions deploy transcribe-audio --no-verify-jwt
supabase functions deploy parse-meal --no-verify-jwt
```

6. Add the OpenAI secret to Supabase:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set OPENAI_AUDIO_MODEL=gpt-4o-mini-transcribe
supabase secrets set OPENAI_MEAL_PARSER_MODEL=gpt-4o-mini
```

7. Restart Expo after changing environment variables.

The Supabase client lives in `lib/supabase.ts`.

## Real speech-to-text setup

Real transcription is now routed like this:

1. Expo app records audio locally
2. The app uploads the file to `supabase/functions/v1/transcribe-audio`
3. The Edge Function sends the file to OpenAI `POST /v1/audio/transcriptions`
4. The transcript text is returned to the app for review and editing

This keeps `OPENAI_API_KEY` off the mobile client, which is the production-safe approach for Expo apps.
For this MVP, the edge functions are configured as public function proxies and do not require user JWT verification at the gateway.

Relevant files:

- `services/ai/transcriptionService.ts`
- `services/ai/aiService.ts`
- `supabase/functions/transcribe-audio/index.ts`

## Real meal parsing setup

Real meal parsing is routed like this:

1. The app sends reviewed meal text to `supabase/functions/v1/parse-meal`
2. The Edge Function calls OpenAI with structured JSON output rules
3. The app receives meal type plus parsed food items and estimated quantities
4. Nutrition matching is then applied locally through the existing nutrition service layer

Relevant files:

- `services/ai/mealParsingService.ts`
- `services/ai/aiService.ts`
- `supabase/functions/parse-meal/index.ts`

## SQL schema example

The included schema creates:

- `profiles`
- `meals`
- `meal_items`

It also includes optional profile columns used by onboarding:

- `age`
- `weight_kg`
- `height_cm`
- `has_completed_onboarding`

## RLS policy overview

- Users can only read and write their own profile
- Users can only read and write their own meals
- Users can only read and write meal items when they own the parent meal

See the exact SQL policies in `supabase/schema.sql`.

## Where to replace mock AI services

These files are intentionally separated so real APIs can be introduced cleanly:

- `services/ai/aiService.ts`
  - Real transcription now calls a Supabase Edge Function when Supabase is configured
  - Real meal parsing now calls a Supabase Edge Function when Supabase is configured
  - Mock transcription still runs automatically when Supabase is not configured
  - Mock parsing still runs automatically when Supabase is not configured
- `services/nutrition/nutritionService.ts`
  - Replace mock nutrition lookup with USDA or another nutrition API
- `services/premium/premiumAdviceService.ts`
  - Replace mock coaching with an LLM-backed advice endpoint

Relevant TODO comments are already placed in those files.

## Production improvement ideas

- Replace mock auth fallback with full Supabase-only auth in production builds
- Add server-side profile creation trigger after signup
- Move AI analysis to edge functions or an API layer
- Add retry queues and offline sync strategy
- Add subscription billing for premium
- Add Apple Health and Google Fit integrations
- Add barcode scanning and meal photo recognition
- Add analytics, crash reporting, and feature flags
- Add automated tests for repositories, services, and route guards

## Suggested next steps

1. Connect real speech-to-text.
2. Replace the parser with an LLM prompt or structured extraction endpoint.
3. Replace nutrition mocks with a verified food database.
4. Move premium advice generation to a backend service.
5. Add real subscription entitlements.

## Notes about the current MVP

- Audio recording is real, transcription is mocked
- Meal parsing and nutrition lookup are mocked but typed and service-based
- Supabase integration is real when environment variables are configured
- In mock mode the app seeds realistic meals so dashboard and history feel complete immediately

## Important local environment note

This Expo SDK version expects Node 20.19.4 or newer. If `expo start` fails on an older Node version, upgrade Node first. TypeScript validation for this codebase passes with:

```bash
npm run typecheck
```
