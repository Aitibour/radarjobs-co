"""
POST /auth/verify — verifies a Supabase JWT and returns user info.

Supabase handles cryptographic verification server-side.  This endpoint
decodes the JWT locally (without signature check) to extract the claims
that other routers need, and also exposes a reusable Depends helper.
"""
import logging
from typing import Optional

import jwt
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class VerifyResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    email: Optional[str] = None


# ---------------------------------------------------------------------------
# Internal helper (used as Depends in other routers)
# ---------------------------------------------------------------------------

def get_current_user_id(
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    """
    FastAPI dependency that extracts the Supabase user id (JWT `sub` claim).

    Usage in a router:
        @router.post("/foo")
        async def foo(user_id: Optional[str] = Depends(get_current_user_id)):
            ...

    Returns None if no valid Bearer token is present (allows optional auth).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub")
    except jwt.exceptions.DecodeError as exc:
        logger.debug("auth: JWT decode failed — %s", exc)
        return None


def _decode_token(token: str) -> dict:
    """Decode JWT claims without signature verification."""
    return jwt.decode(token, options={"verify_signature": False})


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/verify", response_model=VerifyResponse)
async def verify_token(
    authorization: Optional[str] = Header(None),
) -> VerifyResponse:
    """
    Decode a Supabase Bearer JWT and return the extracted user claims.

    This endpoint does NOT cryptographically verify the token —
    that responsibility belongs to Supabase's Auth service / RLS policies.
    It is primarily useful for the frontend to confirm the token structure
    and retrieve the user id / email without an extra Supabase round-trip.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header with Bearer token required",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = _decode_token(token)
    except jwt.exceptions.DecodeError as exc:
        logger.warning("auth: invalid JWT — %s", exc)
        return VerifyResponse(valid=False)

    user_id: Optional[str] = payload.get("sub")
    email: Optional[str] = payload.get("email")

    if not user_id:
        logger.warning("auth: JWT has no 'sub' claim")
        return VerifyResponse(valid=False)

    logger.info("auth: verified token for user_id=%s", user_id)
    return VerifyResponse(valid=True, user_id=user_id, email=email)
