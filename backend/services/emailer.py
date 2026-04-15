"""
Email service using Resend API (free 3K/mo, no card required).
Sends job match alert emails to users.
"""
import os
import httpx
import logging
from typing import List

from services.matcher import MatchResult

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"
FROM_EMAIL = "alerts@radarjobs.co"

# Brand colours
_TEAL_DARK = "#085041"
_TEAL_MID = "#1D9E75"
_TEAL_LIGHT = "#5DCAA5"


def _score_badge(score: int) -> str:
    """Return an inline-styled score badge."""
    if score >= 80:
        bg, label = "#16a34a", "Strong match"   # green
    elif score >= 60:
        bg, label = "#d97706", "Good match"     # amber
    else:
        bg, label = "#dc2626", "Weak match"     # red

    return (
        f'<span style="display:inline-block;padding:3px 10px;border-radius:12px;'
        f'background:{bg};color:#fff;font-size:12px;font-weight:700;letter-spacing:.5px;">'
        f'{score}% &mdash; {label}</span>'
    )


def _keywords_html(keywords: List[str], colour: str) -> str:
    if not keywords:
        return "<em style='color:#6b7280;font-size:13px;'>none</em>"
    chips = "".join(
        f'<span style="display:inline-block;margin:2px;padding:2px 8px;border-radius:10px;'
        f'background:{colour}22;color:{colour};font-size:12px;border:1px solid {colour}44;">'
        f"{kw}</span>"
        for kw in keywords[:12]  # cap chip count
    )
    return chips


def _build_html(user_name: str, matches: List[MatchResult]) -> str:
    job_cards = ""
    for m in matches:
        card = f"""
        <div style="margin-bottom:24px;padding:20px 24px;border-radius:10px;
                    border:1px solid #e5e7eb;background:#fafafa;">
          <div style="margin-bottom:10px;">{_score_badge(m.score)}</div>
          <h3 style="margin:0 0 4px;font-size:16px;color:{_TEAL_DARK};">
            {m.job_title or "Role"}
          </h3>
          <p style="margin:0 0 12px;font-size:14px;color:#374151;font-weight:600;">
            {m.company or "Company"}
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">
            <strong style="color:{_TEAL_DARK};">Matched skills:</strong><br/>
            {_keywords_html(m.matched_keywords, _TEAL_MID)}
          </p>
          <p style="margin:0 0 14px;font-size:13px;color:#4b5563;">
            <strong style="color:#9ca3af;">Skill gaps:</strong><br/>
            {_keywords_html(m.missing_keywords, "#9ca3af")}
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;font-style:italic;">
            {m.summary}
          </p>
          <a href="{m.url}"
             style="display:inline-block;padding:8px 18px;border-radius:6px;
                    background:{_TEAL_MID};color:#fff;font-size:13px;
                    font-weight:600;text-decoration:none;">
            View Job &rarr;
          </a>
        </div>
        """
        job_cards += card

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>RadarJobs Match Report</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:{_TEAL_DARK};padding:32px 36px;">
              <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:-0.5px;">
                RadarJobs
                <span style="font-weight:300;opacity:.7;">&mdash; Your Match Report</span>
              </h1>
              <p style="margin:6px 0 0;color:{_TEAL_LIGHT};font-size:14px;">
                Hi {user_name}, here are your latest job matches.
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 24px;font-size:15px;color:#374151;">
                We found <strong style="color:{_TEAL_MID};">{len(matches)} job{'s' if len(matches) != 1 else ''}</strong>
                that match your profile. Highest matches are listed first.
              </p>
              {job_cards}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You&rsquo;re receiving this because you set up job alerts on
                <a href="https://radarjobs.co" style="color:{_TEAL_MID};text-decoration:none;">RadarJobs.co</a>.<br/>
                Reply to this email to update your alert preferences.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return html


async def send_match_alert(
    to_email: str,
    user_name: str,
    matches: List[MatchResult],
    min_score: int = 70,
) -> bool:
    """
    Send a match alert email with top matching jobs.

    Filters to matches >= min_score, sorts by score descending, caps at 10.
    Uses the Resend API (RESEND_API_KEY env var required).

    Returns:
        True on success (HTTP 200/201), False otherwise.
    """
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        logger.error("emailer: RESEND_API_KEY not set — cannot send email")
        return False

    # Filter, sort, cap
    top_matches = sorted(
        [m for m in matches if m.score >= min_score],
        key=lambda m: m.score,
        reverse=True,
    )[:10]

    if not top_matches:
        logger.info("emailer: no matches above score %d for %s — skipping", min_score, to_email)
        return True  # not a failure — just nothing to send

    html_body = _build_html(user_name, top_matches)
    subject = f"RadarJobs: {len(top_matches)} new match{'es' if len(top_matches) != 1 else ''} found"

    payload = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(RESEND_API_URL, json=payload, headers=headers)

        if response.status_code in (200, 201):
            logger.info(
                "emailer: sent %d matches to %s (status %d)",
                len(top_matches),
                to_email,
                response.status_code,
            )
            return True

        logger.error(
            "emailer: Resend API returned %d for %s — %s",
            response.status_code,
            to_email,
            response.text[:300],
        )
        return False

    except httpx.RequestError as exc:
        logger.error("emailer: HTTP request failed for %s — %s", to_email, exc)
        return False
