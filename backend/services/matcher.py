"""
Score a CV against a job description using LLM keyword analysis.
"""
import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from typing import List

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

    Uses LLM (Gemini) to analyse keyword overlap and produce a 0-100 score.
    """
    prompt = _PROMPT_TEMPLATE.format(
        job_description=job_description,
        cv_text=cv_text,
    )
    raw_response = await ai_complete(prompt)
    cleaned = _strip_code_fences(raw_response)

    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    llm_summary: str = ""
    final_score: int = 50  # safe default

    try:
        data = json.loads(cleaned)
        final_score = max(0, min(100, int(data.get("score", 50))))
        matched_keywords = [str(k) for k in data.get("matched_keywords", [])]
        missing_keywords = [str(k) for k in data.get("missing_keywords", [])]
        llm_summary = str(data.get("summary", ""))
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning(f"matcher: LLM JSON parse failed ({exc}), using default score.")

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
