"""
Generate text embeddings using Cohere Embed 4 free tier.
Used for CV-to-job cosine similarity scoring.
"""
import os
import logging
import httpx
import numpy as np
from typing import List

logger = logging.getLogger(__name__)

COHERE_API_URL = "https://api.cohere.com/v2/embed"
COHERE_MODEL = "embed-v4.0"
MAX_TEXT_LENGTH = 10_000
TIMEOUT = httpx.Timeout(30.0)


async def embed_texts(
    texts: List[str],
    input_type: str = "search_document",
) -> List[List[float]]:
    """
    Embed a list of texts using Cohere Embed 4.

    Args:
        texts: List of strings to embed.
        input_type: "search_document" for CV text, "search_query" for job descriptions.

    Returns:
        List of float vectors, one per input text.
    """
    api_key = os.environ["COHERE_API_KEY"]

    # Truncate oversized texts with a warning
    sanitized: List[str] = []
    for i, t in enumerate(texts):
        if len(t) > MAX_TEXT_LENGTH:
            logger.warning(
                f"Text at index {i} is {len(t)} chars, truncating to {MAX_TEXT_LENGTH}."
            )
            sanitized.append(t[:MAX_TEXT_LENGTH])
        else:
            sanitized.append(t)

    payload = {
        "model": COHERE_MODEL,
        "texts": sanitized,
        "input_type": input_type,
        "embedding_types": ["float"],
    }
    headers = {
        "Authorization": f"bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(COHERE_API_URL, json=payload, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(
            f"Cohere embed API returned HTTP {response.status_code}: {response.text[:200]}"
        )

    data = response.json()
    vectors: List[List[float]] = data["embeddings"]["float"]
    return vectors


async def embed_single(text: str, input_type: str = "search_document") -> List[float]:
    """
    Embed a single text string.

    Args:
        text: The string to embed.
        input_type: "search_document" for CV text, "search_query" for job descriptions.

    Returns:
        A single float vector.
    """
    vectors = await embed_texts([text], input_type=input_type)
    return vectors[0]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Compute cosine similarity between two vectors.

    Returns:
        A float in [0.0, 1.0]. Returns 0.0 if either vector is zero-length.
    """
    a = np.array(vec_a)
    b = np.array(vec_b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
