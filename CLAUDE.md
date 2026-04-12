# CLAUDE.md Navix Frontend (Next.js)

> This file is automatically read by Claude Code on every session.
> Read it fully before writing a single line of code.

---

## 🧠 Project Overview

**Navix** is a SaaS web platform an AI-powered market & competitor intelligence copilot for social media. It helps marketing agencies, freelancers, and small brands:
1. Discover real competitors (10–30 accounts with confidence scores)
2. Analyze what's working in their niche (formats, hooks, CTAs, cadence)
3. Co-create brand-consistent content via a human-in-the-loop workflow
4. Build a Brand Memory that learns from feedback over time
5. Export a 2–4 week editorial calendar

---

## 🎨 Figma Access READ THIS FIRST

**You have full access to the Figma design file. Always fetch a screen from Figma before building it.**

### File
```
URL:     https://www.figma.com/design/alN6EZjApBjniPglloh7HK/Navix-Project
fileKey: alN6EZjApBjniPglloh7HK
```

### How to use it
- Use the `get_design_context` Figma tool with `fileKey: alN6EZjApBjniPglloh7HK` and the node ID before building any screen
- Extract exact colors, spacing, font sizes, border radii, and layout from the Figma node never guess
- Design system reference nodes (colors, typography, components) are the source of truth
- When in doubt about a visual detail go back to Figma and check

### The 22 Screens Node IDs

| # | Node ID | Screen | Route |
|---|---------|--------|-------|
| 1 | 13-1456 | Landing – Hero | `/` |
| 2 | 12-3235 | Landing – Features | `/` |
| 3 | 12-1634 | Landing – How It Works | `/` |
| 4 | 12-3192 | Landing – Pricing | `/` |
| 5 | 13-3561 | Landing – Footer | `/` |
| 6 | 38-1471 | Login | `/login` |
| 7 | 38-1454 | Register | `/register` |
| 8 | 12-3215 | Onboarding – Brand Kit | `/onboarding` |
| 9 | 12-3044 | Dashboard Home | `/dashboard` |
| 10 | 5-12143 | Design System – Colors | reference only |
| 11 | 12-433  | Project List | `/projects` |
| 12 | 13-1508 | Project Overview | `/projects/[id]` |
| 13 | 12-1556 | Brand Kit | `/projects/[id]/brand-kit` |
| 14 | 13-1444 | Competitor Discovery | `/projects/[id]/competitors` |
| 15 | 12-1583 | Market Analysis Brief | `/projects/[id]/analysis` |
| 16 | 9-1811  | Co-creation – Directions | `/projects/[id]/co-creation` |
| 17 | 12-1782 | Co-creation – Draft Editor | `/projects/[id]/drafts` |
| 18 | 11-394  | Feedback / Brand Memory | `/projects/[id]/drafts` (panel) |
| 19 | 9-3806  | Editorial Calendar | `/projects/[id]/calendar` |
| 20 | 5-85    | Design System – Typography | reference only |
| 21 | 9-2900  | Settings / Profile | `/settings` |
| 22 | 5-3551  | Design System – Components | reference only |

---

## ✍️ Code Quality Rules NON-NEGOTIABLE

### Rule 1: No over-engineering
Do not add abstractions, patterns, or layers that are not needed right now.
- No factory functions for things that exist once
- No generic utility types 5 levels deep
- No premature optimization
- No "just in case" code
- If you're not sure whether to abstract something don't. Do it inline first, extract later when there is actual repetition

### Rule 2: No sloppy/easy code
- No `// TODO` left unfixed
- No hardcoded values that should come from props or API
- No skipped edge cases (loading, empty, error)
- No placeholder logic that "will be replaced later"
- No commented-out code

### Rule 3: Simple is correct
- If a component can be written simply write it simply
- If logic fits in 10 lines don't split it into 3 files
- Every function does one thing
- Every file has one clear purpose
- Short, obvious variable names over long descriptive ones when context is clear

### TypeScript
- No `any` ever
- All props explicitly typed with an interface
- Return types on functions that return non-trivial values
- Use `type` for unions/primitives, `interface` for object shapes

### Styling
- Tailwind only no inline styles, no CSS modules
- Use the `cn()` utility (`clsx` + `twMerge`) to merge class strings
- Never repeat long class chains extract into a variable or variant map
- Never use raw hex values in JSX use Tailwind config tokens

### Rule 4: ZERO hardcoded colors and typography NON-NEGOTIABLE
Every color and font size in the app MUST come from the design tokens declared in `app/main.css`. Never write raw hex, rgba, or pixel values directly in components.

**Colors always use token classes:**
```
bg-primary-btn       NOT bg-[#071529]
bg-primary-900       NOT bg-[#2f2b43]
bg-primary-700       NOT bg-[#143763]
bg-primary-100       NOT bg-[#ededf1]
bg-primary-50        NOT bg-[#f6f6f8]
bg-destructive-500   NOT bg-[#f34141]
bg-destructive-600   NOT bg-[#cd3636]
bg-alpha-5           NOT bg-[rgba(47,43,67,0.05)]
bg-alpha-10          NOT bg-[rgba(47,43,67,0.1)]
text-alpha-30        NOT text-[rgba(47,43,67,0.3)]
text-alpha-60        NOT text-[rgba(47,43,67,0.6)]
border-alpha-10      NOT border-[rgba(47,43,67,0.1)]
shadow-ring          NOT shadow-[0px_0px_0px_3px_rgba(132,66,211,0.48)]
shadow-card          NOT shadow-[0px_1px_3px...]
bg-info-500          NOT bg-[#2563eb]
bg-success-500       NOT bg-[#53b483]
```

**Typography always use the Figma scale classes:**
```
text-display / text-h1 / text-h2 / text-h3 / text-h4 / text-h5 / text-h6
text-subheadline / text-body-1 / text-body-2 / text-caption-1 / text-caption-2
```
These classes set font-size + line-height + letter-spacing in one go. Combine with `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold` for weight.

**If a color or size doesn't exist as a token, add it to `app/main.css` first never inline it.**

### Rule 5: Responsive across ALL screens NON-NEGOTIABLE
Every component and page MUST be responsive across mobile (320px), tablet (768px), laptop (1024px), and desktop (1440px+). Use Tailwind breakpoints:
- Default = mobile first
- `sm:` = 640px+
- `md:` = 768px+ (tablet)
- `lg:` = 1024px+ (laptop)
- `xl:` = 1280px+ (desktop)
- `2xl:` = 1536px+

Never hardcode widths that break on smaller screens. Test mental model: "does this still work at 320px?"

### Rule 6: Animations with Framer Motion
Use `framer-motion` (already installed) for entrance animations, page transitions, and interactive feedback. Keep animations subtle and performant no gratuitous motion.

### Rule 7: Fonts
The design uses TWO fonts:
- **Inter** (`font-sans`) body text, buttons, UI elements
- **Space Grotesk** (`font-heading`) nav links, display headings, landing page titles

---

## 🧩 Reusable Component Rules

**Build components first. Build screens from components. Never duplicate.**

### The rule: if it appears more than once it's a component
Before building any screen, check `components/ui/` first. If something similar exists use it or extend it with a new variant prop.

### Component folder structure
```
components/
├── ui/                    ← pure, stateless, reusable primitives
│   ├── Button.tsx         ← all button variants (primary, secondary, ghost, danger)
│   ├── Input.tsx          ← text, password, search variants
│   ├── Badge.tsx          ← status/tag badges
│   ├── Card.tsx           ← base card wrapper
│   ├── Modal.tsx          ← reusable modal shell
│   ├── Toast.tsx          ← notification toasts
│   ├── Progress.tsx       ← job progress bar
│   ├── Avatar.tsx
│   ├── Spinner.tsx
│   ├── Divider.tsx
│   └── EmptyState.tsx     ← reusable empty/zero-state display
├── layout/                ← structural shell components
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── PageHeader.tsx
├── competitors/           ← feature-specific, composed from ui/
├── analysis/
├── co-creation/
├── brand-kit/
└── calendar/
```

### How to write a component correctly

```tsx
// ✅ Correct typed, variant-aware, reusable, clean
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const variants = {
  primary:   'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-white border border-alpha-10 text-primary hover:bg-alpha-10',
  ghost:     'text-primary hover:bg-alpha-10',
  danger:    'bg-red-500 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}
```

```tsx
// ❌ Wrong not reusable, hardcoded, no types
export function SubmitButton() {
  return (
    <button style={{ background: '#2F2B43', color: 'white', padding: '10px 20px' }}>
      Submit
    </button>
  )
}
```

### Component rules
- Always expose a `className` prop for extension
- Event handlers are props components never call APIs directly
- Use children composition over prop drilling deep data
- One component = one concern
- No component should be longer than ~100 lines. If it is, split it.

---

## 🗂️ Repository Structure

```
navix-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── brand-kit/page.tsx
│   │   │       ├── competitors/page.tsx
│   │   │       ├── analysis/page.tsx
│   │   │       ├── co-creation/page.tsx
│   │   │       ├── drafts/page.tsx
│   │   │       └── calendar/page.tsx
│   │   ├── settings/page.tsx
│   │   └── onboarding/page.tsx
│   └── (marketing)/
│       └── page.tsx
├── components/            ← see component rules above
├── lib/
│   ├── api.ts             ← Axios instance + interceptors
│   ├── auth.ts            ← JWT helpers
│   ├── cn.ts              ← clsx + twMerge utility
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProject.ts
│   └── useJob.ts          ← polls BullMQ job status
├── stores/
│   └── project.store.ts   ← Zustand (global UI state only not server data)
├── types/
│   └── index.ts           ← all shared TypeScript interfaces
└── public/
```

---

## 🎨 Design Tokens

### Colors (from Figma node 5-12143)
```ts
// tailwind.config.ts always use token names, never raw hex in JSX
colors: {
  primary:    '#2F2B43',
  accent:     '#C8F135',       // lime green verify exact from Figma
  'alpha-60': 'rgba(47,43,67,0.6)',
  'alpha-20': 'rgba(47,43,67,0.2)',
  'alpha-10': 'rgba(47,43,67,0.1)',
  white:      '#FFFFFF',
}
```

### Typography (Inter from Figma node 5-85)
```
Display:     96px / lh 100px / ls -2px
H1:          72px / lh 78px  / ls -2px
H2:          64px / lh 68px  / ls -1.28px
H3:          48px / lh 54px  / ls -0.96px
H4:          36px / lh 42px  / ls -0.648px
H5:          30px / lh 36px  / ls -0.54px
H6:          24px / lh 32px  / ls -0.384px
Subheadline: 20px / lh 28px  / ls -0.28px
Body 1:      18px / lh 26px  / ls -0.216px
Body 2:      16px / lh 24px  / ls -0.16px
Caption 1:   14px / lh 20px  / ls -0.14px
Caption 2:   12px / lh 16px  / ls -0.12px
Weights: 400 / 500 / 600 / 700 / 800
```

### Shadows
```
shadow-card: 0 1px 3px rgba(47,43,67,0.1), inset 0 -1px 0 rgba(47,43,67,0.1)
```

---

## ⚙️ Tech Stack

```json
{
  "framework": "Next.js 15 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS v3",
  "state": "Zustand (global UI only)",
  "data-fetching": "TanStack Query v5 (all server state)",
  "http": "Axios",
  "forms": "React Hook Form + Zod",
  "icons": "Lucide React",
  "font": "Inter via next/font/google",
  "cn": "clsx + tailwind-merge"
}
```

---

## 🔌 API Integration

### Base URL
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Auth
- Supabase Auth (not custom JWT) — session managed via cookies
- On `401` → redirect to `/login`
- `lib/api.ts` sends Bearer token from Supabase session

### Endpoints
```
GET   /profiles/me                           → current user profile
PATCH /profiles/me                           → update profile (onboarding data)

GET   /projects                              → list
POST  /projects                              → create
GET   /projects/:id
PATCH /projects/:id

POST  /projects/:id/brand-kit
GET   /projects/:id/brand-kit

POST  /projects/:id/competitors/discover     → returns { jobId }
GET   /projects/:id/competitors

POST  /projects/:id/analysis/run             → returns { jobId }
GET   /projects/:id/analysis

POST  /projects/:id/directions/generate      → returns { jobId }
GET   /projects/:id/directions

POST  /projects/:id/drafts/generate          → returns { jobId }
GET   /projects/:id/drafts
PATCH /projects/:id/drafts/:draftId
POST  /projects/:id/drafts/:draftId/feedback

GET   /projects/:id/calendar
POST  /projects/:id/calendar/export

GET   /jobs/:jobId/status                    → { status, progress, result?, error? }
```

### Job polling pattern (`hooks/useJob.ts`)
```ts
// Poll GET /jobs/:jobId/status every 2 seconds
// status: pending | active | completed | failed
// While active: show Progress bar, disable CTA buttons, show status message
// On completed: invalidate relevant React Query key + success toast
// On failed: error toast + retry button
```

---

## 🔄 User Flow

```
Signup → Onboarding → Competitor Discovery → Dashboard
Dashboard → New Project → Project Overview
Project steps: Brand Kit → Competitors → Analysis → Directions → Drafts → Calendar
```

### Onboarding (one-time, enforced by middleware)
- `profiles` table in Supabase stores user data (persona, handles, scraped profile)
- Auto-created on signup via DB trigger
- `onboarding_completed` flag prevents re-showing onboarding
- Middleware checks this flag: if false → force `/onboarding`, if true → block `/onboarding`
- Three personas: `creator` (streamlined flow with profile scraping), `ecommerce`, `agency`
- Creator flow: select platforms → enter handles → pick niche/country → confirm scraped profile → discover competitors
- Ecommerce/Agency flow: enter brand info → pick niche/country → discover competitors
- Profile data saved via `PATCH /profiles/me` before discovery polling starts (avoids race condition)

### Image proxy
- Instagram/TikTok block direct image hotlinking
- All external avatar images go through `/api/image-proxy?url=...` (Next.js API route)
- Used in: onboarding profile card, competitor cards

Each step shows a status indicator. Users can revisit any step.

---

## 🚦 Async Job UI Pattern

When AI job is running (competitor discovery, analysis, draft generation):
1. Full-width `Progress` bar at top of page
2. Friendly message ("Discovering competitors…")
3. CTA buttons disabled
4. On complete → success toast + data auto-refresh
5. On fail → error toast + retry button

---

## 🌐 i18n

- English only for now
- All user-facing strings in `constants/strings.ts` for future translation

---

## ✅ Definition of Done (per screen)

- [ ] Figma node fetched and matched pixel-perfectly
- [ ] Screen assembled from reusable `components/ui/` primitives
- [ ] Fully typed no `any`
- [ ] Mobile responsive (sm / md / lg / xl breakpoints)
- [ ] Loading, empty, and error states handled
- [ ] Connected to API (or clearly mocked if endpoint not ready)
- [ ] No console errors or warnings
- [ ] No duplicated code repeated UI = a component
