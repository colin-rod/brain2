# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Brain2** is a single-user work knowledge system that converts messy inputs (handwritten notes, pasted text, chat transcripts) into structured, reviewable, long-term work memory. Upload/paste → OpenAI extracts structured data → user reviews/edits → save to Supabase.

**Core Principle**: Nothing becomes canonical until the user reviews and confirms it.

## Tech Stack

- **Frontend**: Next.js 15 (App Router, TypeScript)
- **UI**: Tailwind CSS 4 + shadcn/ui (New York style) + North Design System
- **Client state**: Zustand (review page draft)
- **Backend**: Next.js Server Actions + Route Handlers (no Supabase Edge Functions)
- **DB/Auth/Storage**: Supabase (remote only, no Docker)
- **Parsing**: OpenAI GPT-4o Vision + Structured Outputs (single call handles OCR + extraction)
- **Fuzzy matching**: fuse.js (client-side)
- **Package manager**: pnpm 9 (engine-strict)
- **Deployment**: Vercel

## Commands

```bash
pnpm run dev          # Dev server
pnpm run build        # Production build
pnpm run lint         # ESLint
pnpm run check        # TypeScript type check (tsc --noEmit)
pnpm run format       # Prettier format all files
pnpm run format:check # Check formatting without writing
```

## Architecture

### Route Groups

- `app/(auth)/` — Login page (force-dynamic, Supabase Auth)
- `app/(app)/` — All authenticated pages with sidebar layout
- `app/page.tsx` — Redirects to `/inbox`

### Key Directories

- `lib/supabase/` — Client (browser), server (cookies), middleware (session refresh)
- `lib/actions/` — Server actions (capture, parse, save, export)
- `lib/parser/` — Parser provider interface + OpenAI implementation
- `lib/stores/` — Zustand stores (review page state)
- `lib/validation/` — Payload validation
- `lib/markdown/` — Markdown export renderer
- `components/layout/` — Sidebar + mobile bottom nav
- `components/review/` — Review page editor components
- `components/shared/` — Reusable UI (search, filters, tables)
- `types/` — `database.ts` (Supabase row types), `domain.ts` (parser/review types)

### Auth Flow

1. Middleware (`middleware.ts`) refreshes Supabase session on every request
2. Unauthenticated → redirect to `/login`
3. Authenticated on `/login` → redirect to `/inbox`
4. RLS policies enforce user-scoped data access

### Data Flow

1. **Capture**: User uploads image or pastes text → `createCapture()` server action → capture row + Storage upload
2. **Parse**: User triggers parse → `parseCapture()` → OpenAI Vision/text → `parsed_json` stored on capture
3. **Review**: User edits all fields on review page → Zustand draft state with persist
4. **Save**: User confirms → `saveReviewedNote()` → transactional insert into notes, tasks, people, projects, decisions, open_questions, junction tables
5. **Export**: Auto-generates markdown → uploads to Storage

## North Design System

Warm parchment palette adapted from NorthStar/Taskmaster. Defined in `app/globals.css`.

### Typography (use these, not generic Tailwind)

- `text-page-title` — 22px, Fraunces, weight 600 (h1)
- `text-section-header` — 16px, weight 600 (h2-h4)
- `text-issue-title` — 16px, weight 500 (list item titles)
- `text-body` — 15px, weight 400 (default)
- `text-metadata` — 13px, weight 500 (labels, secondary)
- `font-accent` — Fraunces (headings)
- `font-ui` — Inter (body)

### Spacing (4px grid)

Use `north-xs` (4px) through `north-2xl` (48px) for padding, margin, gap.

### Colors

Use semantic names: `bg-background`, `bg-surface`, `bg-surface-subtle`, `text-foreground`, `text-foreground-secondary`, `text-foreground-muted`, `bg-primary` (burnt orange), `bg-primary-tint`.

Status colors: `bg-status-new`, `bg-status-processing`, `bg-status-parsed`, `bg-status-in-review`, `bg-status-saved`, `bg-status-failed`.

## Coding Principles

Same as NorthStar:

1. **Think before coding** — Surface tradeoffs, ask when uncertain
2. **Simplicity first** — Minimum code that solves the problem, no speculative abstractions
3. **Surgical changes** — Only touch what you must, match existing style
4. **Goal-driven execution** — Define success criteria, verify each step

## Database

Remote Supabase only — no Docker, no local Supabase. Migrations in `supabase/migrations/`, applied via `npx supabase db push`.

## Pre-commit

Husky + lint-staged runs ESLint fix + Prettier on staged `.ts`/`.tsx` files.
