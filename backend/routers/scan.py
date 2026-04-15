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

class ScanRequest(BaseModel):
    cv_text: str
    job_title: str
    location: str = "United States"


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

@router.post("", response_model=ScanResponse)
async def run_scan(
    request: ScanRequest,
    authorization: Optional[str] = Header(None),
) -> ScanResponse:
    """
    Full pipeline: parse CV → scrape jobs → score each job → save → return.

    Authentication is optional.  If a valid Bearer JWT is present the results
    are persisted to Supabase; otherwise they are returned in-memory only.
    """
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")
    if not request.job_title.strip():
        raise HTTPException(status_code=422, detail="job_title must not be empty")

    # 1. Parse CV
    try:
        parsed_cv = cv_parser.parse_cv(request.cv_text)
    except Exception as exc:
        logger.error("scan: cv_parser failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to parse CV") from exc

    # 2. Scrape jobs
    try:
        jobs = await scraper.scrape_jobs(request.job_title, request.location)
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

    # 3. Score all jobs in parallel
    try:
        score_tasks = [
            matcher.score_match(
                cv_text=request.cv_text,
                job_description=job.get("description", ""),
                job_title=job.get("title", ""),
                company=job.get("company", ""),
                url=job.get("url", ""),
            )
            for job in jobs
        ]
        results: List[matcher.MatchResult] = await asyncio.gather(*score_tasks)
    except Exception as exc:
        logger.error("scan: matcher failed — %s", exc)
        raise HTTPException(status_code=500, detail="Job scoring failed") from exc

    # Attach source / location / salary from scraped data to results
    url_to_job = {job["url"]: job for job in jobs}

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
            )
        )

    return ScanResponse(
        total_jobs_scanned=len(jobs),
        matches=match_responses,
        cv_title=parsed_cv.title,
        cv_skills=parsed_cv.skills,
    )
