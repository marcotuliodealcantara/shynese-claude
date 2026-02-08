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
- **Package Manager**: pnpm

## Development Commands

```bash
# Install dependencies
pnpm i

# Start dev server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm preview

# Lint code
pnpm run lint
```

## Architecture

### Core Data Model

The app centers around a `Character` interface with spaced repetition tracking:
- **Storage**: `src/lib/storage.ts` - Supabase integration layer
- **Business Logic**: `src/lib/flashcard-logic.ts` - Study session management
- **Database**: Supabase with `characters` table using RLS (Row Level Security)

Characters have: `chinese`, `pinyin`, `english`, `category`, `score`, `attempts`, `correctCount`, `lastReviewed`

### Study Algorithm

Located in `src/lib/flashcard-logic.ts`. Sessions are created with characters sorted by:
1. Score (ascending) - prioritize unlearned/difficult items
2. Attempts (descending) - among equal scores, show previously attempted items first

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

- README.md contains git merge conflict markers - the project is "Shineeze Character Flashcards" (Chinese learning app)
- All shadcn/ui components are pre-downloaded and should not be regenerated
- Use existing components from `@/components/ui` rather than installing new ones
- Database schema should match the interfaces in `src/lib/storage.ts`
- The app initializes sample data on first load if database is empty
