---
title: "Levels and the island"
description: "XP, levels, the welcome bonus and the low-poly 3D island."
---

# Levels and the island

## XP and levels

| Rule | Value |
|---|---|
| XP per day of freedom added | `XP_PER_DAY = 10` |
| Bonus for saving two months in a row | `STREAK_BONUS_XP = 20` |
| Welcome bonus for new accounts | `WELCOME_BONUS_XP = 260` |
| First level-up after onboarding | `FIRST_LEVEL_XP = 300` |
| Each next level-up | 25% more, rounded to 50 (300, 400, 450, 600, 750, …) |
| Levels | 1 – 20 (5 tiers × 4 slots) |

- Level-up costs are counted **from the starting level**, so the first upgrade comes just as fast whatever tier you start in.
- The **welcome bonus** puts new accounts at 260 / 300 XP: the first month they accept (≥ ~66 RON with typical values) levels them up.
- **The level never goes down.** `profiles.start_level` keeps the highest starting level; a new statement or a lower salary can lower days of freedom, never the level.

## Four slots, one per level

Each level upgrades one slot, in this order: **home → transport → food → extras**.

| Tier | Home | Transport | Food | Extras |
|---|---|---|---|---|
| 1 | A tent | The bus | Canned food | Nothing extra |
| 2 | A small rented flat | A bike | Simple home cooking | An old TV |
| 3 | A family house | An old car | Good groceries | A garden |
| 4 | A modern house | A newer car | Eating out | A garden with a swing |
| 5 | A villa | A luxury car | A private chef | A pool |

## The level-up moment

When the level is higher than `profiles.last_seen_level`, Home shows the **level-up overlay** with the new slot popping in with sparkles; `markLevelSeen()` records it so it plays once.

## The island (three.js)

`components/scene/`, built with **three.js** and **@react-three/fiber**, from primitives only (boxes, cones, cylinders): no model files.

| File | Job |
|---|---|
| `lifestyle-scene.tsx` | Canvas, camera fit, lights, idle turn, drag to spin |
| `slots/home.tsx`, `transport.tsx`, `food.tsx`, `extras.tsx` | each slot at tiers 1–5 |
| `ground.tsx`, `parts.tsx` | the island and shared low-poly parts |
| `scene-fallback.tsx` | a 2D version with icons when WebGL isn't available |

Details worth knowing:

- **Orthographic camera**, fitted to the box: a square box (landing, reveal) or a wider 4:3 box on Home.
- **Drag left/right** spins the island; a flick slows down with friction; the idle turn resumes 2 s later. Vertical swipes still scroll the page.
- Rendering **pauses when the island is off screen** (IntersectionObserver), to save battery.
- Loaded only in the browser (`next/dynamic`, `ssr: false`), in its own chunk.
