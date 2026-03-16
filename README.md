# NutriVoice

NutriVoice is a polished Expo React Native MVP for AI-powered voice nutrition tracking. Users can record what they ate, review the transcript, run meal analysis, save meals, monitor daily totals, and unlock premium coaching flows tailored to fat loss, maintenance, or muscle gain.

## Project overview

This project is structured like a production-ready mobile app rather than a demo:

- Expo + Expo Router + TypeScript
- Supabase-ready authentication and data layer
- Mock AI transcription, meal parsing, and coaching services
- Hybrid nutrition lookup with Open Food Facts, USDA fallback, and local safety fallback
- Clean reusable component architecture
- Zustand stores for auth, profile, and meal flow state
- Seeded demo data so the app feels complete in development mode

The app runs in two modes:

- Supabase mode: enabled when `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Mock mode: used automatically when those env vars are missing, with local demo auth plus seeded meals and profile data

## Features

- Welcome, register, login, onboarding, dashboard, history, premium, settings
- Protected routing with session restore
- E-mailverificatieflow met controleer-je-mail scherm en opnieuw-versturen actie
- Wachtwoord-vergeten flow met deep link terug naar een nieuw-wachtwoord scherm
- Voice meal logging flow with recording state and transcript review
- Real OpenAI transcription path via Supabase Edge Function when configured
- Real OpenAI meal parsing path via Supabase Edge Function when configured
- Quick-add typed meal path alongside voice logging
- Editable transcription before analysis
- Hybrid nutrition enrichment with Open Food Facts, USDA fallback, and local safety fallback
- Daily totals for calories, protein, carbs, fat, fiber, sugar, and sodium
- Meal detail, day detail, edit meal, delete meal
- Premium coaching screen with goal-aware recommendations and a launch plan that can be activated in-app
- Better inline errors and retry flows in key meal logging screens
- Improved edit-meal flow with meal type selection, re-parse from text, and item duplication
- Weekly overview scaffold and dashboard insight banner
- Offline status banner scaffold for future sync-aware behavior
- Premium launch plan visible in-app with temporary EUR 0 activation

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

## Mobile and store readiness

The app is now configured phone-first and closer to submission-ready defaults:

- Portrait-only orientation
- Safer keyboard handling on long mobile forms
- Bottom tabs that respect safe-area insets and hide while typing
- Microphone permission string configured through Expo config
- iOS and Android package identifiers configured
- Runtime version policy set for safer updates
- iOS non-exempt encryption flag configured
- Tablet support disabled for now so store review matches the current phone-first UX

Current IDs in `app.json`:

- iOS bundle identifier: `com.nutrivoice.app`
- Android package: `com.nutrivoice.app`

If you already have final production IDs, replace these before the first store upload.

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

For EAS/TestFlight builds, set these as EAS environment variables for the matching build profile as well. A local `.env` file on your machine does not retroactively affect an already-uploaded TestFlight binary.

## How to connect Supabase

1. Create a Supabase project.
2. Copy your project URL and anon key into `.env`.
3. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.
4. Configure Supabase Auth for production:
   - enable email confirmation
   - make sure password recovery is enabled
   - add redirect URLs for your app, including `nutrivoice://auth/callback`
   - for web/dev, also add your local Expo callback URL if you test there
5. Deploy the edge functions:

```bash
supabase functions deploy transcribe-audio
supabase functions deploy parse-meal
supabase functions deploy lookup-nutrition
```

If you see `401 Unauthorized` / `Invalid JWT` from the edge function gateway, redeploy using the `supabase/config.toml` included in this project or run:

```bash
supabase functions deploy transcribe-audio --no-verify-jwt
supabase functions deploy parse-meal --no-verify-jwt
supabase functions deploy lookup-nutrition --no-verify-jwt
```

6. Add the provider secrets to Supabase:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set OPENAI_AUDIO_MODEL=gpt-4o-mini-transcribe
supabase secrets set OPENAI_MEAL_PARSER_MODEL=gpt-4o-mini
supabase secrets set USDA_API_KEY=your_usda_api_key
```

7. Restart Expo after changing environment variables.

The Supabase client lives in `lib/supabase.ts`.

## Email verification and password reset

NutriVoice now includes:

- signup that supports email confirmation
- a dedicated `Controleer je e-mail` screen
- resend verification email support
- `Wachtwoord vergeten` flow
- password reset deep link support through `nutrivoice://auth/callback`
- in-app `Nieuw wachtwoord instellen` screen

Relevant files:

- `services/auth/authService.ts`
- `store/authStore.ts`
- `app/(auth)/verify-email.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/auth/callback.tsx`
- `app/auth/reset-password.tsx`

Important setup:

- keep the Expo scheme in `app.json` as `nutrivoice`
- add `nutrivoice://auth/callback` to Supabase Auth redirect URLs
- on iOS, test these flows in a development build or release build, not only in the browser

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
4. Nutrition matching is requested from the `lookup-nutrition` Edge Function

Relevant files:

- `services/ai/mealParsingService.ts`
- `services/ai/aiService.ts`
- `supabase/functions/parse-meal/index.ts`

## Hybrid nutrition lookup setup

Nutrition is now routed like this:

1. The app sends parsed meal items to `supabase/functions/v1/lookup-nutrition`
2. The Edge Function tries `Open Food Facts` first for branded and European product matches
3. If nothing useful is found and `USDA_API_KEY` is configured, it tries `USDA FoodData Central`
4. If neither provider returns a usable match, the app falls back to the built-in local nutrition matcher so the user flow keeps working

Relevant files:

- `services/nutrition/nutritionService.ts`
- `supabase/functions/lookup-nutrition/index.ts`
- `constants/mockNutritionDatabase.ts`

Notes:

- `Open Food Facts` does not require an API key for read lookups in this setup
- `USDA FoodData Central` requires `USDA_API_KEY` as a Supabase secret
- For production scale, add caching and rate limiting around `lookup-nutrition`

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
  - Hybrid nutrition lookup now uses Open Food Facts plus USDA via Supabase Edge Function
  - Local matching remains as resilient fallback if providers fail or return nothing
- `services/premium/premiumAdviceService.ts`
  - Replace mock coaching with an LLM-backed advice endpoint

Relevant TODO comments are already placed in those files.

## Production improvement ideas

- Replace mock auth fallback with full Supabase-only auth in production builds
- Add server-side profile creation trigger after signup
- Move AI analysis to edge functions or an API layer
- Add retry queues and offline sync strategy
- Add real subscription billing for premium after the temporary EUR 0 launch plan ends
- Add Apple Health and Google Fit integrations
- Add barcode scanning and meal photo recognition
- Add analytics, crash reporting, and feature flags
- Add automated tests for repositories, services, and route guards

## Suggested next steps

1. Replace placeholder store assets with final branded icon, splash, and screenshots.
2. Add caching and rate limiting around the new hybrid nutrition provider.
3. Move premium advice generation to a backend service.
4. Add real subscription entitlements.
5. Add production analytics, crash reporting, and moderation-safe API monitoring.

## Notes about the current MVP

- Audio recording is real, and transcription can use the Supabase Edge Function + OpenAI path when configured
- Meal parsing can use the Supabase Edge Function + OpenAI path when configured
- Nutrition lookup now uses Open Food Facts, USDA fallback, and local fallback matching
- Supabase integration is real when environment variables are configured
- In mock mode the app seeds realistic meals so dashboard and history feel complete immediately

## Manual app store checklist

These items still need real product/business inputs before a real App Store or Play Store submission:

- Replace placeholder bundle/package IDs if you want your own final production identifiers
- Replace app icon, adaptive icon, splash image, screenshots, and promotional artwork with final branded assets
- Prepare a privacy policy URL and support URL
- Prepare store listing copy in Dutch and/or English
- Confirm the reviewer note that premium currently activates in-app at EUR 0 without a purchase flow
- Create reviewer notes describing:
  - guest mode
  - microphone usage for meal recording
  - test credentials if premium or auth flows need review access
- Validate that all external links, legal copy, and account deletion expectations match store policy

## Important local environment note

This Expo SDK version expects Node 20.19.4 or newer. If `expo start` fails on an older Node version, upgrade Node first. TypeScript validation for this codebase passes with:

```bash
npm run typecheck
```
