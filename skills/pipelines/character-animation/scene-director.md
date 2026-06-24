# Scene Director - Character Animation Pipeline

> **Design Quality (MANDATORY).** The scene plan sets the video's visual look. Target the
> repo-wide design bar in `skills/core/design-system.md` (Impeccable-grade, video-adapted):
> a deliberate color strategy, contrast-axis typography, layout rhythm, intentional (non-uniform)
> motion, and **zero AI-tell patterns** (no template card grids, eyebrow kickers, gradient text,
> cream/paper default backgrounds, over-rounded panels). Run the AI-slop test on every scene
> concept. Taste reference: `.agents/skills/impeccable/`.

## Goal

Produce a `scene_plan` where each scene is feasible for rigged character
animation.

## Scene Planning Fields

For each scene, include:

- character IDs,
- emotional beat,
- action sequence,
- camera/framing,
- background,
- props,
- effects,
- required assets,
- transition notes.

Use `type: "character_scene"` for rigged character acting scenes. Store
character-specific detail in `character_actions`; do not put per-scene acting
data in arbitrary metadata because the shared `scene_plan` schema rejects
unknown per-scene fields.

## Complexity Budget

Prefer fewer, stronger shots:

- one establish,
- one action beat,
- one reaction beat,
- one resolution beat.

Avoid scenes that require many unique views or complex physical contact unless
the user approved that complexity.
