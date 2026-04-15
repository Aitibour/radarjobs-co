"""
POST /alerts/preferences — save or update user alert preferences.
GET  /alerts/preferences — get current preferences.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, field_validator

from db.supabase import get_supabase_client
from routers.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["alerts"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AlertPreferencesRequest(BaseModel):
    min_score: int = 70
    job_titles: List[str] = []
    locations: List[str] = []
    email_enabled: bool = True

    @field_validator("min_score")
    @classmethod
    def validate_min_score(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("min_score must be between 0 and 100")
        return v


class AlertPreferencesResponse(AlertPreferencesRequest):
    user_id: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_user(user_id: Optional[str]) -> str:
    """Raise 401 if user_id is absent (unauthenticated request)."""
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required — provide a Bearer token",
        )
    return user_id


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/preferences", response_model=AlertPreferencesResponse, status_code=200)
async def save_preferences(
    body: AlertPreferencesRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
) -> AlertPreferencesResponse:
    """
    Upsert alert preferences for the authenticated user.

    Requires a valid Supabase Bearer token.
    Returns 401 if the token is missing or invalid.
    Returns 422 if min_score is out of the 0-100 range.
    """
    uid = _require_user(user_id)

    row = {
        "user_id": uid,
        "min_score": body.min_score,
        "job_titles": body.job_titles,
        "locations": body.locations,
        "email_enabled": body.email_enabled,
    }

    try:
        client = get_supabase_client()
        client.table("alert_prefs").upsert(row, on_conflict="user_id").execute()
        logger.info("alerts: upserted preferences for user_id=%s", uid)
    except Exception as exc:
        logger.error("alerts: DB upsert failed for user_id=%s — %s", uid, exc)
        raise HTTPException(status_code=500, detail="Failed to save preferences") from exc

    return AlertPreferencesResponse(**row)


@router.get("/preferences", response_model=AlertPreferencesResponse)
async def get_preferences(
    user_id: Optional[str] = Depends(get_current_user_id),
) -> AlertPreferencesResponse:
    """
    Fetch alert preferences for the authenticated user.

    Requires a valid Supabase Bearer token.
    Returns 401 if the token is missing or invalid.
    Returns 404 if no preferences have been saved yet.
    """
    uid = _require_user(user_id)

    try:
        client = get_supabase_client()
        resp = (
            client.table("alert_prefs")
            .select("*")
            .eq("user_id", uid)
            .single()
            .execute()
        )
    except Exception as exc:
        # supabase-py raises an exception when .single() finds no rows
        logger.info("alerts: no preferences found for user_id=%s — %s", uid, exc)
        raise HTTPException(
            status_code=404,
            detail="No alert preferences found for this user",
        ) from exc

    if not resp.data:
        raise HTTPException(
            status_code=404,
            detail="No alert preferences found for this user",
        )

    data = resp.data
    return AlertPreferencesResponse(
        user_id=uid,
        min_score=data.get("min_score", 70),
        job_titles=data.get("job_titles") or [],
        locations=data.get("locations") or [],
        email_enabled=data.get("email_enabled", True),
    )
