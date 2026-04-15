"""
Job scraper using JobSpy — scrapes LinkedIn, Indeed, Glassdoor, Google concurrently.
Returns a list of standardized Job dicts.
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

_SITES = ["linkedin", "indeed", "glassdoor", "google"]
_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="jobspy")


def _scrape_site(
    site: str,
    job_title: str,
    location: str,
    results_per_site: int,
    hours_old: int = 72,
) -> List[Dict[str, Any]]:
    """
    Synchronous per-site scrape. Runs inside a ThreadPoolExecutor worker.
    Returns a list of standardised job dicts, or [] on failure.
    """
    try:
        from jobspy import scrape_jobs as _scrape  # type: ignore

        kwargs: dict = {
            "site_name": [site],
            "search_term": job_title,
            "location": location,
            "results_wanted": results_per_site,
            "country_indeed": "USA",
        }
        try:
            import inspect
            sig = inspect.signature(_scrape)
            if "hours_old" in sig.parameters:
                kwargs["hours_old"] = hours_old
        except Exception:
            pass  # older jobspy — skip hours_old

        df = _scrape(**kwargs)

        if df is None or df.empty:
            logger.info("scraper: %s returned 0 results", site)
            return []

        jobs: List[Dict[str, Any]] = []
        for _, row in df.iterrows():
            # Safely extract a value that may be NaN / None / missing
            def _get(col: str, default: Any = None) -> Any:
                if col not in row.index:
                    return default
                val = row[col]
                # pandas NaN/NaT → None
                try:
                    import math
                    if val is None:
                        return default
                    if isinstance(val, float) and math.isnan(val):
                        return default
                except (TypeError, ValueError):
                    pass
                return val if val is not None else default

            description = _get("description", "")
            # Skip jobs with no description — not useful for matching
            if not description:
                continue

            # Normalise salary to int or None
            def _to_int(v: Any) -> Optional[int]:
                try:
                    return int(float(v))
                except (TypeError, ValueError):
                    return None

            posted_raw = _get("date_posted")
            posted_at: Optional[str] = str(posted_raw) if posted_raw is not None else None

            jobs.append(
                {
                    "title": str(_get("title", "")),
                    "company": str(_get("company", "")),
                    "location": str(_get("location", "")),
                    "description": str(description),
                    "url": str(_get("job_url", "")),
                    "source": site,
                    "salary_min": _to_int(_get("min_amount")),
                    "salary_max": _to_int(_get("max_amount")),
                    "posted_at": posted_at,
                }
            )

        logger.info("scraper: %s returned %d usable jobs", site, len(jobs))
        return jobs

    except Exception as exc:
        logger.warning("scraper: site '%s' failed — %s", site, exc)
        return []


async def scrape_jobs(
    job_title: str,
    location: str,
    results_per_site: int = 15,
    hours_old: int = 72,
) -> List[Dict[str, Any]]:
    """
    Scrape jobs from LinkedIn, Indeed, Glassdoor, and Google concurrently.

    Each site is scraped in a separate ThreadPoolExecutor worker (JobSpy is
    synchronous).  Results are merged, deduplicated by URL, and capped at 60.

    Args:
        job_title:         Search term / role title.
        location:          Location string (e.g. "New York, NY" or "Remote").
        results_per_site:  Max results requested from each board (default 15).
        hours_old:         Only return jobs posted within this many hours (default 72).

    Returns:
        List of job dicts with keys: title, company, location, description,
        url, source, salary_min, salary_max, posted_at.
    """
    loop = asyncio.get_event_loop()

    # Fan-out: one async task per site, each backed by a thread
    tasks = [
        loop.run_in_executor(
            _EXECUTOR,
            _scrape_site,
            site,
            job_title,
            location,
            results_per_site,
            hours_old,
        )
        for site in _SITES
    ]

    results = await asyncio.gather(*tasks, return_exceptions=False)

    # Merge + deduplicate by URL
    seen_urls: set = set()
    merged: List[Dict[str, Any]] = []

    for site_jobs in results:
        for job in site_jobs:
            url = job.get("url", "").strip()
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            merged.append(job)

            if len(merged) >= 60:
                break
        if len(merged) >= 60:
            break

    logger.info(
        "scraper: total %d unique jobs across %d sites for '%s' @ '%s'",
        len(merged),
        len(_SITES),
        job_title,
        location,
    )
    return merged
