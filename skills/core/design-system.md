# Design System Skill — Impeccable-grade Visuals (MANDATORY)

## When to Use

**Always, for any video or presentation produced by this fork.** Read this before authoring
*any* visual: Remotion components/scenes, HyperFrames HTML, generated diagrams, title cards,
charts, lower-thirds, and image-generation prompts. This is the repo-wide design bar — not an
optional polish step.

> The complaint this skill exists to kill: *"it looks like every other framework — boring and
> normal."* If a viewer could glance at a frame and think "AI/template made that," it failed.

## Source of Truth

This skill adapts **Impeccable** (`.agents/skills/impeccable/`, Apache-2.0, by Paul Bakaus)
for **video and motion graphics**. Impeccable is the taste engine; this file is the
OpenMontage translation layer.

- **Taste & anti-AI-tells:** `.agents/skills/impeccable/SKILL.md` → *General rules*, *Absolute
  bans*, *The AI slop test*. **Read these.** They apply almost verbatim to video frames.
- **Deep dives (read the matching one when relevant):**
  `reference/typeset.md` (type), `reference/colorize.md` (color), `reference/layout.md`
  (spacing/rhythm), `reference/animate.md` (motion), `reference/bolder.md` /
  `reference/overdrive.md` (amplify bland work), `reference/distill.md` (cut clutter),
  `reference/delight.md` (memorable touches), `reference/critique.md` (review rubric).

### What to IGNORE from Impeccable (it targets live web apps, not video)

Do **not** run Impeccable's frontend setup ritual or web-only machinery:

- ❌ `scripts/context.mjs`, `init`, `PRODUCT.md`/`DESIGN.md` bootstrapping, `live` browser
  iteration, `hooks`, `pin`. There is no live dev server or DOM to iterate against — frames
  are rendered headlessly.
- ❌ Detectors/commands for `audit` (a11y/perf), `adapt` (responsive breakpoints),
  `optimize` (runtime perf), CSP. Video has one canvas (1920×1080) and no user input.
- ✅ Everything about **type, color, layout, hierarchy, motion intent, and anti-tells** —
  that is exactly what we want, and it transfers directly.

## The Standard (video-adapted)

### Color
- Use **OKLCH**. Commit to a deliberate **color strategy** (restrained / committed / full-palette
  / drenched) — pick before picking colors. Don't ship "one accent on neutral" by reflex.
- **No cream/sand/beige/paper default bg.** That warm near-white band is the saturated 2026 AI
  tell. Carry warmth via accent + type + imagery, not a tinted-white body.
- **Tint your neutrals** toward the brand hue (chroma 0.005–0.015). No pure `#000`/`#fff`/flat gray.
- **Legibility at playback distance** replaces the web 4.5:1 minimum: aim higher. Text over
  footage/gradients needs a scrim, plate, or shadow. Body text never muted-gray on tint.
- **Banned:** gradient text (`background-clip:text`), default glassmorphism, lazy purple→blue
  "AI gradient."

### Typography
- Pair on a **contrast axis** (serif+sans, geometric+humanist) or one family in multiple weights.
  Never two near-identical sans.
- Display letter-spacing floor **≥ -0.04em** (tighter = letters touch = cramped). Display size
  ceiling ~96px equivalent — bigger is shouting, not designing.
- Use real type hierarchy (size + weight + spacing), not size alone. `text-wrap: balance` on
  big headings.
- **At video scale:** keep critical text inside the title-safe area (≤90% width / center 90%).
  Min on-screen body ≈ 28–32px at 1080p. Hold text long enough to read twice.

### Layout & Composition
- **1920×1080 safe zones:** nothing essential outside the inner 90%. Respect optical margins.
- Vary spacing for **rhythm**; build a real spatial scale. Asymmetry and negative space beat
  centered-everything.
- **Cards are the lazy answer.** Identical card grids are a tell. Use them only when truly the
  best affordance; nested cards are always wrong.
- Build a **semantic z-index scale** (bg → content → overlay → caption → toast), never 9999.

### Motion (RECONCILED for motion graphics)
Impeccable's "no bounce/elastic, ease-out-expo only" is a *UI* rule. **Motion graphics override
it:** expressive easing (spring, measured overshoot, anticipation, secondary action) is craft
here — *when intentional and choreographed*. What still holds:
- **Kill the uniform-entrance reflex.** The tell isn't motion; it's the *identical* fade-up
  applied to every element/scene. Each reveal should fit what it reveals (stagger, mask, draw-on,
  scale-from-anchor). Vary it.
- **Motion is part of the build, not an afterthought.** Ease primarily out, with exponential-ish
  curves as the default; reach for spring/overshoot deliberately, not everywhere.
- **Headless-render trap (critical for Remotion):** never gate content visibility on a
  class-triggered transition — transitions can stall in headless Chrome and the frame ships
  blank. Animate from an already-visible default; drive everything off the frame clock
  (`useCurrentFrame`), not CSS `transition`/`@keyframes` time.
- Premium materials beyond transform/opacity: blur, mask, clip-path, glow — when they earn it
  and stay smooth.

### Absolute Bans (carry over from Impeccable; refuse-and-rewrite)
- Side-stripe accent borders (>1px colored `border-left/right`).
- Gradient text. Default glassmorphism. The hero-metric template (big number + tiny label +
  gradient). Identical icon+heading+text card grids.
- **Tiny uppercase wide-tracked eyebrow** above every section/scene (the kicker reflex).
- **Numbered section markers (01/02/03)** as default scaffolding — only when it's a real sequence.
- Ghost-card pattern (1px border + ≥16px soft shadow on the same element). Over-rounded radius
  (>16px on cards/panels). Hand-drawn/sketchy SVG illustration as a fallback. Diagonal
  `repeating-linear-gradient` stripe backgrounds. Text that overflows its container.

### The AI Slop Test + Category-Reflex Check
Before shipping a look, run both altitudes from Impeccable's SKILL.md:
1. **First-order:** could someone guess the theme/palette from the *topic alone*? If yes, you
   took the first training-data reflex. Rework.
2. **Second-order:** could they guess it from *topic + obvious anti-reference* ("AI tool that's
   not SaaS-cream → editorial-typographic")? If yes, you took the trap one tier deeper. Rework
   until neither is obvious.

## Pre-Render Design Gate (run before every final render)

Treat this as a quality gate, not a suggestion. Sample 4–8 representative frames (use the QA /
frame-extraction tooling, e.g. `character-animation-qa` or ffmpeg stills) and check:

- [ ] **Color strategy** is deliberate and named; no cream/paper default; neutrals tinted; OKLCH.
- [ ] **Type** pairs on a contrast axis; display tracking ≥ -0.04em; real hierarchy; legible at
      playback size; inside title-safe area.
- [ ] **Layout** uses rhythm + negative space; no identical-card grid; nothing critical outside
      inner 90%.
- [ ] **Motion** is varied and intentional (no uniform fade-up reflex); no headless-blank risk
      (frame-clock driven, visible defaults).
- [ ] **Zero absolute-ban patterns** present (scan the list above).
- [ ] **AI slop test passes** at both altitudes.

If any box fails, fix before render. For a structured review, apply
`.agents/skills/impeccable/reference/critique.md` to the storyboard/frames.

## Command Vocabulary (mental models when authoring)

Use these as design *moves*, not literal CLI commands:

| Move | When | Reference |
|------|------|-----------|
| `bolder` | A scene reads safe/bland/template-y | `reference/bolder.md` |
| `overdrive` | A hero/opener should feel technically extraordinary | `reference/overdrive.md` |
| `typeset` | Type hierarchy is flat or fonts are generic | `reference/typeset.md` |
| `colorize` | Palette feels gray/flat/monochrome-by-accident | `reference/colorize.md` |
| `layout` | Spacing/rhythm/alignment is off | `reference/layout.md` |
| `animate` | Motion is missing or mechanical | `reference/animate.md` |
| `distill` | Frame is cluttered; cut to essence | `reference/distill.md` |
| `delight` | Add one memorable, on-brand touch | `reference/delight.md` |
| `critique` | Review storyboard/frames against the rubric | `reference/critique.md` |

## Relationship to Other Skills

- `skills/core/remotion.md` and `skills/core/hyperframes.md` (the runtime skills) both require
  this standard — it is the design layer above whichever runtime renders.
- Complements existing Layer-3 design skills (`visual-style`, `web-design-guidelines`,
  `tailwind-design-system`, `framer-motion`, `gsap-*`): those teach *mechanics*; this skill and
  Impeccable set the *taste bar* and the anti-tell guardrails.
- Generation prompts (image/diagram) should encode these principles too — a generated asset that
  trips an absolute ban is as much a failure as hand-authored CSS that does.
