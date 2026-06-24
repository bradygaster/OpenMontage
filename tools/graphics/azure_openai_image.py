"""Azure OpenAI image generation (gpt-image-1 via an Azure deployment).

Mirrors ``openai_image`` but targets a user's Azure OpenAI Service resource.
Azure requires that the request ``model`` be the *deployment name* the user
chose when deploying the image model in their Azure resource — not the raw
model id. Configure it with AZURE_OPENAI_IMAGE_DEPLOYMENT (or pass ``deployment``).

Note: Azure retired DALL-E 3 (March 2026); this tool targets the gpt-image
family only.
"""

from __future__ import annotations

import base64
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


class AzureOpenAIImage(BaseTool):
    name = "azure_openai_image"
    version = "0.1.0"
    tier = ToolTier.GENERATE
    capability = "image_generation"
    provider = "azure_openai"
    stability = ToolStability.BETA
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.STOCHASTIC
    runtime = ToolRuntime.API

    dependencies = []  # checked dynamically
    install_instructions = (
        "Use your Azure OpenAI Service resource:\n"
        "  AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/\n"
        "  AZURE_OPENAI_API_KEY=<key>            # or AZURE_OPENAI_AUTH=entra\n"
        "  AZURE_OPENAI_IMAGE_DEPLOYMENT=<your gpt-image deployment name>\n"
        "  pip install openai"
    )
    agent_skills = ["flux-best-practices"]  # general image gen knowledge

    capabilities = ["generate_image", "generate_illustration", "text_to_image"]
    supports = {
        "complex_instructions": True,
        "text_in_image": True,
        "multiple_outputs": True,
    }
    best_for = [
        "teams standardized on Azure / data residency requirements",
        "images with text/labels",
        "following detailed instructions accurately",
    ]
    not_good_for = ["offline generation", "budget-constrained projects at high quality"]

    input_schema = {
        "type": "object",
        "required": ["prompt"],
        "properties": {
            "prompt": {"type": "string"},
            "deployment": {
                "type": "string",
                "description": (
                    "Azure deployment name for the image model. Defaults to "
                    "AZURE_OPENAI_IMAGE_DEPLOYMENT."
                ),
            },
            "size": {
                "type": "string",
                "enum": ["1024x1024", "1536x1024", "1024x1536", "auto"],
                "default": "1024x1024",
            },
            "quality": {
                "type": "string",
                "enum": ["low", "medium", "high", "auto"],
                "default": "high",
            },
            "output_format": {
                "type": "string",
                "enum": ["png", "jpeg", "webp"],
                "default": "png",
            },
            "n": {"type": "integer", "default": 1, "minimum": 1, "maximum": 4},
            "output_path": {"type": "string"},
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=1, ram_mb=512, vram_mb=0, disk_mb=100, network_required=True
    )
    retry_policy = RetryPolicy(max_retries=2, retryable_errors=["rate_limit", "timeout"])
    idempotency_key_fields = ["prompt", "size", "quality", "deployment"]
    side_effects = ["writes image file to output_path", "calls Azure OpenAI API"]
    user_visible_verification = ["Inspect generated image for relevance and quality"]

    def get_status(self) -> ToolStatus:
        if azure_openai.is_configured():
            return ToolStatus.AVAILABLE
        return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        quality = inputs.get("quality", "high")
        n = inputs.get("n", 1)
        cost_map = {"low": 0.011, "medium": 0.042, "high": 0.167, "auto": 0.042}
        return cost_map.get(quality, 0.042) * n

    def _deployment(self, inputs: dict[str, Any]) -> str:
        return (
            inputs.get("deployment")
            or os.environ.get("AZURE_OPENAI_IMAGE_DEPLOYMENT")
            or "gpt-image-1"
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
        deployment = self._deployment(inputs)
        prompt = inputs["prompt"]
        size = inputs.get("size", "1024x1024")
        quality = inputs.get("quality", "high")
        output_format = inputs.get("output_format", "png")
        n = inputs.get("n", 1)

        try:
            client = azure_openai.build_client()
            response = client.images.generate(
                model=deployment,  # Azure: deployment name, not raw model id
                prompt=prompt,
                size=size,
                quality=quality,
                output_format=output_format,
                n=n,
            )

            image_data = base64.b64decode(response.data[0].b64_json)
            output_path = Path(inputs.get("output_path", f"generated_image.{output_format}"))
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(image_data)

        except Exception as e:
            return ToolResult(success=False, error=f"Azure OpenAI image generation failed: {e}")

        return ToolResult(
            success=True,
            data={
                "provider": "azure_openai",
                "deployment": deployment,
                "prompt": prompt,
                "output": str(output_path),
            },
            artifacts=[str(output_path)],
            cost_usd=self.estimate_cost(inputs),
            duration_seconds=round(time.time() - start, 2),
            model=deployment,
        )
