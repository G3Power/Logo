# Logomaker

Create unique logos for businesses, creators, and ideas — on web, iOS, and Android.

Describe your brand, get a gallery of AI-designed logo concepts, pick a prototype, customize
everything (layout, symbol, colors, typography, casing, spacing), refine it with natural
language, and export a complete brand kit including iOS/Android app icons.

## Monorepo layout

| Path | Description |
| --- | --- |
| `apps/mobile` | Expo universal app (iOS, Android, and web) built with expo-router |
| `apps/api` | Hono API server: AI concept generation, refinement, AI marks, brand-kit export |
| `packages/logo-engine` | Platform-agnostic logo model: `LogoSpec` types, SVG renderer, curated marks/fonts/palettes, offline generator, app-icon derivation |
| `packages/shared` | Zod API contracts and a typed API client shared by app and server |

## Quick start

```bash
npm install

# Terminal 1 — API server (port 8787)
npm run dev -w @logomaker/api

# Terminal 2 — Expo app (press w for web, i for iOS, a for Android)
npm run dev -w @logomaker/mobile
```

The app works fully offline/unconfigured: without an AI key the server (and even the app by
itself) falls back to the built-in concept generator, and projects persist locally on-device.

## Configuration (all optional)

### API server (`apps/api`)

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` (or `CLAUDE_API_KEY`) | Enables Claude-powered concept generation and NL refinement |
| `OPENAI_API_KEY` | Enables OpenAI text features and AI image marks (image generation requires OpenAI) |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible gateway URL (e.g. Vercel AI Gateway) |
| `LOGO_TEXT_MODEL` | Structured-output model (default `claude-sonnet-4-6` with an Anthropic key, else `gpt-4o-mini`) |
| `LOGO_IMAGE_MODEL` | Image model for unique marks (default `gpt-image-1`) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Store generated AI marks in Supabase storage (bucket `logo-assets`); falls back to data URLs |
| `PORT` | API port (default 8787) |

### App (`apps/mobile`)

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | API base URL (defaults to `http://<dev-host>:8787`) |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Enables accounts and cross-device project sync |

### Supabase schema

Run `supabase/schema.sql` in the Supabase SQL editor to create the `projects` table,
row-level security policies, and the public `logo-assets` storage bucket.

## Features

- **Brief → concepts**: multi-step brief (name, tagline, industry, personality, colors) produces
  8 diverse concepts. With an AI key, an LLM designs them; otherwise a deterministic
  tag-matching generator runs (also used as the offline fallback and for "More concepts").
- **Editable vector prototypes**: every concept is a structured `LogoSpec` rendered to SVG —
  not a flat image — so everything stays customizable.
- **Editor**: text/casing, 5 layout variants (incl. badge shapes and monograms), 40+ curated
  symbols with search, solid/duotone/outline styles, curated palettes plus color-harmony
  suggestions and custom hex, 24 Google Font pairings, icon size/spacing, undo/redo.
- **AI refinement**: "make it more playful", "use green tones" — via LLM when configured,
  with a keyword-based fallback otherwise.
- **Unique AI marks**: optional one-of-a-kind raster symbol via image generation.
- **App icons**: every logo automatically derives an app icon (gradient/solid background,
  glyph or monogram, adjustable scale and corner radius) with iOS/Android/store previews.
- **Brand kit export**: zip containing color/white/black logo SVGs, PNGs up to 2048px, and a
  full icon set (iOS sizes, Android adaptive foreground/background layers, favicon).
- **Accounts & sync**: optional Supabase auth; guest projects merge into the account on
  sign-in; projects sync across devices.

## Development

```bash
npm run typecheck   # all packages
npm run test        # logo-engine + api test suites
npm run build       # web export
```
