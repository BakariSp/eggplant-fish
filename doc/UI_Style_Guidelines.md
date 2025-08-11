# UI Style Guidelines

## Mobile-First Principle
- Design for small screens first (360–400px width), then enhance progressively for tablets and desktop.
- Use fluid layouts and avoid fixed heights; allow content to wrap.
- Respect safe areas on iOS: use `.safe-x` and `.safe-y` utilities.

## Brand
- Primary: `#D5BC82` (brand-500)
- Tints/Shades (defined in `app/globals.css`):
  - `--brand-50`: #FBF8EF
  - `--brand-100`: #F7F1DF
  - `--brand-200`: #EFE4BF
  - `--brand-300`: #E7D79F
  - `--brand-400`: #DECB87
  - `--brand-500`: #D5BC82
  - `--brand-600`: #C8AA67
  - `--brand-700`: #B1924D
  - `--brand-800`: #8F743C
  - `--brand-900`: #6C572B

## Tone
- Cute, soft, comfortable, friendly.
- Roundness: use `rounded-lg` to `rounded-2xl`.
- Depth: `.soft-shadow` utility only; no harsh shadows.

## Typography
- H1: 24–32px mobile; 32–40px desktop. Bold with tight tracking.
- H2: 18–20px.
- Body: 14–16px.
- Max width: keep content under `max-w-4xl` and generous line height.

## Spacing
- Base unit: 8px scale.
- Small screens: page padding `px-4` to `px-5`; increase to `md:px-8` / `lg:px-12` on large screens.
- Cards: padding 16–24px; gap 12–16px.
- Sections: margin-top 24–32px.

## Surfaces
- Backgrounds: white or `--brand-50` with `brand-gradient` wrapper for hero.
- Borders: `--brand-100` / `--brand-200`.

## Buttons
- Primary: background `--brand-500`, white text, `rounded-lg`, `.soft-shadow`.
- Hover: darken to `--brand-600`; Focus: ring `--brand-300`.

## Inputs
- `rounded-lg`; focus ring `--brand-300`; large targets (min height 40px).

## Components
- Card: `rounded-2xl border border-[color:var(--brand-200)] bg-white soft-shadow`.
- Lost Banner: red background, white text, rounded, prominent but compact.
- Avatar: circular image with 3–4px white border and soft outer glow.

## Accessibility
- Contrast >= 4.5:1 for text.
- Clear focus states, proper semantics.

## Motion
- Subtle transitions (<=200ms, ease-out). Use opacity/transform only.

## Layout & Implementation
- Mobile-first sections: Hero, Pet Memories, Product Info, Support. Keep structure shallow (avoid nested cards/containers).
- Use brand gradient wrapper for the page background; content constrained by `max-w-4xl`.
- All tokens live in `app/globals.css`; reference via `var(--brand-*)`.
- For new components, start with mobile layout, then add `md:` classes.

## Framework-first Workflow
- Start with unstyled primitives in `components/ui/` (`Button`, `Input`) and layout wrappers in `components/layout/` (`Container`, `Section`).
- Build page structure and flows first (forms, navigation) using these primitives.
- Toggle Wireframe mode by appending `?wf=1` to any page URL to review spacing/structure without visual noise.
- Once layout/functionality is approved, apply visuals by using brand tokens and utilities (`.soft-shadow`, brand colors) on each section.

