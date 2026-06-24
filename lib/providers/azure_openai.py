"""Shared helpers for Azure OpenAI Service provider tools.

Azure OpenAI differs from the OpenAI platform in three ways that matter here:

1. Credentials are a *resource endpoint* + an *api-version*, not just an API key.
2. Requests target a *deployment name* (chosen by the user when they deploy a
   model in their Azure resource) instead of a raw model name. The deployment
   name is passed as the ``model`` argument to the SDK.
3. Auth can be an api-key header **or** a Microsoft Entra ID (AAD) token.

Set ``AZURE_OPENAI_AUTH=entra`` to use ``DefaultAzureCredential`` (managed
identity / az login / env credential) instead of a static key.
"""

from __future__ import annotations

import os

# Default to a preview api-version recent enough to cover both gpt-image-1
# image generation and the speech (TTS) endpoint. Override per-resource with
# AZURE_OPENAI_API_VERSION if your deployment requires a different one.
DEFAULT_API_VERSION = "2025-04-01-preview"

# Entra ID token scope for Azure OpenAI (Cognitive Services) data-plane calls.
_ENTRA_SCOPE = "https://cognitiveservices.azure.com/.default"


def using_entra_auth() -> bool:
    return os.environ.get("AZURE_OPENAI_AUTH", "api_key").strip().lower() == "entra"


def is_configured() -> bool:
    """True when enough env is present to attempt an Azure OpenAI call."""
    if not os.environ.get("AZURE_OPENAI_ENDPOINT"):
        return False
    if using_entra_auth():
        # Rely on an ambient credential (managed identity / az login).
        return True
    return bool(os.environ.get("AZURE_OPENAI_API_KEY"))


def missing_config_message() -> str:
    if not os.environ.get("AZURE_OPENAI_ENDPOINT"):
        return (
            "AZURE_OPENAI_ENDPOINT not set. Set it to your resource endpoint, "
            "e.g. https://<resource>.openai.azure.com/"
        )
    if not using_entra_auth() and not os.environ.get("AZURE_OPENAI_API_KEY"):
        return (
            "AZURE_OPENAI_API_KEY not set (and AZURE_OPENAI_AUTH is not 'entra'). "
            "Provide a key or switch to Entra ID auth."
        )
    return "Azure OpenAI is not configured."


def api_version() -> str:
    return os.environ.get("AZURE_OPENAI_API_VERSION", DEFAULT_API_VERSION)


def build_client():
    """Construct an ``AzureOpenAI`` client from environment variables.

    Raises RuntimeError with an actionable message if configuration is missing.
    """
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    if not endpoint:
        raise RuntimeError(missing_config_message())

    from openai import AzureOpenAI

    if using_entra_auth():
        try:
            from azure.identity import (
                DefaultAzureCredential,
                get_bearer_token_provider,
            )
        except ImportError as exc:  # pragma: no cover - import guard
            raise RuntimeError(
                "AZURE_OPENAI_AUTH=entra requires the azure-identity package. "
                "Install it with: pip install azure-identity"
            ) from exc

        token_provider = get_bearer_token_provider(
            DefaultAzureCredential(), _ENTRA_SCOPE
        )
        return AzureOpenAI(
            azure_endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version=api_version(),
        )

    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(missing_config_message())

    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version(),
    )
