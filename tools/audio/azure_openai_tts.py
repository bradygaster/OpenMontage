"""Azure OpenAI text-to-speech (via an Azure deployment).

Mirrors ``openai_tts`` but targets a user's Azure OpenAI Service resource.
Azure requires the request ``model`` to be the *deployment name* the user chose
when deploying the speech model — not the raw model id. Configure it with
AZURE_OPENAI_TTS_DEPLOYMENT (or pass ``deployment``).

The ``instructions`` parameter is only honored by gpt-4o-mini-tts style
deployments; classic tts-1 / tts-1-hd deployments ignore or reject it, so it is
only sent when explicitly provided.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

from lib.providers import azure_openai
from tools.base_tool import (
    BaseTool,
    Determinism,
    ExecutionMode,
    ResourceProfile,
    RetryPolicy,
    ToolResult,
    ToolRuntime,
    ToolStability,
    ToolStatus,
    ToolTier,
)


class AzureOpenAITTS(BaseTool):
    name = "azure_openai_tts"
    version = "0.1.0"
    tier = ToolTier.VOICE
    capability = "tts"
    provider = "azure_openai"
    stability = ToolStability.EXPERIMENTAL
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.STOCHASTIC
    runtime = ToolRuntime.API

    dependencies = []
    install_instructions = (
        "Use your Azure OpenAI Service resource:\n"
        "  AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/\n"
        "  AZURE_OPENAI_API_KEY=<key>          # or AZURE_OPENAI_AUTH=entra\n"
        "  AZURE_OPENAI_TTS_DEPLOYMENT=<your speech deployment name>\n"
        "  pip install openai"
    )
    fallback = "piper_tts"
    fallback_tools = ["piper_tts"]
    agent_skills = ["openai-docs"]

    capabilities = [
        "text_to_speech",
        "voice_selection",
    ]
    supports = {
        "voice_cloning": False,
        "multilingual": True,
        "offline": False,
        "native_audio": True,
    }
    best_for = [
        "teams standardized on Azure / data residency requirements",
        "API-based production when ElevenLabs is unavailable",
    ]
    not_good_for = [
        "voice clone matching",
        "fully offline production",
    ]

    input_schema = {
        "type": "object",
        "required": ["text"],
        "properties": {
            "text": {"type": "string"},
            "voice": {
                "type": "string",
                "default": "alloy",
                "description": "Voice name (e.g. alloy, echo, fable, onyx, nova, shimmer)",
            },
            "deployment": {
                "type": "string",
                "description": (
                    "Azure deployment name for the speech model. Defaults to "
                    "AZURE_OPENAI_TTS_DEPLOYMENT."
                ),
            },
            "format": {
                "type": "string",
                "default": "mp3",
                "enum": ["mp3", "wav", "pcm"],
            },
            "instructions": {
                "type": "string",
                "description": "Optional delivery instructions (gpt-4o-mini-tts deployments only)",
            },
            "output_path": {"type": "string"},
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=1, ram_mb=256, vram_mb=0, disk_mb=50, network_required=True
    )
    retry_policy = RetryPolicy(max_retries=2, retryable_errors=["rate_limit", "timeout"])
    idempotency_key_fields = ["text", "voice", "deployment", "format"]
    side_effects = ["writes audio file to output_path", "calls Azure OpenAI API"]
    user_visible_verification = ["Listen to generated audio for intelligibility and tone"]

    def get_status(self) -> ToolStatus:
        if azure_openai.is_configured():
            return ToolStatus.AVAILABLE
        return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        return round(len(inputs.get("text", "")) * 0.000015, 4)

    def _deployment(self, inputs: dict[str, Any]) -> str:
        return (
            inputs.get("deployment")
            or os.environ.get("AZURE_OPENAI_TTS_DEPLOYMENT")
            or "tts"
        )

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        if not azure_openai.is_configured():
            return ToolResult(
                success=False,
                error=azure_openai.missing_config_message()
                + "\n"
                + self.install_instructions,
            )

        start = time.time()
        try:
            result = self._generate(inputs)
        except Exception as exc:
            return ToolResult(success=False, error=f"Azure OpenAI TTS failed: {exc}")

        result.duration_seconds = round(time.time() - start, 2)
        result.cost_usd = self.estimate_cost(inputs)
        return result

    def _generate(self, inputs: dict[str, Any]) -> ToolResult:
        from tools.analysis.audio_probe import probe_duration

        client = azure_openai.build_client()
        text = inputs["text"]
        deployment = self._deployment(inputs)
        voice = inputs.get("voice", "alloy")
        fmt = inputs.get("format", "mp3")
        output_path = Path(inputs.get("output_path", f"azure_openai_tts.{fmt}"))
        output_path.parent.mkdir(parents=True, exist_ok=True)

        kwargs: dict[str, Any] = {
            "model": deployment,  # Azure: deployment name, not raw model id
            "voice": voice,
            "input": text,
            "response_format": fmt,
        }
        if inputs.get("instructions"):
            kwargs["instructions"] = inputs["instructions"]
        if inputs.get("speed") and inputs["speed"] != 1.0:
            kwargs["speed"] = inputs["speed"]

        with client.audio.speech.with_streaming_response.create(**kwargs) as response:
            response.stream_to_file(output_path)

        audio_duration = probe_duration(output_path)

        return ToolResult(
            success=True,
            data={
                "provider": self.provider,
                "deployment": deployment,
                "voice": voice,
                "format": fmt,
                "text_length": len(text),
                "audio_duration_seconds": round(audio_duration, 2) if audio_duration else None,
                "output": str(output_path),
            },
            artifacts=[str(output_path)],
            model=deployment,
        )
