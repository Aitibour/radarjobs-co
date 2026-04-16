"""
POST /scan — accepts CV text + job title + location, scrapes jobs, scores them
against the CV, saves results to Supabase, and returns the scored job list.
"""
import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

import services.cv_parser as cv_parser
import services.scraper as scraper
import services.matcher as matcher
from db.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scan"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ExtractRequest(BaseModel):
    cv_text: str


class ExtractResponse(BaseModel):
    title: str
    location: str
    skills: List[str]
    experience_years: int
    summary: str


class ScanRequest(BaseModel):
    cv_text: str
    job_title: str
    location: str = "United States"
    hours_old: int = 72  # 24 = last day, 72 = last 3 days, 168 = last week


class JobMatchResponse(BaseModel):
    job_title: str
    company: str
    url: str
    score: int
    matched_keywords: List[str]
    missing_keywords: List[str]
    summary: str
    source: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None


class ScanResponse(BaseModel):
    total_jobs_scanned: int
    matches: List[JobMatchResponse]
    cv_title: str
    cv_skills: List[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_user_id(authorization: Optional[str]) -> Optional[str]:
    """Extract a Supabase user_id from a Bearer JWT without full verification."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    try:
        import jwt  # PyJWT
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub")
    except Exception:
        return None


def _upsert_results(
    user_id: str,
    jobs: List[dict],
    results: List[matcher.MatchResult],
) -> None:
    """
    Upsert scraped jobs and match scores into Supabase.
    Called in a fire-and-forget fashion — exceptions are caught and logged.
    """
    try:
        client = get_supabase_client()

        # 1. Upsert jobs (deduplicate by url)
        job_rows = [
            {
                "url": job["url"],
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "description": job.get("description", ""),
                "source": job.get("source", ""),
                "salary_min": job.get("salary_min"),
                "salary_max": job.get("salary_max"),
                "posted_at": job.get("posted_at"),
            }
            for job in jobs
            if job.get("url")
        ]
        if job_rows:
            client.table("jobs").upsert(job_rows, on_conflict="url").execute()

        # 2. Fetch inserted job ids (url -> id mapping)
        urls = [r["url"] for r in job_rows]
        url_to_id: dict = {}
        if urls:
            resp = client.table("jobs").select("id,url").in_("url", urls).execute()
            for row in resp.data or []:
                url_to_id[row["url"]] = row["id"]

        # 3. Upsert match scores
        match_rows = []
        for result in results:
            job_id = url_to_id.get(result.url)
            if not job_id:
                continue
            match_rows.append(
                {
                    "user_id": user_id,
                    "job_id": job_id,
                    "score": result.score,
                    "matched_keywords": result.matched_keywords,
                    "missing_keywords": result.missing_keywords,
                    "summary": result.summary,
                }
            )
        if match_rows:
            client.table("matches").upsert(
                match_rows, on_conflict="user_id,job_id"
            ).execute()

        logger.info(
            "scan: upserted %d jobs, %d matches for user %s",
            len(job_rows),
            len(match_rows),
            user_id,
        )
    except Exception as exc:
        logger.warning("scan: DB upsert failed (non-fatal) — %s", exc)


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

_SCAN_TIMEOUT_SECONDS = 90  # browser gets a 504 rather than a dropped connection


@router.post("", response_model=ScanResponse)
async def run_scan(
    request: ScanRequest,
    authorization: Optional[str] = Header(None),
) -> ScanResponse:
    """
    Full pipeline: parse CV → scrape jobs → score each job → save → return.

    Authentication is optional.  If a valid Bearer JWT is present the results
    are persisted to Supabase; otherwise they are returned in-memory only.
    Hard timeout: 90 s — returns 504 instead of dropping the connection.
    """
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")
    if not request.job_title.strip():
        raise HTTPException(status_code=422, detail="job_title must not be empty")

    try:
        return await asyncio.wait_for(
            _run_scan_pipeline(request, authorization),
            timeout=_SCAN_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.error("scan: pipeline timed out after %ds", _SCAN_TIMEOUT_SECONDS)
        raise HTTPException(
            status_code=504,
            detail=f"Scan timed out after {_SCAN_TIMEOUT_SECONDS}s. Try a narrower search.",
        )


async def _run_scan_pipeline(
    request: ScanRequest,
    authorization: Optional[str],
) -> ScanResponse:
    """Inner pipeline extracted so run_scan can wrap it in wait_for."""
    # 1. Parse CV
    try:
        parsed_cv = await cv_parser.parse_cv(request.cv_text)
    except Exception as exc:
        logger.error("scan: cv_parser failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to parse CV") from exc

    # 2. Scrape jobs
    try:
        jobs = await scraper.scrape_jobs(
            request.job_title, request.location,
            results_per_site=30,
            hours_old=request.hours_old,
        )
    except Exception as exc:
        logger.error("scan: scraper failed — %s", exc)
        raise HTTPException(status_code=502, detail="Job scraping failed") from exc

    if not jobs:
        return ScanResponse(
            total_jobs_scanned=0,
            matches=[],
            cv_title=parsed_cv.title,
            cv_skills=parsed_cv.skills,
        )

    # 3. Score jobs in a single batched LLM call (cap at 15 to keep prompt fast)
    jobs_to_score = jobs[:15]
    try:
        results: List[matcher.MatchResult] = await matcher.score_matches_batch(
            cv_text=request.cv_text,
            jobs=jobs_to_score,
        )
    except Exception as exc:
        logger.error("scan: matcher failed — %s", exc)
        raise HTTPException(status_code=500, detail="Job scoring failed") from exc

    # Attach source / location / salary from scraped data to results
    url_to_job = {job["url"]: job for job in jobs_to_score}

    # 4. Sort by score descending
    results_sorted = sorted(results, key=lambda r: r.score, reverse=True)

    # 5. Persist to Supabase if user is authenticated (non-blocking on failure)
    user_id = _extract_user_id(authorization)
    if user_id:
        # Run in a separate task so DB latency doesn't block the response
        asyncio.create_task(
            asyncio.to_thread(_upsert_results, user_id, jobs, results_sorted)
        )

    # 6. Build response
    match_responses = []
    for result in results_sorted:
        job_meta = url_to_job.get(result.url, {})
        match_responses.append(
            JobMatchResponse(
                job_title=result.job_title,
                company=result.company,
                url=result.url,
                score=result.score,
                matched_keywords=result.matched_keywords,
                missing_keywords=result.missing_keywords,
                summary=result.summary,
                source=job_meta.get("source"),
                location=job_meta.get("location"),
                salary_min=job_meta.get("salary_min"),
                salary_max=job_meta.get("salary_max"),
                description=(job_meta.get("description") or "")[:3000],
            )
        )

    return ScanResponse(
        total_jobs_scanned=len(jobs),  # total scraped, not just scored
        matches=match_responses,
        cv_title=parsed_cv.title,
        cv_skills=parsed_cv.skills,
    )


@router.post("/extract", response_model=ExtractResponse)
async def extract_cv(request: ExtractRequest) -> ExtractResponse:
    """
    Parse a CV and return extracted title, location, and skills.
    Used by the frontend to pre-populate the confirm step before scanning.
    No job scraping — fast response.
    """
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")

    try:
        parsed = await cv_parser.parse_cv(request.cv_text)
    except Exception as exc:
        logger.error("extract: cv_parser failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to parse CV") from exc

    return ExtractResponse(
        title=parsed.title,
        location=parsed.location,
        skills=parsed.skills,
        experience_years=parsed.experience_years,
        summary=parsed.summary,
    )


# ---------------------------------------------------------------------------
# AI enhancement endpoints
# ---------------------------------------------------------------------------

class EnhanceCVRequest(BaseModel):
    cv_text: str
    missing_keywords: List[str]
    job_title: str = ""
    company: str = ""


class EnhanceCVResponse(BaseModel):
    enhanced_cv: str


class CoverLetterRequest(BaseModel):
    cv_text: str
    job_title: str
    company: str
    job_description: str


class CoverLetterResponse(BaseModel):
    cover_letter: str


@router.post("/enhance-cv", response_model=EnhanceCVResponse)
async def enhance_cv(request: EnhanceCVRequest) -> EnhanceCVResponse:
    """Add missing keywords naturally into the CV text using Gemini."""
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")
    if not request.missing_keywords:
        return EnhanceCVResponse(enhanced_cv=request.cv_text)

    keywords_str = ", ".join(request.missing_keywords)
    prompt = f"""You are a professional CV writer. Enhance the CV below by naturally incorporating the missing skills/keywords listed.

Rules:
- Do NOT invent fake experience or change facts
- Integrate keywords naturally where relevant (skills section, bullet points, summaries)
- Keep the same structure and format
- Add a Skills section at the top if one does not exist
- Return ONLY the enhanced CV text, no explanations

Missing keywords to add: {keywords_str}

CV:
---
{request.cv_text[:4000]}
---"""
    try:
        import services.ai_router as ai_router
        enhanced = await ai_router.ai_complete(prompt)
        return EnhanceCVResponse(enhanced_cv=enhanced.strip())
    except Exception as exc:
        logger.error("enhance_cv: failed — %s", exc)
        raise HTTPException(status_code=500, detail="CV enhancement failed") from exc


@router.post("/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(request: CoverLetterRequest) -> CoverLetterResponse:
    """Generate a tailored cover letter using Gemini."""
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")

    prompt = f"""Write a professional cover letter for the following job application.

Job Title: {request.job_title}
Company: {request.company}
Job Description:
---
{request.job_description[:2000]}
---

Candidate CV:
---
{request.cv_text[:3000]}
---

Rules:
- 3-4 paragraphs, professional tone
- Reference specific skills from the CV that match the job
- Do NOT invent experience
- Include a strong opening and closing
- Return ONLY the cover letter text, no subject line or email headers"""
    try:
        import services.ai_router as ai_router
        letter = await ai_router.ai_complete(prompt)
        return CoverLetterResponse(cover_letter=letter.strip())
    except Exception as exc:
        logger.error("cover_letter: failed — %s", exc)
        raise HTTPException(status_code=500, detail="Cover letter generation failed") from exc
