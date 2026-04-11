---
name: mobile-first
description: Mobile-first responsive UI development for Shynese. Use when building or editing any UI>
---

# Mobile-First UI — Shynese

## Core Rule
**Always design for small screens first, then scale up.**
Never add desktop styles without first ensuring the mobile layout works.

## Tailwind Breakpoint Strategy
- Default (no prefix) = mobile (≥320px)
- `sm:` = ≥640px
- `md:` = ≥768px (tablet)
- `lg:` = ≥1024px (desktop)

**Wrong:** `grid-cols-3 sm:grid-cols-1`
**Right:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

## Layout Rules

### Spacing & Sizing
- Minimum touch target: `min-h-[44px] min-w-[44px]` for all buttons/tappable elements
- Body padding: `px-4` on mobile, `px-6 md:px-8` on larger screens
- Never use fixed widths (e.g. `w-[400px]`) without a mobile fallback (`w-full md:w-[400px]`)

### Typography
- Base font size minimum `text-base` (16px) — never smaller on mobile
- Chinese characters: always `text-2xl` or larger — never shrink below `text-xl`
- Line height: use `leading-relaxed` for readability on small screens

### Flexbox & Grid
- Default to `flex-col` on mobile, switch to `flex-row` on larger screens
- Use `gap-` instead of margins between flex/grid children
- Cards/items: `w-full` on mobile, constrained on desktop

### Overflow
- Always add `overflow-hidden` or `overflow-x-hidden` to containers that could cause horizontal scro>
- Text that might overflow: use `truncate` or `break-words` as appropriate

## Flashcard-Specific Rules (Shynese)
- Flashcard container: full width on mobile (`w-full`), max-width on desktop (`max-w-md mx-auto`)
- Chinese character display: `text-6xl` minimum on mobile
- Pinyin text: `text-lg` minimum
- Action buttons (Know / Don't Know): full width on mobile (`w-full`), side by side on desktop (`fle>

## Checklist Before Submitting Any UI Change
- [ ] Tested mentally at 375px width (iPhone SE)
- [ ] No horizontal scroll introduced
- [ ] Touch targets are at least 44px
- [ ] Chinese characters are legible (≥ text-xl)
- [ ] Fixed widths have `w-full` mobile fallback