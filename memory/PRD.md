# PRD — OLD CRAFT. NEW LANGUAGE. (Contemporary Indian Craft Fashion Prototype)

## Original problem statement
Premium mobile-first fashion prototype for an AI-native contemporary Indian craft brand that translates
Indian craft traditions into contemporary clothing. Hero product: a reversible quilted jacket.
Editorial luxury aesthetic (warm ivory / charcoal / black / stone), NOT ethnic wear, NOT generic
Indian ecommerce. Golden path: DISCOVER → FIND YOUR DESIGN DNA → EXPLORE → CUSTOMISE → VISUALISE →
UNDERSTAND → BUY. Hackathon MVP — a spectacular working golden path over breadth.

## User choices
- AI editorial "design moment": deterministic templated copy (no live AI call).
- "See it on you" visualise: polished prototype placeholder (interface + integration point ready).
- Craft Story audio: REAL ElevenLabs voiceover (key provided, narration generated & cached).
- Pricing shown in both ₹ (INR) and $ (USD).
- Imagery: AI-generated (~6 spectacular reusable editorial images) via Gemini Nano Banana.

## Architecture
- Frontend: Expo (SDK 54) + expo-router, stack-only navigation. Fonts: Cormorant Garamond (display) +
  Satoshi (UI) via expo-font. Design context (`src/store.tsx`) holds selection / active jacket / DNA / size.
- Backend: FastAPI + MongoDB. Modular design data in `backend/data.py` (jackets, silhouettes, quilts,
  colours, craft treatments, pricing, compatibility, DNA profiles). Deterministic price / made-ability /
  editorial + DNA scoring. AI imagery served & reused from `/api/media/{name}` (fallback to Unsplash).
- Integrations: Gemini Nano Banana (build-time image gen, Emergent key), ElevenLabs TTS (craft story).

## Screens implemented (2026-06)
- Landing: cinematic parallax hero, headline, two CTAs, reversible story, craft teaser, collection CTA.
- Design DNA: 5 visual questions, hairline progress, auto-advance, haptics → deterministic profile.
- DNA Result: profile name/description, palette/silhouette/craft affinity, tags, 3 recommendations.
- Catalogue: 12 curated jackets, sticky filter chip row (4 categories), 2-col grid, dual pricing.
- Product page: swipeable gallery (front/reverse/detail), design-moment quote, passport accordion, sticky "MAKE IT YOURS".
- The Atelier: live jacket visual, silhouette/quilt/colour/craft/personal selectors, animated made-ability
  meter, deterministic conflict + "LET AI FIX IT", live dual price, editorial copy.
- Visualise: photo upload (permission flow + Open Settings), prototype editorial preview, integration point.
- Craft Story: artisan hero, ElevenLabs audio player (play/pause + scrubber), body copy, product passport.
- Checkout: product + customisation summary, size selector, price breakdown, delivery estimate, order confirmation.

## Verified
- Backend 17/17 pytest passed. Frontend golden path passed end-to-end (testing agent iteration 1).
- Fixed: INR_TO_USD import ($ NaN on catalogue/checkout).

## Added (2026-06, iteration 2)
- Reversible Preview: one-tap 3D flip (rotateY, backfaceVisibility faces) on the product page hero —
  FRONT ⇄ REVERSE with matching side label + "ONE JACKET · TWO WORLDS" button. (`product/[id].tsx`)
- Real AI Try-On: `POST /api/visualise` takes the user's photo (base64) + current selection and uses
  Gemini Nano Banana image editing to dress the same person in the exact custom jacket, saved and served
  from `/api/media/{name}`. Visualise screen now calls it live (with graceful fallback to the framed photo
  on failure). Verified producing a correct on-body indigo geometric bomber. (`server.py`, `visualise.tsx`)

## Backlog / not built (intentional per brief)
- P2: auth, admin, artisan onboarding, logistics, real payments, full marketplace, social — out of scope.
- Polish: Cormorant web font OTS fallback (web-only; loads on native).
- Future: real AI on-body visualisation (integration point stubbed in `visualise.tsx`).
