# Impeccable (vendored into OpenMontage)

**Source:** https://github.com/pbakaus/impeccable — by Paul Bakaus
**License:** Apache License 2.0 (see `LICENSE` in this folder)
**Vendored at:** main branch, SKILL.md version 3.8.0

## What was copied

- `SKILL.md` — the design skill (taste, general rules, absolute bans, AI-slop test, command map)
- `reference/*.md` — the per-command deep-dive guidance

## What was intentionally omitted

The upstream `scripts/` directory (~2 MB of Node tooling: live-browser iteration, DOM
detectors, hooks, CSP detection, palette/context generators) targets **live frontend web
apps**. OpenMontage produces **rendered video**, so that machinery does not apply and was not
vendored. References to those scripts inside `SKILL.md` (e.g. `scripts/context.mjs`,
`scripts/palette.mjs`, `live`, `hooks`, `pin`) are therefore inert here **by design**.

## How OpenMontage uses it

Do **not** follow Impeccable's frontend setup ritual. The OpenMontage entry point is
`skills/core/design-system.md`, which adapts Impeccable's *visual taste and anti-AI-tells* for
video/motion-graphics and defines a pre-render design gate. Read that first; use the files here
as the underlying taste reference.

To update: re-copy `SKILL.md` + `reference/` from upstream and re-check
`skills/core/design-system.md` for any rule reconciliations.
