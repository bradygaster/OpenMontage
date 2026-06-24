"""Generate Azure OpenAI TTS narration (North Carolina gentleman, voice=ash) for the
Squad "how it works" walkthrough, then derive an overlap-free schedule from the *actual*
clip durations and rewrite the props so each visual cut changes exactly when its
narration line begins (perfect sync). Mirrors generate_squad_narration.py.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from tools.tool_registry import registry

ROOT = Path("projects/squad-howitworks")
PROPS = ROOT / "squad-props.json"
NARR_DIR = ROOT / "narration"
NARR_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "ash"
INSTRUCTIONS = (
    "A warm, refined North Carolina gentleman. Soft, genteel Southern accent — "
    "unhurried and gracious, with smooth drawled vowels, but understated and "
    "professional, never a caricature. Confident technology narrator: clear, "
    "measured, and easy on the ear."
)
LEAD = 0.4   # silence before first line
GAP = 0.5    # breath between lines
TAIL = 1.6   # hold after last line

# Ordered to match the cuts (by id) in the props file.
SEGMENTS = [
    ("hero",
     "When you hand a request to Squad, it doesn't go to one chatbot. It goes to a whole team."),
    ("whatis",
     "Squad is a persistent A-I development team that lives right inside your git repository, built on GitHub Copilot."),
    ("arch",
     "It comes in three layers. A coordinator that decides who does what. Specialist agents that do the work in parallel. "
     "And shared memory — a dot-squad folder, committed to git."),
    ("arrive",
     "It begins with a request. Mention Squad in Copilot chat, run it from the command line, "
     "or let it pick up a labeled GitHub issue all on its own."),
    ("pipeline",
     "Inside the coordinator, your request runs a five-step pipeline. "
     "A fast-path check answers the simple questions instantly — for free. "
     "It picks a tier, sizing up how much firepower the task needs. "
     "It matches a route: by name, by domain, or by skill. "
     "It decides — one agent, or a whole team. "
     "Then it fans them out, working in parallel."),
    ("execute",
     "Every agent wakes up by reading its charter, its own history, and the team's shared decisions — "
     "so it already knows your conventions."),
    ("tools",
     "As they work, the agents record decisions, save what they learn, and can hand subtasks to one another."),
    ("scribe",
     "A silent agent, the Scribe, quietly merges every decision into shared memory. "
     "And if one agent stumbles, it never blocks the others."),
    ("compound",
     "Because it all lives in git, knowledge compounds. Clone the repository, and you inherit everything the team has learned."),
    ("close",
     "That's Squad. A team that remembers — working in parallel, on your terms."),
]


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
    print(f"TTS tool: {tts.name} status={tts.get_status().value}  voice={VOICE}")

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
        print(f"  {cut_id:10} {durations[cut_id]:5.2f}s")

    # Overlap-free schedule from real durations.
    starts: dict[str, float] = {}
    t = LEAD
    for cut_id, _ in SEGMENTS:
        starts[cut_id] = round(t, 3)
        t = t + durations[cut_id] + GAP
    total_end = t - GAP + TAIL

    ids = [c for c, _ in SEGMENTS]
    boundaries: dict[str, tuple[float, float]] = {}
    for i, cut_id in enumerate(ids):
        cut_start = 0.0 if i == 0 else starts[cut_id]
        cut_end = starts[ids[i + 1]] if i + 1 < len(ids) else round(total_end, 3)
        boundaries[cut_id] = (round(cut_start, 3), round(cut_end, 3))

    print("\nSchedule:")
    for cut_id, _ in SEGMENTS:
        cs, ce = boundaries[cut_id]
        print(f"  {cut_id:10} voice@{starts[cut_id]:6.2f}s dur={durations[cut_id]:5.2f}  cut [{cs:6.2f} -> {ce:6.2f}]")

    # Rewrite props timing.
    data = json.loads(PROPS.read_text())
    by_id = {c["id"]: c for c in data["cuts"]}
    for cut_id in ids:
        cs, ce = boundaries[cut_id]
        by_id[cut_id]["in_seconds"] = cs
        by_id[cut_id]["out_seconds"] = ce

    public_path = Path("remotion-composer/public/squad-howto-narration.mp3")
    narration_path = ROOT / "narration.mp3"
    data["audio"] = {"narration": {"src": "squad-howto-narration.mp3", "volume": 1.0}}
    PROPS.write_text(json.dumps(data, indent=2) + "\n")
    print(f"\nUpdated props: {PROPS}")

    # Assemble narration.mp3 with scheduled delays.
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
    print(f"\nAssembled narration: {narration_path} ({probe_duration(narration_path):.2f}s)")
    print(f"Copied for render:   {public_path}")
    print(f"Video duration target: {total_end:.2f}s")


if __name__ == "__main__":
    main()
