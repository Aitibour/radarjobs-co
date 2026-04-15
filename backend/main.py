"""
RadarJobs.co — FastAPI entry point.

Routers
-------
  /scan    — job scraping + CV matching
  /auth    — user registration / profile
  /alerts  — alert preferences + email dispatch

Middleware
----------
  - CORS (configured via FRONTEND_URL env var)
  - Request logging (method, path, status, duration)
"""

import logging
import os
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("radarjobs")


# ─────────────────────────────────────────────
# Lifespan (startup / shutdown)
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RadarJobs API starting up…")
    yield
    logger.info("RadarJobs API shutting down.")


# ─────────────────────────────────────────────
# App instance
# ─────────────────────────────────────────────

app = FastAPI(
    title="RadarJobs API",
    description="Backend for RadarJobs.co — CV-to-job matching and alerts.",
    version="0.1.0",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────

frontend_url: str = os.environ.get("FRONTEND_URL", "*")
origins = [frontend_url] if frontend_url != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=frontend_url != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Request logging middleware
# ─────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    start = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────

@app.get("/", tags=["health"])
async def health_check():
    """Returns service status. Used by load balancers and uptime monitors."""
    return {"status": "ok", "service": "RadarJobs API"}


# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────

from routers.scan import router as scan_router      # noqa: E402
from routers.auth import router as auth_router      # noqa: E402
from routers.alerts import router as alerts_router  # noqa: E402

app.include_router(scan_router,   prefix="/scan",   tags=["scan"])
app.include_router(auth_router,   prefix="/auth",   tags=["auth"])
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
