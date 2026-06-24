# Scene Director - Clip Factory Pipeline

> **Design Quality (MANDATORY).** The scene plan sets the video's visual look. Target the
> repo-wide design bar in `skills/core/design-system.md` (Impeccable-grade, video-adapted):
> a deliberate color strategy, contrast-axis typography, layout rhythm, intentional (non-uniform)
> motion, and **zero AI-tell patterns** (no template card grids, eyebrow kickers, gradient text,
> cream/paper default backgrounds, over-rounded panels). Run the AI-slop test on every scene
> concept. Taste reference: `.agents/skills/impeccable/`.

## When To Use

You are planning how each selected clip will be framed and packaged for its destination platform. This is where clip viability gets proven or disproven.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/scene_plan.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["script"]["script"]`, `state.artifacts["idea"]["brief"]` | Selected clips and platform goals |
| Tools | `frame_sampler`, `scene_detect` | Visual checks and boundary inspection |
| Playbook | Active style playbook | Layout language and safe zones |

## Process

### 1. Choose The Right Frame For Each Clip

Do not default every clip to `9:16`.

Use:

- `9:16` when a face-first crop works,
- `1:1` when speaker plus context both matter,
- `16:9` when slides, demos, or multi-speaker width are essential.

OpenMontage does not yet have first-class auto-reframe. If a vertical crop is weak, plan a safer aspect ratio instead of pretending the crop will work.

### 2. Plan First-Second Composition

For each clip, define:

- what the viewer sees on frame 1,
- where hook text can safely appear,
- where subtitles can live,
- whether the speaker needs a punch-in or whether the original framing is already good.

### 3. Standardize The Batch

Use the scene plan to lock series consistency:

- same top hook zone,
- same subtitle zone,
- same watermark / brand area,
- same lower-third logic.

### 4. Store Reframe Detail In Metadata

The schema is generic, so store richer layout notes in `scene_plan.metadata`.

Recommended metadata keys:

- `clip_layouts`
- `safe_zones`
- `crop_variants`
- `speaker_positions`
- `platform_variants`

### 5. Use Scenes To Represent Deliverables

Each scene should map to one clip variant or one clip family deliverable. Keep `description` human-readable and use `required_assets` for hook overlays, lower thirds, or branded frames.

### 6. Quality Gate

- every clip has a platform-aware framing plan,
- hook and subtitle zones do not collide,
- weak vertical crops are downgraded honestly,
- the batch will feel visually consistent when rendered together.

## Common Pitfalls

- Center-cropping a wide shot and calling it vertical optimization.
- Ignoring slide or screen-share content while focusing only on faces.
- Letting each clip invent its own layout.
- Forgetting that the first frame determines whether a viewer keeps watching.
