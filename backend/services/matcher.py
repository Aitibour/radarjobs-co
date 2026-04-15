"""
Score a CV against a job description.
Combines vector similarity (Cohere embeddings) + LLM keyword analysis.
"""
import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from typing import List

from .embedder import embed_single, cosine_similarity
from .ai_router import ai_complete

logger = logging.getLogger(__name__)

_PROMPT_TEMPLATE = """\
You are an expert technical recruiter. Analyse how well the candidate's CV matches the job description.

Return ONLY a valid JSON object with exactly these keys:
- "score": integer 0-100 — how strong the match is (100 = perfect fit)
- "matched_keywords": array of strings — skills/keywords present in both CV and job description
- "missing_keywords": array of strings — important requirements from the job description absent in the CV
- "summary": string — one sentence explaining the match quality

Do NOT include markdown, code fences, or any text outside the JSON object.

JOB DESCRIPTION:
---
{job_description}
---

CANDIDATE CV:
---
{cv_text}
---
"""


def _strip_code_fences(text: str) -> str:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


@dataclass
class MatchResult:
    score: int
    matched_keywords: List[str] = field(default_factory=list)
    missing_keywords: List[str] = field(default_factory=list)
    summary: str = ""
    job_title: str = ""
    company: str = ""
    url: str = ""


async def score_match(
    cv_text: str,
    job_description: str,
    job_title: str = "",
    company: str = "",
    url: str = "",
) -> MatchResult:
    """
    Score a CV against a job description and return a detailed MatchResult.

    Steps:
    1. Embed both texts in parallel (Cohere).
    2. Compute cosine similarity as a baseline vector score.
    3. Ask the LLM to analyse keyword overlap and produce a 0-100 score.
    4. Blend: final_score = 0.4 * vector_score * 100 + 0.6 * llm_score.
    5. Return fully populated MatchResult.
    """
    # Step 1 — parallel embedding: CV uses "search_document", job uses "search_query"
    cv_vec, job_vec = await asyncio.gather(
        embed_single(cv_text, input_type="search_document"),
        embed_single(job_description, input_type="search_query"),
    )

    # Step 2 — vector similarity (0.0 – 1.0)
    vector_score: float = cosine_similarity(cv_vec, job_vec)
    logger.info(f"matcher: vector_score={vector_score:.4f}")

    # Step 3 — LLM keyword analysis
    prompt = _PROMPT_TEMPLATE.format(
        job_description=job_description,
        cv_text=cv_text,
    )
    raw_response = await ai_complete(prompt)
    cleaned = _strip_code_fences(raw_response)

    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    llm_summary: str = ""
    llm_score: int = int(vector_score * 100)  # safe default

    try:
        data = json.loads(cleaned)
        llm_score = int(data.get("score", llm_score))
        matched_keywords = [str(k) for k in data.get("matched_keywords", [])]
        missing_keywords = [str(k) for k in data.get("missing_keywords", [])]
        llm_summary = str(data.get("summary", ""))
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning(
            f"matcher: LLM JSON parse failed ({exc}), using vector score only."
        )
        # Fallback: empty keyword lists, vector-only score already set above

    # Step 5 — blended final score
    final_score = int(0.4 * vector_score * 100 + 0.6 * llm_score)
    # Clamp to [0, 100]
    final_score = max(0, min(100, final_score))

    logger.info(
        f"matcher: llm_score={llm_score}, final_score={final_score} "
        f"for job_title='{job_title}' company='{company}'"
    )

    return MatchResult(
        score=final_score,
        matched_keywords=matched_keywords,
        missing_keywords=missing_keywords,
        summary=llm_summary,
        job_title=job_title,
        company=company,
        url=url,
    )
