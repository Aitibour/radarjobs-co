"""
Parse raw CV text into structured skills, title, and experience summary.
Uses ai_router for LLM extraction.
"""
import json
import re
import logging
from dataclasses import dataclass, field
from typing import List

from .ai_router import ai_complete

logger = logging.getLogger(__name__)

# Common technical keywords used as a last-resort fallback for skill extraction
_TECH_KEYWORDS = re.compile(
    r"\b("
    r"python|javascript|typescript|java|kotlin|swift|go|golang|rust|c\+\+|c#|php|ruby|scala|"
    r"react|nextjs|next\.js|vue|angular|svelte|html|css|tailwind|"
    r"node\.js|nodejs|fastapi|django|flask|spring|rails|laravel|express|"
    r"postgresql|mysql|sqlite|mongodb|redis|elasticsearch|"
    r"aws|gcp|azure|docker|kubernetes|k8s|terraform|ansible|"
    r"git|github|gitlab|ci/cd|jenkins|github actions|"
    r"machine learning|deep learning|nlp|llm|openai|pytorch|tensorflow|"
    r"rest|graphql|grpc|websockets|"
    r"linux|bash|sql|nosql|microservices|api"
    r")\b",
    re.IGNORECASE,
)

_PROMPT_TEMPLATE = """\
You are a professional CV parser. Extract structured information from the CV text below.

Return ONLY a valid JSON object with exactly these keys:
- "title": string — the candidate's most recent or most relevant job title (e.g. "Senior Software Engineer")
- "location": string — the candidate's current city/country as a short location string (e.g. "London, UK" or "New York, NY"). Leave empty string "" if not found.
- "skills": array of strings — all technical and soft skills mentioned, deduplicated
- "experience_years": integer — total years of professional experience (estimate if not explicit)
- "summary": string — a 2-sentence professional summary of the candidate

Do NOT include any markdown, code fences, or explanatory text. Output raw JSON only.

CV TEXT:
---
{cv_text}
---
"""


@dataclass
class ParsedCV:
    title: str
    location: str
    skills: List[str]
    experience_years: int
    summary: str
    raw_text: str


def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences that LLMs sometimes wrap JSON in."""
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


def _fallback_skills(cv_text: str) -> List[str]:
    """Extract skills via regex when LLM JSON parsing fails."""
    matches = _TECH_KEYWORDS.findall(cv_text)
    # Deduplicate preserving order, normalise to lower-case
    seen: set = set()
    skills: List[str] = []
    for m in matches:
        key = m.lower()
        if key not in seen:
            seen.add(key)
            skills.append(m)
    return skills


async def parse_cv(cv_text: str) -> ParsedCV:
    """
    Extract structured data from raw CV text.

    Uses the AI router to call an LLM and parse the JSON response.
    Falls back to regex-based skill extraction if LLM JSON is malformed.
    """
    prompt = _PROMPT_TEMPLATE.format(cv_text=cv_text)
    raw_response = await ai_complete(prompt)

    cleaned = _strip_code_fences(raw_response)

    try:
        data = json.loads(cleaned)
        title = str(data.get("title", "Unknown"))
        location = str(data.get("location", ""))
        skills = [str(s) for s in data.get("skills", [])]
        experience_years = int(data.get("experience_years", 0))
        summary = str(data.get("summary", ""))
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning(
            f"cv_parser: LLM JSON parse failed ({exc}), falling back to regex extraction."
        )
        title = "Unknown"
        location = ""
        skills = _fallback_skills(cv_text)
        experience_years = 0
        summary = ""

    return ParsedCV(
        title=title,
        location=location,
        skills=skills,
        experience_years=experience_years,
        summary=summary,
        raw_text=cv_text,
    )
