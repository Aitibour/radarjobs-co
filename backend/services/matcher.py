"""
Score CVs against job descriptions using a single batched Gemini call.
One API call for all jobs = no rate limits, dramatically faster than N parallel calls.
"""
import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from typing import List, Dict, Any

from .ai_router import ai_complete

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    score: int
    matched_keywords: List[str] = field(default_factory=list)
    missing_keywords: List[str] = field(default_factory=list)
    summary: str = ""
    job_title: str = ""
    company: str = ""
    url: str = ""


def _strip_fences(text: str) -> str:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


async def score_matches_batch(
    cv_text: str,
    jobs: List[Dict[str, Any]],
) -> List[MatchResult]:
    """
    Score all jobs against the CV in ONE Gemini call.
    Returns MatchResult list in the same order as `jobs`.
    Falls back to a simple keyword heuristic if LLM fails.
    """
    if not jobs:
        return []

    # Cap CV and job description lengths to keep prompt manageable
    cv_snippet = cv_text[:1500]
    jobs_block = ""
    for i, job in enumerate(jobs):
        desc = (job.get("description") or "")[:350]
        jobs_block += (
            f'JOB {i} | {job.get("title","?")} @ {job.get("company","?")}\n'
            f'URL: {job.get("url","")}\n'
            f'{desc}\n\n'
        )

    prompt = f"""\
You are a recruiter AI. Score each job below against the candidate CV.

CANDIDATE CV:
---
{cv_snippet}
---

JOBS:
---
{jobs_block}---

Return ONLY a valid JSON array — one object per job in the SAME ORDER:
[
  {{
    "i": 0,
    "score": 72,
    "matched": ["Python","AWS","Django"],
    "missing": ["Kubernetes","Terraform"],
    "summary": "Strong Python backend match; lacks DevOps tooling."
  }}
]

Rules:
- "i": the job index (0-based, same as input order)
- "score": 0-100 fit score
- "matched": up to 8 skills present in both CV and job
- "missing": up to 5 required skills absent from CV
- "summary": one concise sentence
- No markdown, no extra text — pure JSON array only.
"""

    try:
        raw = await ai_complete(prompt)
        cleaned = _strip_fences(raw)
        # Find the JSON array in the response
        m = re.search(r'\[[\s\S]*\]', cleaned)
        if not m:
            raise ValueError("No JSON array found in LLM response")
        items: List[dict] = json.loads(m.group())

        results: List[MatchResult] = []
        for item in items:
            idx = int(item.get("i", 0))
            if idx < 0 or idx >= len(jobs):
                continue
            job = jobs[idx]
            results.append(MatchResult(
                score=max(0, min(100, int(item.get("score", 50)))),
                matched_keywords=[str(k) for k in item.get("matched", [])],
                missing_keywords=[str(k) for k in item.get("missing", [])],
                summary=str(item.get("summary", "")),
                job_title=job.get("title", ""),
                company=job.get("company", ""),
                url=job.get("url", ""),
            ))

        # If LLM skipped some jobs, fill gaps with heuristic
        indexed = {r.url for r in results}
        for job in jobs:
            if job.get("url") not in indexed:
                results.append(_heuristic_score(cv_text, job))

        logger.info("matcher: batch scored %d jobs in one LLM call", len(results))
        return results

    except Exception as exc:
        logger.warning("matcher: batch LLM failed (%s) — using heuristic for all jobs", exc)
        return [_heuristic_score(cv_text, job) for job in jobs]


def _heuristic_score(cv_text: str, job: Dict[str, Any]) -> MatchResult:
    """Fast keyword-overlap score when LLM is unavailable."""
    cv_lower = cv_text.lower()
    desc = (job.get("description") or "").lower()
    title = job.get("title", "")
    company = job.get("company", "")
    url = job.get("url", "")

    # Extract meaningful words from job description
    words = re.findall(r'\b[a-z][a-z0-9+#.-]{2,}\b', desc)
    tech_words = [w for w in set(words) if len(w) > 3 and w not in {
        'that', 'with', 'this', 'from', 'your', 'will', 'have', 'able', 'more',
        'than', 'work', 'team', 'role', 'join', 'help', 'also', 'when', 'they',
    }]

    matched = [w for w in tech_words if w in cv_lower][:8]
    missing = [w for w in tech_words if w not in cv_lower][:5]
    score = min(90, max(20, int(len(matched) / max(len(tech_words), 1) * 100)))

    return MatchResult(
        score=score,
        matched_keywords=matched,
        missing_keywords=missing,
        summary=f"Keyword match: {len(matched)} of {len(tech_words)} job terms found in CV.",
        job_title=title,
        company=company,
        url=url,
    )


# Keep single-job function for any legacy callers
async def score_match(
    cv_text: str,
    job_description: str,
    job_title: str = "",
    company: str = "",
    url: str = "",
) -> MatchResult:
    results = await score_matches_batch(
        cv_text,
        [{"title": job_title, "company": company, "url": url, "description": job_description}],
    )
    return results[0] if results else MatchResult(score=50, job_title=job_title, company=company, url=url)
