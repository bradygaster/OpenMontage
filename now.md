# now.md — Session Handoff

_Last updated: 2026-06-23 by Copilot CLI session. Read this first when resuming._

## TL;DR (latest)
**Squad "How it works" end-to-end explainer video is rendered and delivered**, plus
**Impeccable is now the permanent repo-wide design standard**. See the two new sections
directly below; older Azure/video-v2 context follows.

## Impeccable design standard — done 2026-06-23
- Vendored pbakaus/impeccable (Apache-2.0, vendor-copy) into `.agents/skills/impeccable/`
  (`SKILL.md` + `reference/*.md` + `LICENSE` + `OPENMONTAGE.md` provenance note).
- Authored bridge skill `skills/core/design-system.md` — Impeccable taste adapted for
  video/motion-graphics, includes the **Pre-Render Design Gate**.
- Wired the standard repo-wide: `skills/core/remotion.md`, `skills/core/hyperframes.md`,
  all 12 `skills/pipelines/*/scene-director.md`, `skills/INDEX.md`, `AGENT_GUIDE.md`,
  `README.md`. Tests: 257 pass (same 2 pre-existing char-animation failures).

## Squad "How it works" video (narrated walkthrough) — done 2026-06-23
- Output: `projects/squad-howitworks/squad.mp4` — 122.3s, 1920x1080, H.264 + AAC.
  Copied to session `files/squad-howitworks.mp4`.
- Grounded in real `bradygaster/squad` impl (Copilot-native TS, NOT LangGraph internally):
  `SquadCoordinator` 5-step pipeline → `spawnParallel` fan-out → `.squad/` git memory.
- Narration: 10 lines via Azure `gpt-4o-mini-tts`, **voice `ash`** steered to a
  "North Carolina gentleman" via `instructions`. Reproducible:
  `PYTHONPATH=. .venv/bin/python generate_squad_howto_narration.py`.
- New hero component `remotion-composer/src/components/RequestPipeline.tsx` (request chip
  flows through 5 coordinator steps, then fans out to parallel agent cards). Wired into
  `Explainer.tsx` (`request_pipeline` cut branch, passes `sceneDurationSeconds`).
- Committed palette via `themeConfig` ONLY (no preset `theme` name) → blue accent
  `#58A6FF` (the `flat-motion-graphics` preset would force pink `#EC4899`).
- Design-gate fix: `HeroTitle.tsx` now accents the **first whole word** (was hardcoded
  first-8-chars, which split "Ship wit|h" mid-word).
- Props: `projects/squad-howitworks/squad-props.json` (10 cuts).

---

## TL;DR (Azure — earlier)
Machine is set up for OpenMontage. Azure OpenAI provider support is implemented,
provisioned, and verified live end-to-end (image + TTS + a `gpt-5.4` chat deployment).
The Squad marketing video has been **re-rendered with Azure TTS narration and a new
custom `flow_diagram` scene** (brain → 2 hands → memory, from Tamir's architecture post).
**Azure OpenAI work is complete.** A new reusable `flow_diagram` Remotion scene type was
added to the Explainer composition.

## Squad video v2 (narrated + architecture scene) — done 2026-06-23
- Output: `projects/squad-marketing/squad.mp4` — ~53s, 1920x1080, H.264 + AAC.
- Narration: 8 lines via `azure_openai_tts` (gpt-4o-mini-tts, voice `alloy`), assembled
  into `narration.mp3` and copied to `remotion-composer/public/squad-narration.mp3`.
- Sync approach: cut boundaries are derived from the *actual* TTS clip durations so each
  visual changes exactly when its line begins (see `generate_squad_narration.py`).
- New scene: `flow_diagram` cut type → `remotion-composer/src/components/FlowDiagram.tsx`
  (wired in `Explainer.tsx`). Animated brain (LangGraph) → two hands (ACA Dynamic Sessions
  / ACA Sandboxes) → memory (graph state + Git), with flowing edge pulses. Reusable.
- Source for the architecture: Tamir's Command Line post on the LangGraph + Squad + ACA
  brain/hands/graph-state design.


---

## ✅ Done

### 1. Machine setup (verified end-to-end)
- **FFmpeg** 8.1.2 (Homebrew)
- **Python venv** at repo-root `.venv/` (python3.13). System python is 3.9 — too old. Always use `.venv/bin/python`.
  - Installed in venv: core deps, `piper-tts`, `openai`, `azure-identity`, `pytest`.
- **Remotion composer** npm deps installed (`remotion-composer/`); esbuild build script approved.
- **Node**: machine default `node` is **v26 (Homebrew), which SILENTLY breaks Remotion renders** (downloads Chrome, exits 0, no file). Use **Node 22** via `fnm`. Repo pinned with `.node-version` (22) at root and in `remotion-composer/`.
  - Added `eval "$(fnm env --use-on-cd)"` to `~/.zshrc` so a fresh terminal auto-switches to Node 22 in this repo.
  - Before ANY render command: `cd <repo> && eval "$(fnm env)" && fnm use 22 && node --version` (must print v22.x).
- `.env` created from `.env.example` (no API keys yet — all optional).

### 2. Squad marketing video
- Output: `projects/squad-marketing/squad.mp4` — 30.5s, 1920x1080, H.264, ~3.2 MB.
- Zero-key motion-graphics path (Remotion "Explainer" composition fed JSON props), silent (no narration).

### 3. Azure OpenAI code support (implemented + tested)
- New tools: `tools/graphics/azure_openai_image.py` (gpt-image-1), `tools/audio/azure_openai_tts.py`.
- Shared helper: `lib/providers/azure_openai.py` (api-key OR Entra ID auth).
- Auto-discovered by the registry; `image_selector`/`tts_selector` pick them up — no selector changes.
- Env vars added to `.env` and `.env.example`:
  `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`,
  `AZURE_OPENAI_AUTH` (api_key|entra), `AZURE_OPENAI_IMAGE_DEPLOYMENT`, `AZURE_OPENAI_TTS_DEPLOYMENT`.
- Key Azure fact: the request `model` must be the **deployment name**, not the raw model id. Azure retired DALL-E 3 — use gpt-image family.
- Tests: `tests/contracts/test_phase3_contracts.py` updated (TTS catalog now lists azure_openai + doubao). 63 passed.
  - Pre-existing unrelated failures (NOT ours): `test_character_animation_pipeline.py::test_character_renderer_can_handoff_to_video_compose`, `test_runtime_presentation_contract.py::...[character-animation]`.

### 4. Azure Skills plugin prerequisites verified
- Node 26 (≥18 ✓ for npx/MCP), npx ✓, **az CLI 2.87** ✓, **azd 1.25.5** ✓.

---

## ⏭️ Next steps (resume here)

**Azure OpenAI is fully wired and verified.** Remaining items are optional follow-ups:

1. **Use Azure in a real render** — run a pipeline that calls `image_selector` /
   `tts_selector`; Azure tools are now `available` and will be offered. Confirm the
   provider menu lists them: see capability-audit command below.

2. **Optional: Entra ID auth** — currently using `AZURE_OPENAI_AUTH=api_key`. To switch
   to keyless, set `AZURE_OPENAI_AUTH=entra` (uses `az login` / managed identity via
   `DefaultAzureCredential`). The signed-in user needs the **Cognitive Services OpenAI
   User** role on the resource.

3. **Cleanup when done** — the provisioned resource costs nothing at idle but the RG can
   be removed with: `az group delete -n rg-openmontage-aoai --yes --no-wait`.

### ✅ Provisioned Azure resources (done 2026-06-23)
- Subscription: `Bradyg's Happy Work Cloud` (`e93e46f2-...`), user `bradyg@microsoft.com`.
- Resource group: **`rg-openmontage-aoai`** (eastus2).
- Account (kind=OpenAI, S0): **`openmontage-aoai-254`**,
  endpoint `https://openmontage-aoai-254.openai.azure.com/`.
- Deployments (GlobalStandard): **`gpt-image-1`** (v2025-04-15),
  **`gpt-4o-mini-tts`** (v2025-03-20), **`gpt-5.4`** (v2026-03-05, chat/LLM, cap 50).
  - NOTE: `gpt-5.5` requested but **quota=0** in this sub/region — needs a quota-increase
    request before it can be deployed. `gpt-5.4` is the newest with available quota.
  - No Azure chat/LLM *tool* exists in the codebase yet (only image + TTS tools). The
    `gpt-5.4` deployment is provisioned and ready, but wiring it into OpenMontage would
    require a new Azure LLM tool (net-new work).
- `.env` wired with endpoint, key (api_key auth), api-version `2025-04-01-preview`, and
  both deployment names.

### ✅ Live verification (done 2026-06-23)
- `azure_openai_image` -> 1024x1024 PNG (1.1 MB), cost ~$0.042. SUCCESS.
- `azure_openai_tts` -> 5.76s MP3 (gpt-4o-mini-tts, alloy, 24 kHz). SUCCESS.
- Registry status for both tools: `available`.
- Contract tests: 257 passed; only the 2 documented pre-existing character-animation
  failures remain (unrelated to Azure).

---

## Useful commands
- Render a zero-key demo: `eval "$(fnm env)" && fnm use 22 && .venv/bin/python render_demo.py focusflow-pitch`
- Capability audit: `.venv/bin/python -c "from tools.tool_registry import registry; import json; registry.discover(); print(json.dumps(registry.provider_menu(), indent=2))"`
- Contract tests: `.venv/bin/python -m pytest tests/contracts/ -q` (avoid `tests/qa/test_08_end_to_end.py` — heavy/pre-existing failure).

## Open questions for user (Azure impl) — RESOLVED
- Deployment names: `gpt-image-1` (image) and `gpt-4o-mini-tts` (TTS). Done.
- Auth: started with **API-key** auth (simplest). Entra ID available by flipping
  `AZURE_OPENAI_AUTH=entra` (see next-steps #2).
- Provider model: Azure is a **separately-selectable provider** (current design kept) —
  `image_selector`/`tts_selector` auto-discover it; it does not replace direct OpenAI.
