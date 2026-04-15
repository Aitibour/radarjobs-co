#!/usr/bin/env python3
"""
Daily radar scan — called by GitHub Actions cron at 07:00 UTC.

For each user with a CV and email alerts enabled:
  1. Load their CV and alert preferences
  2. Scrape jobs for their preferred job titles + locations
  3. Score all jobs against their CV
  4. Send email alert for matches above their threshold
"""
import asyncio
import os
import sys
import logging
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv

load_dotenv()

# Ensure the backend root is on sys.path when run as a script
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("radar_scan")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _already_seen_urls(client, user_id: str) -> set:
    """
    Return the set of job URLs already stored as matches for this user,
    so we only alert on genuinely new discoveries.
    """
    try:
        resp = (
            client.table("matches")
            .select("jobs(url)")
            .eq("user_id", user_id)
            .execute()
        )
        urls = set()
        for row in resp.data or []:
            job = row.get("jobs")
            if job and job.get("url"):
                urls.add(job["url"])
        return urls
    except Exception as exc:
        logger.warning("radar_scan: could not fetch seen URLs for %s — %s", user_id, exc)
        return set()


def _upsert_new_matches(
    client,
    user_id: str,
    jobs: List[Dict[str, Any]],
    results,
) -> None:
    """Persist new jobs + match records; skip any that already exist."""
    if not results:
        return

    # Upsert jobs
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

    # Fetch url→id mapping
    urls = [r["url"] for r in job_rows]
    url_to_id: dict = {}
    if urls:
        resp = client.table("jobs").select("id,url").in_("url", urls).execute()
        for row in resp.data or []:
            url_to_id[row["url"]] = row["id"]

    # Upsert match scores
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    # Import here so dotenv has already loaded before module-level clients are created
    from db.supabase import get_supabase_client
    from services import scraper, emailer, matcher

    client = get_supabase_client()

    # ------------------------------------------------------------------ #
    # 1. Fetch all users who have a CV + email alerts enabled             #
    # ------------------------------------------------------------------ #
    try:
        prefs_resp = (
            client.table("alert_prefs")
            .select("user_id, min_score, job_titles, locations, email_enabled")
            .eq("email_enabled", True)
            .execute()
        )
        prefs_rows: List[Dict[str, Any]] = prefs_resp.data or []
    except Exception as exc:
        logger.error("radar_scan: failed to load alert_prefs — %s", exc)
        return

    if not prefs_rows:
        logger.info("radar_scan: no users with email_enabled=true found — exiting")
        return

    # Collect user_ids that actually have a CV saved
    user_ids = [r["user_id"] for r in prefs_rows]
    try:
        cvs_resp = (
            client.table("cvs")
            .select("user_id, raw_text, email, name")
            .in_("user_id", user_ids)
            .execute()
        )
        cvs_by_user: Dict[str, Dict] = {
            row["user_id"]: row for row in (cvs_resp.data or [])
        }
    except Exception as exc:
        logger.error("radar_scan: failed to load CVs — %s", exc)
        return

    # Merge prefs with CV data
    users_to_scan = [
        {**pref, **cvs_by_user[pref["user_id"]]}
        for pref in prefs_rows
        if pref["user_id"] in cvs_by_user
    ]

    logger.info("radar_scan: processing %d users with CVs + email enabled", len(users_to_scan))

    total_matches = 0
    total_emails = 0

    # ------------------------------------------------------------------ #
    # 2. Sequential loop over users (avoids hammering external APIs)       #
    # ------------------------------------------------------------------ #
    for user in users_to_scan:
        user_id: str = user["user_id"]
        cv_text: str = user.get("raw_text", "")
        to_email: str = user.get("email", "")
        user_name: str = user.get("name", "there")
        min_score: int = int(user.get("min_score", 70))
        job_titles: List[str] = user.get("job_titles") or ["Software Engineer"]
        locations: List[str] = user.get("locations") or ["United States"]

        if not cv_text.strip():
            logger.warning("radar_scan: user %s has no CV text — skipping", user_id)
            continue
        if not to_email:
            logger.warning("radar_scan: user %s has no email — skipping", user_id)
            continue

        logger.info(
            "radar_scan: scanning user %s | titles=%s | locations=%s",
            user_id, job_titles, locations,
        )

        # Fetch URLs already stored for this user so we skip duplicates
        seen_urls = _already_seen_urls(client, user_id)

        all_jobs: List[Dict[str, Any]] = []
        all_results = []

        # 3. Scrape + score for each (title, location) combination
        for title in job_titles:
            for location in locations:
                try:
                    jobs = await scraper.scrape_jobs(title, location)
                except Exception as exc:
                    logger.warning(
                        "radar_scan: scrape failed for '%s'@'%s' — %s", title, location, exc
                    )
                    continue

                # Filter out jobs we've already alerted on
                new_jobs = [j for j in jobs if j.get("url") and j["url"] not in seen_urls]
                if not new_jobs:
                    logger.info(
                        "radar_scan: no new jobs for '%s'@'%s' for user %s",
                        title, location, user_id,
                    )
                    continue

                # Score in parallel
                try:
                    score_tasks = [
                        matcher.score_match(
                            cv_text=cv_text,
                            job_description=j.get("description", ""),
                            job_title=j.get("title", ""),
                            company=j.get("company", ""),
                            url=j.get("url", ""),
                        )
                        for j in new_jobs
                    ]
                    results = await asyncio.gather(*score_tasks)
                except Exception as exc:
                    logger.warning(
                        "radar_scan: scoring failed for '%s'@'%s' user %s — %s",
                        title, location, user_id, exc,
                    )
                    continue

                all_jobs.extend(new_jobs)
                all_results.extend(results)

                # Update seen_urls for subsequent iterations this user
                for j in new_jobs:
                    seen_urls.add(j["url"])

        if not all_results:
            logger.info("radar_scan: user %s — no new matches found", user_id)
            continue

        # Deduplicate by URL across title/location combos then sort
        url_seen: set = set()
        deduped_results = []
        deduped_jobs = []
        url_to_job = {j["url"]: j for j in all_jobs}

        for result in sorted(all_results, key=lambda r: r.score, reverse=True):
            if result.url in url_seen:
                continue
            url_seen.add(result.url)
            deduped_results.append(result)
            if result.url in url_to_job:
                deduped_jobs.append(url_to_job[result.url])

        # 4. Save new matches to DB
        try:
            _upsert_new_matches(client, user_id, deduped_jobs, deduped_results)
            logger.info(
                "radar_scan: saved %d new matches for user %s", len(deduped_results), user_id
            )
        except Exception as exc:
            logger.error(
                "radar_scan: DB save failed for user %s — %s (continuing)", user_id, exc
            )

        total_matches += len(deduped_results)

        # 5. Send email if there are matches above threshold
        above_threshold = [r for r in deduped_results if r.score >= min_score]
        if above_threshold:
            success = await emailer.send_match_alert(
                to_email=to_email,
                user_name=user_name,
                matches=deduped_results,
                min_score=min_score,
            )
            if success:
                total_emails += 1
                logger.info(
                    "radar_scan: sent alert to %s (%d matches >= %d)",
                    to_email, len(above_threshold), min_score,
                )
        else:
            logger.info(
                "radar_scan: user %s — %d matches found but none >= %d threshold",
                user_id, len(deduped_results), min_score,
            )

    # ------------------------------------------------------------------ #
    # 6. Final summary                                                    #
    # ------------------------------------------------------------------ #
    logger.info(
        "radar_scan: DONE — scanned %d users, found %d total new matches, sent %d emails",
        len(users_to_scan),
        total_matches,
        total_emails,
    )


if __name__ == "__main__":
    asyncio.run(main())
