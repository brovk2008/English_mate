# 🌸 Sakura English Journey (Sakura-Ez)

Sakura English Journey is a personalized, premium 90-day English learning web application designed for students to master English through a structured curriculum, interactive media, and engaging gamification. The platform features a dedicated Student Portal alongside a secure Teacher Dashboard for progress tracking, real-time diary reviews, and personalized assignments.

---

## 🚀 Key Features

### 1. Daily Study Curriculum (90-Day Journey)
*   **Vocabulary Practice**: Study 10 curated words daily mapped to the Oxford 3000 vocabulary list, backed by a spaced repetition (SRS) algorithm to optimize retention.
*   **Grammar Explainer**: Access concise daily grammar topics with embedded YouTube teaching videos.
*   **Song of the Day**: Build listening comprehension with Spotify embeds, synced lyric guides, and translation challenges.
*   **Listening Practice**: Train listening skills with graded media content (including anime clips and CaseOh video logs) with subtitles guidance.
*   **Writing Diary**: Write daily journals in an auto-saving text editor. Features live word-count trackers and automatic diary-writing checkpoints.
*   **Speaking & Pronunciation**: Record spoken responses using the browser-native SpeechRecognition API with instant pronunciation feedback and interactive haptics.

### 2. Gamification & Progression (Phase 6 Additions)
*   **XP & Level System**: Earn experience points (XP) for completing daily checkoffs, perfect quizzes, and diary word milestones. Advance through 10 levels from *Seedling (双葉)* to *Sakura Master (桜マスター)*.
*   **Interactive SVG Mascot**: Meet **Sakura-Chan**, an animated SVG flower companion that expresses emotions based on time (e.g., sleepy late at night) and task achievements.
*   **Celebration & Rewards**: Unlock daily rewards (freezes, XP, shields) on a sliding 7-day calendar and celebrate level advancements with animated level-up modals and confetti overlays.
*   **Dynamic Audio Synthesizer**: Enjoy retro chimes and UI sound effects synthesized dynamically using the browser's Web Audio API.

### 3. Mini-Games Playroom
*   **Word Blitz**: Match falling vocabulary words against their meanings before they hit the ground.
*   **Sakura Match**: Test memory retention on a 3D-card flipping memory grid.
*   **Sentence Scramble**: Arrange grammar block sequences correctly under a speed clock.

### 4. Milestones & Graduation
*   **Spotify-Wrapped Exporter**: Share Radial-glow custom progress card graphics exported directly using `html2canvas`.
*   **Bilingual Printable Diploma**: Graduate on Day 90 to unlock a printable landscape certificate complete with dual English-Japanese text, progress stats, and a traditional Japanese hanko seal.

### 5. Hidden Teacher Dashboard (`/teacher`)
*   Review student submissions, provide feedback, and grade diaries.
*   Manage spaced-repetition schedules, curriculum logs, and write daily announcements.
*   Log student mistakes and view mistake counts to target persistent errors.

---

## 🛠️ Tech Stack

*   **Frontend**: [Next.js 14+ (App Router)](https://nextjs.org/) & [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security, Google OAuth)
*   **Deployment**: [Vercel](https://vercel.com/)

---

## 📂 Codebase Directory Structure

```text
├── app/
│   ├── (student)/          # Protected student pages (home, day/[n], games, library, etc.)
│   ├── api/                # Secure API endpoints (XP logs, diary saves, placement scoring, seeds)
│   ├── auth/               # OAuth callback handler
│   ├── teacher/            # Protected teacher metrics and review dashboard
│   ├── layout.tsx          # Root theme providers and global layout
│   └── page.tsx            # Sign-in / landing page
├── components/             # Reusable UI widgets, mascot, and printable diploma
├── data/                   # Seed JSON files (vocab library, curriculum structure, scenarios)
├── lib/
│   ├── supabase/           # Server, Client, and Middleware Supabase initializers
│   ├── i18n/               # Localization contexts (English / Japanese translations)
│   ├── sm2.ts              # Spaced repetition algorithms (SuperMemo-2)
│   ├── sounds.ts           # Web Audio API chime tone synthesizer
│   └── xp.ts               # Experience calculator and level configurations
├── supabase/
│   ├── migrations/         # Database migrations (RLS, streak records, XP logs, SRS)
│   └── schema.sql          # Primary database schema blueprint
└── package.json            # Dependencies and script definitions
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
*   Node.js (v18+)
*   npm, pnpm, or bun
*   A Supabase project

### 2. Environment Configuration
Create a `.env.local` file in the root directory based on `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_TEACHER_EMAIL=brovaibhavkr2008@gmail.com
```

### 3. Database Initialization
Execute the SQL files inside `supabase/schema.sql` and the files in `supabase/migrations/` in order on your Supabase Database SQL Editor.

### 4. Running the App
Install dependencies:
```bash
npm install
```

Seed the curriculum and database content:
```bash
# Seed the core curriculum days & vocabulary library
npm run dev
# Then visit http://localhost:3000/api/seed in your browser to seed SQL tables.
```

Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security & Row Level Security (RLS)
The database has Row-Level Security (RLS) enabled on all tables:
*   Students can read/write only their own progress logs, vocabulary checkboxes, game scores, and streak data.
*   The teacher has override policies allowing review access, mistake logging, and announcement management based on email verification.
