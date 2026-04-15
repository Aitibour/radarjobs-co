"""
Job scraper using JSearch API (RapidAPI) — covers LinkedIn, Indeed, Glassdoor, Google.
Returns a list of standardized job dicts.
"""
import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)

_JSEARCH_HOST = "jsearch.p.rapidapi.com"
_JSEARCH_URL = f"https://{_JSEARCH_HOST}/search"
_TIMEOUT = httpx.Timeout(30.0)


def _hours_old_to_date_posted(hours_old: int) -> str:
    """Map hours_old to JSearch date_posted param."""
    if hours_old <= 24:
        return "today"
    if hours_old <= 72:
        return "3days"
    return "week"


async def scrape_jobs(
    job_title: str,
    location: str,
    results_per_site: int = 15,
    hours_old: int = 72,
) -> List[Dict[str, Any]]:
    """
    Scrape jobs via JSearch API (RapidAPI).

    Args:
        job_title:         Search term / role title.
        location:          Location string (e.g. "New York, NY" or "Remote").
        results_per_site:  Max results to fetch (default 15, capped at 50).
        hours_old:         Only return jobs posted within this many hours (default 72).

    Returns:
        List of job dicts with keys: title, company, location, description,
        url, source, salary_min, salary_max, posted_at.
    """
    api_key = os.environ.get("RAPIDAPI_KEY", "")
    if not api_key:
        logger.error("scraper: RAPIDAPI_KEY not set")
        return []

    query = f"{job_title} in {location}"
    date_posted = _hours_old_to_date_posted(hours_old)

    # JSearch returns 10 results per page; request enough pages to hit results_per_site
    num_pages = max(1, min((results_per_site + 9) // 10, 5))  # cap at 5 pages (50 results)

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": _JSEARCH_HOST,
    }
    params = {
        "query": query,
        "num_pages": str(num_pages),
        "date_posted": date_posted,
        "employment_types": "FULLTIME,PARTTIME,CONTRACTOR",
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.get(_JSEARCH_URL, headers=headers, params=params)

        if response.status_code == 429:
            logger.warning("scraper: JSearch rate-limited (429)")
            return []
        if response.status_code != 200:
            logger.warning("scraper: JSearch returned HTTP %d: %s", response.status_code, response.text[:200])
            return []

        data = response.json()
        raw_jobs = data.get("data", [])

    except Exception as exc:
        logger.warning("scraper: JSearch request failed — %s", exc)
        return []

    jobs: List[Dict[str, Any]] = []
    seen_urls: set = set()

    for item in raw_jobs:
        url = item.get("job_apply_link") or item.get("job_google_link") or ""
        if not url or url in seen_urls:
            continue

        description = item.get("job_description", "")
        if not description:
            continue

        seen_urls.add(url)

        # Build location string
        city = item.get("job_city") or ""
        state = item.get("job_state") or ""
        country = item.get("job_country") or ""
        loc_parts = [p for p in [city, state] if p]
        if not loc_parts and country:
            loc_parts = [country]
        job_location = ", ".join(loc_parts) if loc_parts else location

        # Normalise salary
        def _to_int(v: Any) -> Optional[int]:
            try:
                return int(float(v))
            except (TypeError, ValueError):
                return None

        # posted_at from timestamp
        ts = item.get("job_posted_at_timestamp")
        posted_at: Optional[str] = None
        if ts:
            try:
                posted_at = datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%d")
            except Exception:
                pass

        # Detect source from publisher
        publisher = (item.get("job_publisher") or "").lower()
        if "linkedin" in publisher:
            source = "linkedin"
        elif "indeed" in publisher:
            source = "indeed"
        elif "glassdoor" in publisher:
            source = "glassdoor"
        else:
            source = "google"

        jobs.append({
            "title": str(item.get("job_title", "")),
            "company": str(item.get("employer_name", "")),
            "location": job_location,
            "description": str(description),
            "url": url,
            "source": source,
            "salary_min": _to_int(item.get("job_min_salary")),
            "salary_max": _to_int(item.get("job_max_salary")),
            "posted_at": posted_at,
        })

        if len(jobs) >= 60:
            break

    logger.info(
        "scraper: JSearch returned %d usable jobs for '%s' @ '%s' (date_posted=%s)",
        len(jobs),
        job_title,
        location,
        date_posted,
    )
    return jobs
