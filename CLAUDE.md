# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chinese character flashcard app with spaced repetition, built with React, TypeScript, Vite, and Supabase. Users can study Chinese characters, track progress, and manage their character collection.

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL database)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **Package Manager**: npm (`package-lock.json`)
- **Node**: 22 (`.nvmrc`; run `nvm use` — the build fails on Node < 20)
- **Hosting**: Firebase Hosting (project `yici-55751`) as an installable PWA (`vite-plugin-pwa`)

## Development Commands

```bash
# Use the project's Node version
nvm use

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Build and deploy to Firebase Hosting (https://yici-55751.web.app)
npm run deploy
```

## Architecture

### Core Data Model

The app centers around a `Character` interface with spaced repetition tracking:
- **Storage**: `src/lib/storage.ts` - Supabase integration layer
- **Business Logic**: `src/lib/flashcard-logic.ts` - Study session management
- **Database**: Supabase with `characters` table using RLS (Row Level Security)

Characters have: `chinese`, `pinyin`, `english`, `category`, `score`, `attempts`, `correctCount`, `lastReviewed`

### Study Algorithm

Located in `flashcardLogic.selectStudyCards` (`src/lib/flashcard-logic.ts`). `storage.getStudySession()` returns every character of the category (no ordering/limit); the selection then draws the session size the user chose (5 / 10 / 20 / all, via `SessionSizeDialog`) with a weighted random sample without repeats, and shuffles the deck:
1. Score weight `1 / (1 + score - lowestScoreInCategory)²` - weaker items are favored but don't take every slot
2. Cooldown: items reviewed (`lastReviewed`) in the last 6 hours keep only 15% of their weight, so consecutive rounds bring different items
No migration involved - it uses the existing `score` and `last_reviewed` columns.

When a user answers correctly, `score` increments by 1. Incorrect answers decrement by 1 (minimum 0).

### Routing Structure

- `/` - Main study interface (Index page)
- `/manage` - Character management (CRUD operations)
- `/*` - 404 page

### Database Integration

Supabase client is initialized in `src/lib/supabase.ts`. All data operations go through the `storage` object in `src/lib/storage.ts`, which provides:
- Character CRUD operations
- Study session generation
- Answer recording with automatic score updates
- Sample data initialization

**Note**: Supabase credentials are currently hardcoded in `src/lib/supabase.ts`. These are public anon keys safe for client-side use.

### Component Structure

- **Pages**: `src/pages/` - Route-level components (Index, ManageCharacters, NotFound)
- **Feature Components**: `src/components/` - FlashCard, CategoryFilter, CharacterForm
- **UI Components**: `src/components/ui/` - shadcn/ui library (pre-installed, do not regenerate)

### Path Aliases

- `@/` points to `src/` directory (configured in `vite.config.ts`)

## Key Implementation Details

### Flashcard Study Flow

1. User selects category on Index page
2. `storage.getStudySession()` fetches characters sorted by learning priority
3. `flashcardLogic.createSession()` creates a session object tracking progress
4. For each answer, `storage.recordAnswer()` updates the database
5. Session completes when all cards are answered, showing accuracy stats

### Study Sessions & Home Stats

- Table `public.study_sessions` (migration in `supabase/migrations/`, RLS per user): one row per session, created on the first answer by `createSessionTracker` (`src/lib/session-tracker.ts`) and updated after each answer (`cards_answered`, `correct_count`, `completed`). If the table is missing, studying still works and the session simply isn't counted
- Home stats (`src/components/HomeStats.tsx`, math in `src/lib/stats.ts`, local calendar days): current/best day streak and sessions in the last 7 days (from `study_sessions`), words reviewed in the last 7 days with `attempts >= 2`, and a minimal cumulative vocabulary-growth area chart (by `created_at`; title only, no axis or total, details on hover; lazy-loaded so Recharts stays out of the main bundle) — hidden entirely when no word was added in the last 30 days
- New migrations go in `supabase/migrations/<timestamp>_<name>.sql` and are run in the Supabase SQL Editor

### Home Category Mosaic

The home page shows categories as a 2-column Pinterest-style mosaic (`src/components/CategoryMosaic.tsx`):
- Tile size by ranking of character count (`src/lib/category-mosaic.ts`): top third tall (3:4), middle square (1:1), bottom short (4:3); tiles in alphabetical order, each placed in the shorter column
- Background images: `src/assets/categories/<slug>.jpg`, slug = lowercase, `&` removed, spaces → `-` (e.g. `numbers-dates.jpg`), loaded automatically via `import.meta.glob` (`src/lib/category-images.ts`); categories without an image get a gradient fallback
- After adding/replacing an image run `npm run optimize-images` (center-crops to ≤4:3, 1024×768, JPEG q72)
- Use arbitrary aspect classes (`aspect-[1/1]`): the `@tailwindcss/aspect-ratio` plugin disables named ones like `aspect-square`

### Category Filtering

Categories are derived dynamically from existing characters, not stored separately. Both Index and ManageCharacters pages compute categories using:
```typescript
const categories = [...new Set(characters.map(char => char.category))].sort();
```

### State Management

- Local React state for UI interactions
- TanStack Query wraps the app (QueryClientProvider in App.tsx) for potential server state caching
- Supabase handles persistence

## Important Notes

- The project is "Yici" (一词, "one word") — a Chinese vocabulary-building app (formerly "Shynese")
- All shadcn/ui components are pre-downloaded and should not be regenerated
- Use existing components from `@/components/ui` rather than installing new ones
- Database schema should match the interfaces in `src/lib/storage.ts`
- The app initializes sample data on first load if database is empty

## Skills

- .claude/skills/mobile-first/SKILL.md — Always follow for any UI work
