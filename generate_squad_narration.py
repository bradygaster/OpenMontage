"""Generate Azure OpenAI TTS narration for the Squad video, then derive a clean,
overlap-free schedule from the *actual* clip durations and rewrite the props so
each visual cut changes exactly when its narration line begins (perfect sync).
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from tools.tool_registry import registry

ROOT = Path("projects/squad-marketing")
PROPS = ROOT / "squad-props.json"
NARR_DIR = ROOT / "narration"
NARR_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "alloy"
INSTRUCTIONS = (
    "Confident, warm technology-product narrator. Clear and energetic, "
    "natural pacing, not rushed. Friendly but credible."
)
LEAD = 0.4   # silence before first line
GAP = 0.35   # breath between lines
TAIL = 1.5   # hold after last line

# Ordered to match the cuts in the props file.
SEGMENTS = [
    ("squad-hook", "Meet Squad — real AI agent teams for any project."),
    ("squad-problem", "Stop asking one chatbot to pretend it's a whole team."),
    ("squad-terminal",
     "One command spins up a real team: frontend, backend, tester, and lead — ready to go."),
    ("squad-specialists",
     "It's not role-play. Each specialist keeps its own context and real team memory."),
    ("squad-architecture",
     "Here's how Squad runs in production: a LangGraph brain makes the decisions, "
     "two hands do the work, and shared memory carries the evidence between every step."),
    ("squad-state",
     "Your team lives with your code — it persists, learns your codebase, and records every decision."),
    ("squad-workflow",
     "You stay in the lead: describe, route, execute, record, review."),
    ("squad-close", "Ship with your Squad."),
]

# Which cut each overlay belongs to (same order as props "overlays").
OVERLAY_CUT = ["squad-terminal", "squad-specialists", "squad-state", "squad-workflow"]


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def main() -> None:
    registry.discover()
    tts = registry.get("azure_openai_tts")
    print(f"TTS tool: {tts.name} status={tts.get_status().value}")

    # 1. Generate clips + measure.
    durations: dict[str, float] = {}
    paths: dict[str, Path] = {}
    for cut_id, line in SEGMENTS:
        out_path = NARR_DIR / f"{cut_id}.mp3"
        res = tts.execute({
            "text": line, "voice": VOICE, "format": "mp3",
            "instructions": INSTRUCTIONS, "output_path": str(out_path),
        })
        if not res.success:
            raise SystemExit(f"TTS failed for {cut_id}: {res.error}")
        durations[cut_id] = probe_duration(out_path)
        paths[cut_id] = out_path

    # 2. Build an overlap-free schedule from real durations.
    starts: dict[str, float] = {}
    t = LEAD
    for cut_id, _ in SEGMENTS:
        starts[cut_id] = round(t, 3)
        t = t + durations[cut_id] + GAP
    total_end = t - GAP + TAIL

    # Cut boundaries: each cut runs from its narration start to the next start
    # (first cut starts at 0 so the hero title is up during the lead-in).
    ids = [c for c, _ in SEGMENTS]
    boundaries: dict[str, tuple[float, float]] = {}
    for i, cut_id in enumerate(ids):
        cut_start = 0.0 if i == 0 else starts[cut_id]
        cut_end = starts[ids[i + 1]] if i + 1 < len(ids) else round(total_end, 3)
        boundaries[cut_id] = (round(cut_start, 3), round(cut_end, 3))

    print("\nSchedule:")
    for cut_id, _ in SEGMENTS:
        s = starts[cut_id]
        cs, ce = boundaries[cut_id]
        print(f"  {cut_id:20} voice@{s:6.2f}s dur={durations[cut_id]:5.2f}  cut [{cs:6.2f} -> {ce:6.2f}]")

    # 3. Rewrite props timing.
    data = json.loads(PROPS.read_text())
    for cut in data["cuts"]:
        cs, ce = boundaries[cut["id"]]
        cut["in_seconds"] = cs
        cut["out_seconds"] = ce
    # Re-time overlays to sit inside their owning cut.
    for overlay, owner in zip(data["overlays"], OVERLAY_CUT):
        cs, ce = boundaries[owner]
        overlay["in_seconds"] = round(cs + 0.4, 3)
        overlay["out_seconds"] = round(ce - 0.3, 3)
    # Wire narration. Remotion's renderer only loads assets from public/ via
    # staticFile(), so the track lives there and the prop is a relative path.
    # A project-local copy is kept for archival.
    public_path = Path("remotion-composer/public/squad-narration.mp3")
    narration_path = ROOT / "narration.mp3"
    data["audio"] = {"narration": {"src": "squad-narration.mp3", "volume": 1.0}}
    PROPS.write_text(json.dumps(data, indent=2) + "\n")
    print(f"\nUpdated props: {PROPS}")

    # 4. Assemble narration.mp3 with scheduled delays (no overlaps now).
    inputs, filters = [], []
    for idx, (cut_id, _) in enumerate(SEGMENTS):
        inputs += ["-i", str(paths[cut_id])]
        delay_ms = int(round(starts[cut_id] * 1000))
        filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[a{idx}]")
    mix = "".join(f"[a{i}]" for i in range(len(SEGMENTS)))
    fg = ";".join(filters) + f";{mix}amix=inputs={len(SEGMENTS)}:normalize=0[out]"
    cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", fg,
           "-map", "[out]", "-c:a", "libmp3lame", "-q:a", "2", str(narration_path)]
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    public_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(narration_path, public_path)
    print(f"Assembled narration: {narration_path} ({probe_duration(narration_path):.2f}s)")
    print(f"Copied for render:   {public_path}")
    print(f"Video duration target: {total_end:.2f}s")


if __name__ == "__main__":
    main()
