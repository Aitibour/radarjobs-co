"""
AI completion router — tries Gemini → Groq → OpenRouter in order.
Uses httpx async for all requests. Logs which provider was used.
"""
import os
import logging
import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

TIMEOUT = httpx.Timeout(30.0)


async def ai_complete(prompt: str) -> str:
    """Try providers in order: Gemini Flash → Groq Llama 3.3 → OpenRouter DeepSeek."""
    providers = [
        _try_gemini,
        _try_groq,
        _try_openrouter,
    ]
    errors = []
    for provider in providers:
        try:
            result = await provider(prompt)
            return result
        except Exception as e:
            errors.append(f"{provider.__name__}: {e}")
            logger.warning(f"Provider {provider.__name__} failed: {e}")
            continue
    raise HTTPException(
        status_code=503,
        detail=f"All AI providers failed. Errors: {' | '.join(errors)}",
    )


async def _try_gemini(prompt: str) -> str:
    """Call Gemini 2.0 Flash (stable) via Google Generative Language API."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(url, json=payload)

    if response.status_code == 429:
        raise RuntimeError("Gemini rate-limited (429)")
    if response.status_code != 200:
        raise RuntimeError(
            f"Gemini returned HTTP {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    logger.info("Using provider: _try_gemini")
    return text


async def _try_groq(prompt: str) -> str:
    """Call Groq with Llama 3.3 70B via OpenAI-compatible endpoint."""
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code == 429:
        raise RuntimeError("Groq rate-limited (429)")
    if response.status_code != 200:
        raise RuntimeError(
            f"Groq returned HTTP {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    text = data["choices"][0]["message"]["content"]
    logger.info("Using provider: _try_groq")
    return text


async def _try_openrouter(prompt: str) -> str:
    """Call OpenRouter with DeepSeek R1 free model."""
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": "deepseek/deepseek-r1:free",
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code == 429:
        raise RuntimeError("OpenRouter rate-limited (429)")
    if response.status_code != 200:
        raise RuntimeError(
            f"OpenRouter returned HTTP {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    text = data["choices"][0]["message"]["content"]
    logger.info("Using provider: _try_openrouter")
    return text
