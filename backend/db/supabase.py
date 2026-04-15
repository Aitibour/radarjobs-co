"""
Supabase client factory for RadarJobs.co backend.

- get_supabase_client() — service-role client (full DB access, bypasses RLS).
  Used for background jobs: scraping, scoring, alert dispatch.
- get_anon_client() — anon-key client (respects RLS).
  Used when forwarding user JWTs for user-scoped operations.
"""

import os
from functools import lru_cache

from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Return a singleton Supabase client authenticated with the service role key.
    Bypasses Row Level Security — use only in trusted server-side contexts.
    Cached via lru_cache so the connection is reused across requests.
    """
    url: str = os.environ["SUPABASE_URL"]
    key: str = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def get_anon_client() -> Client:
    """
    Return a Supabase client authenticated with the anon (public) key.
    Respects Row Level Security policies.
    Not cached — safe to create per-request when using user JWTs.
    """
    url: str = os.environ["SUPABASE_URL"]
    key: str = os.environ["SUPABASE_ANON_KEY"]
    return create_client(url, key)


def get_user_client(jwt: str) -> Client:
    """
    Return a Supabase client scoped to a specific user JWT.
    Useful for RLS-enforced operations on behalf of an authenticated user.
    """
    url: str = os.environ["SUPABASE_URL"]
    key: str = os.environ["SUPABASE_ANON_KEY"]
    client = create_client(url, key)
    client.auth.set_session(access_token=jwt, refresh_token="")
    return client
