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

## Refinement pass (2026-06, iteration 3) — verified by testing agent (18/18 backend, full golden path)
- P1 Landing: cinematic Ken Burns slow-zoom loop, gentle crossfade between hero_male/hero_female,
  one-shot headline entrance, restrained scroll parallax, button press micro-interactions. No gradients/flash.
- P2 Design DNA: immersive editorial redesign — cinematic banner image per question with serif title
  overlaid + large option cards; new "Analysing your design DNA" progress transition before the result.
  Result screen shows 5 style attributes (e.g. Minimal / Architectural / Tactile / Quiet / Contemporary).
- P3 AI Recommendation: "AI TRANSLATED YOUR TASTE" layer — deterministic reasoning links the structured
  DNA profile to 3 approved catalogue jackets, each with a short explanation (`data._recommendation_reason`).
- P4 Atelier: prominent MADE-ABILITY score + supporting copy ("Your design fits our current craft…"),
  live dual price + meter, LET AI FIX IT on conflicts.
- P5 Product Passport / Craft Story: kept, editorial, with LISTEN TO THE STORY ElevenLabs audio.
## Expansion pass (2026-06, iteration 4) — verified by testing agent (19/19 backend, full journey)
- Catalogue expanded to 10 gender/craft-distinct products (Men/Women/Unisex × Quilting/Ajrakh/Kantha/
  Kalamkari), each with a UNIQUE AI-generated campaign image. Product ids j01–j10 (j11/j12 removed;
  DNA recommendations remapped). New fields: gender, craft_type, reversible, piece_no, technique.
- Cinematic landing: multi-frame crossfade sequence (man→woman→craft→product→movement) + Ken Burns,
  subtitle line, secondary CTA → EXPLORE THE COLLECTION, and a new "CRAFT, REIMAGINED" section with 4
  craft-language cards that deep-link into the filtered catalogue (`/catalogue?craft=`).
- Catalogue filters: two rows — SHOP (gender) + CRAFT — with live filtering; `GET /api/jackets?gender=&craft=`
  and new `GET /api/crafts`. Safe image fallback added to `/api/media`.
- Product page: adaptive flip label (reversible vs "turn to see the craft"), premium Product Passport
  (Craft/Technique/Material/Origin/Maker/Production time) + piece ID (PIECE 00X / CRAFT / 2026).
- Atelier is craft-aware: the pattern tab + option labels adopt the product's craft vocabulary
  (e.g. Ajrakh → Block/Trellis/Panel/Scatter/Vine) while ids keep pricing/made-ability valid.
- Craft Story: editorial waveform in the audio player + piece ID in the passport.
- Imagery: gen_images2.py produced 12 new distinct campaign/texture images (Emergent key, reused).

## Backlog / not built (intentional per brief)
- P2: auth, admin, artisan onboarding, logistics, real payments, full marketplace, social — out of scope.
- Polish: Cormorant web font OTS fallback (web-only; loads on native).
- Future: real AI on-body visualisation (integration point stubbed in `visualise.tsx`).
