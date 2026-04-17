# Job Detail Page + AI Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a job detail page with side-by-side CV/JD view, AI CV enhancement, cover letter generation, PDF/Word downloads, and save/applied status tracking.

**Architecture:** Scan results store full job data (including description) in sessionStorage. Clicking a job card navigates to `/scan/job?url=...` which reads from sessionStorage. AI features call new backend endpoints. Downloads are client-side via jspdf and docx packages. Status (saved/applied) persists to localStorage and optionally Supabase.

**Tech Stack:** Next.js 14 App Router, FastAPI, Gemini 2.5 Flash, jspdf, docx, Supabase, Tailwind CSS, clsx

---

### Task 1: Add `description` to backend scan response + new AI endpoints

**Files:**
- Modify: `backend/routers/scan.py`

- [ ] **Step 1: Add description to JobMatchResponse and wire AI endpoints**

In `backend/routers/scan.py`, make these changes:

1. Add `description: Optional[str] = None` to `JobMatchResponse`:
```python
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
    description: Optional[str] = None
```

2. In `_run_scan_pipeline`, add `description` to each `JobMatchResponse`:
```python
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
        description=job_meta.get("description", "")[:3000],  # cap at 3000 chars
    )
)
```

3. Add new request/response models after `ScanResponse`:
```python
class EnhanceCVRequest(BaseModel):
    cv_text: str
    missing_keywords: List[str]
    job_title: str = ""
    company: str = ""

class EnhanceCVResponse(BaseModel):
    enhanced_cv: str

class CoverLetterRequest(BaseModel):
    cv_text: str
    job_title: str
    company: str
    job_description: str

class CoverLetterResponse(BaseModel):
    cover_letter: str
```

4. Add new endpoints at the bottom of the file:
```python
@router.post("/enhance-cv", response_model=EnhanceCVResponse)
async def enhance_cv(request: EnhanceCVRequest) -> EnhanceCVResponse:
    """Add missing keywords naturally into the CV text using Gemini."""
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")
    if not request.missing_keywords:
        return EnhanceCVResponse(enhanced_cv=request.cv_text)

    keywords_str = ", ".join(request.missing_keywords)
    prompt = f"""You are a professional CV writer. Enhance the CV below by naturally incorporating the missing skills/keywords listed.

Rules:
- Do NOT invent fake experience or change facts
- Integrate keywords naturally where relevant (skills section, bullet points, summaries)
- Keep the same structure and format
- Add a Skills section at the top if one doesn't exist
- Return ONLY the enhanced CV text, no explanations

Missing keywords to add: {keywords_str}

CV:
---
{request.cv_text[:4000]}
---"""
    try:
        from services.ai_router import ai_complete
        enhanced = await ai_complete(prompt)
        return EnhanceCVResponse(enhanced_cv=enhanced.strip())
    except Exception as exc:
        logger.error("enhance_cv: failed — %s", exc)
        raise HTTPException(status_code=500, detail="CV enhancement failed") from exc


@router.post("/cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(request: CoverLetterRequest) -> CoverLetterResponse:
    """Generate a tailored cover letter using Gemini."""
    if not request.cv_text.strip():
        raise HTTPException(status_code=422, detail="cv_text must not be empty")

    prompt = f"""Write a professional cover letter for the following job application.

Job Title: {request.job_title}
Company: {request.company}
Job Description:
---
{request.job_description[:2000]}
---

Candidate CV:
---
{request.cv_text[:3000]}
---

Rules:
- 3-4 paragraphs, professional tone
- Reference specific skills from the CV that match the job
- Do NOT invent experience
- Include a strong opening and closing
- Return ONLY the cover letter text, no subject line or email headers"""
    try:
        from services.ai_router import ai_complete
        letter = await ai_complete(prompt)
        return CoverLetterResponse(cover_letter=letter.strip())
    except Exception as exc:
        logger.error("cover_letter: failed — %s", exc)
        raise HTTPException(status_code=500, detail="Cover letter generation failed") from exc
```

- [ ] **Step 2: Commit**
```bash
git add backend/routers/scan.py
git commit -m "feat: add description to scan response + enhance-cv and cover-letter endpoints"
```

---

### Task 2: Add status column to Supabase matches table

**Files:**
- SQL to run in Supabase SQL editor

- [ ] **Step 1: Run this SQL in Supabase SQL editor for project glgtjbwuqvnpqxzmiplh**

```sql
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS status TEXT
  CHECK (status IN ('saved', 'applied'))
  DEFAULT NULL;
```

---

### Task 3: Update frontend API types and add new API functions

**Files:**
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Update JobMatch type and add new functions**

Replace the `JobMatch` interface and add new functions:

```typescript
export interface JobMatch {
  job_title: string
  company: string
  url: string
  score: number
  matched_keywords: string[]
  missing_keywords: string[]
  summary: string
  source?: string
  location?: string
  salary_min?: number
  salary_max?: number
  description?: string
}

export async function enhanceCV(
  cv_text: string,
  missing_keywords: string[],
  job_title: string,
  company: string,
  token?: string
): Promise<string> {
  const res = await fetchWithAuth('/scan/enhance-cv', {
    method: 'POST',
    body: JSON.stringify({ cv_text, missing_keywords, job_title, company }),
  }, token)
  if (!res.ok) throw new Error('CV enhancement failed')
  const data = await res.json()
  return data.enhanced_cv
}

export async function generateCoverLetter(
  cv_text: string,
  job_title: string,
  company: string,
  job_description: string,
  token?: string
): Promise<string> {
  const res = await fetchWithAuth('/scan/cover-letter', {
    method: 'POST',
    body: JSON.stringify({ cv_text, job_title, company, job_description }),
  }, token)
  if (!res.ok) throw new Error('Cover letter generation failed')
  const data = await res.json()
  return data.cover_letter
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/lib/api.ts
git commit -m "feat: add JobMatch description field and AI API functions"
```

---

### Task 4: Install client-side download libraries

**Files:**
- Modify: `frontend/package.json` (via npm install)

- [ ] **Step 1: Install jspdf and docx**
```bash
cd frontend
npm install jspdf docx
```

- [ ] **Step 2: Commit**
```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add jspdf and docx for client-side document download"
```

---

### Task 5: Update JobCard to show keyword counts + "View Details" button

**Files:**
- Modify: `frontend/components/JobCard.tsx`

- [ ] **Step 1: Replace the keywords section and add View Details button**

Replace the entire `JobCard` component with this version that shows counts only and links to the detail page:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import ScoreRing from './ScoreRing'

interface JobCardProps {
  job: {
    job_title: string
    company: string
    url: string
    score: number
    matched_keywords: string[]
    missing_keywords: string[]
    summary: string
    source?: string
    location?: string
    salary_min?: number
    salary_max?: number
    description?: string
  }
}

function sourceBadge(source?: string) {
  if (!source) return null
  const label = source.charAt(0).toUpperCase()
  const colors: Record<string, string> = {
    linkedin: 'bg-blue-600',
    indeed: 'bg-indigo-500',
    glassdoor: 'bg-green-600',
  }
  const bg = colors[source.toLowerCase()] ?? 'bg-gray-500'
  return (
    <span
      className={`inline-flex items-center justify-center h-5 w-5 rounded text-white text-[10px] font-bold ${bg}`}
      title={source}
    >
      {label}
    </span>
  )
}

function formatSalary(min?: number, max?: number): string | null {
  if (min == null && max == null) return null
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}/yr`
  if (min != null) return `From ${fmt(min)}/yr`
  return `Up to ${fmt(max!)}/yr`
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter()
  const salary = formatSalary(job.salary_min, job.salary_max)

  const handleViewDetails = () => {
    // Store the full job in sessionStorage so the detail page can read it
    const stored = sessionStorage.getItem('radarjobs_scan')
    const scan = stored ? JSON.parse(stored) : {}
    const jobs: JobCardProps['job'][] = scan.matches ?? []
    const existing = jobs.find((j) => j.url === job.url)
    if (!existing) {
      scan.matches = [...jobs, job]
      sessionStorage.setItem('radarjobs_scan', JSON.stringify(scan))
    }
    router.push(`/scan/job?url=${encodeURIComponent(job.url)}`)
  }

  return (
    <article className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 pb-3 flex items-start gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <ScoreRing score={job.score} size={64} strokeWidth={6} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            job.score >= 80 ? 'bg-green-500 text-white' :
            job.score >= 60 ? 'bg-amber-400 text-white' : 'bg-red-500 text-white'
          }`}>
            {job.score}% match
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">{job.job_title}</h3>
          <p className="mt-0.5 text-sm text-gray-500 font-medium">{job.company}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            {sourceBadge(job.source)}
            {job.location && <span>{job.location}</span>}
            {salary && <span>{salary}</span>}
          </div>
        </div>
      </div>

      <div className="mx-5 border-t border-gray-100" />

      {/* Summary */}
      <div className="px-5 py-3 flex-1">
        <p className="text-sm text-gray-500 italic line-clamp-2 leading-relaxed">{job.summary}</p>
      </div>

      {/* Keyword counts */}
      <div className="px-5 pb-3 flex gap-4 text-xs font-medium">
        <span className="text-green-600">✓ {job.matched_keywords.length} matched</span>
        <span className="text-red-400">✗ {job.missing_keywords.length} missing</span>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 py-2.5 rounded-lg bg-teal-dark text-white text-sm font-semibold hover:bg-teal-mid transition-colors"
        >
          View Details
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-lg border-2 border-teal-mid text-teal-dark text-sm font-semibold hover:bg-teal-light transition-colors"
        >
          Apply →
        </a>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Update scan/page.tsx to store cvText + full results in sessionStorage**

In `frontend/app/scan/page.tsx`, inside `handleScan`, right before `setStep('results')`, add:
```typescript
sessionStorage.setItem('radarjobs_scan', JSON.stringify({
  matches: response.matches,
  cvText,
  jobTitle,
  location,
}))
```

- [ ] **Step 3: Commit**
```bash
git add frontend/components/JobCard.tsx frontend/app/scan/page.tsx
git commit -m "feat: JobCard shows keyword counts only with View Details button"
```

---

### Task 6: Create the Job Detail page

**Files:**
- Create: `frontend/app/scan/job/page.tsx`

- [ ] **Step 1: Create the job detail page**

Create `frontend/app/scan/job/page.tsx`:

```tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { enhanceCV, generateCoverLetter } from '@/lib/api'
import type { JobMatch } from '@/lib/api'
import ScoreRing from '@/components/ScoreRing'
import { getSupabaseClient } from '@/lib/supabase'

type Status = 'saved' | 'applied' | null
type Tab = 'overview' | 'cv' | 'cover-letter'

// ── localStorage helpers ──────────────────────────────────────────────────
function getStatuses(): Record<string, Status> {
  try { return JSON.parse(localStorage.getItem('radarjobs_statuses') ?? '{}') } catch { return {} }
}
function setStatus(url: string, status: Status) {
  const s = getStatuses()
  if (status === null) delete s[url]; else s[url] = status
  localStorage.setItem('radarjobs_statuses', JSON.stringify(s))
}

// ── PDF download ──────────────────────────────────────────────────────────
async function downloadPDF(text: string, filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
  const lines = doc.splitTextToSize(text, pageWidth)
  let y = margin
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = margin }
    doc.text(line, margin, y)
    y += 7
  }
  doc.save(filename)
}

// ── Word download ─────────────────────────────────────────────────────────
async function downloadWord(text: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx')
  const paragraphs = text.split('\n').map(
    (line) => new Paragraph({ children: [new TextRun(line)] })
  )
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useSearchParams()
  const jobUrl = params.get('url') ?? ''

  const [job, setJob] = useState<JobMatch | null>(null)
  const [cvText, setCvText] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [status, setStatusState] = useState<Status>(null)

  // AI states
  const [enhancedCV, setEnhancedCV] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)

  const [coverLetter, setCoverLetter] = useState('')
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false)
  const [letterError, setLetterError] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('radarjobs_scan')
    if (!raw) { router.replace('/scan'); return }
    const scan = JSON.parse(raw)
    const found = (scan.matches as JobMatch[]).find((m) => m.url === jobUrl)
    if (!found) { router.replace('/scan'); return }
    setJob(found)
    setCvText(scan.cvText ?? '')
    setStatusState(getStatuses()[jobUrl] ?? null)
  }, [jobUrl, router])

  const handleEnhanceCV = async () => {
    if (!job) return
    setIsEnhancing(true)
    setEnhanceError(null)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const result = await enhanceCV(cvText, job.missing_keywords, job.job_title, job.company, session?.access_token)
      setEnhancedCV(result)
      setTab('cv')
    } catch {
      setEnhanceError('Enhancement failed. Try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleGenerateLetter = async () => {
    if (!job) return
    setIsGeneratingLetter(true)
    setLetterError(null)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const result = await generateCoverLetter(cvText, job.job_title, job.company, job.description ?? '', session?.access_token)
      setCoverLetter(result)
      setTab('cover-letter')
    } catch {
      setLetterError('Cover letter generation failed. Try again.')
    } finally {
      setIsGeneratingLetter(false)
    }
  }

  const handleStatusToggle = (s: 'saved' | 'applied') => {
    const next: Status = status === s ? null : s
    setStatusState(next)
    setStatus(jobUrl, next)
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

  const scoreColor = job.score >= 80 ? 'text-green-600' : job.score >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-teal-dark to-teal-mid px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            ← Back to results
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusToggle('saved')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                status === 'saved'
                  ? 'bg-amber-400 border-amber-400 text-white'
                  : 'border-white/40 text-white hover:border-white'
              }`}
            >
              {status === 'saved' ? '★ Saved' : '☆ Save'}
            </button>
            <button
              onClick={() => handleStatusToggle('applied')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                status === 'applied'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-white/40 text-white hover:border-white'
              }`}
            >
              {status === 'applied' ? '✓ Applied' : 'Mark Applied'}
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-teal-dark hover:bg-teal-light transition-colors"
            >
              Apply Now →
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* Job header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-6">
          <ScoreRing score={job.score} size={80} strokeWidth={7} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{job.job_title}</h1>
            <p className="text-gray-500 font-medium mt-1">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
            <p className={`text-lg font-bold mt-2 ${scoreColor}`}>{job.score}% match</p>
            <p className="text-sm text-gray-500 italic mt-1">{job.summary}</p>
          </div>
        </div>

        {/* AI action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleEnhanceCV}
            disabled={isEnhancing || job.missing_keywords.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEnhancing ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Enhancing CV…</>
            ) : '✨ Magic AI — Enhance CV'}
          </button>
          <button
            onClick={handleGenerateLetter}
            disabled={isGeneratingLetter}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingLetter ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Generating…</>
            ) : '📝 Generate Cover Letter'}
          </button>
          {(enhanceError || letterError) && (
            <p className="text-red-500 text-sm self-center">{enhanceError ?? letterError}</p>
          )}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['overview', 'cv', 'cover-letter'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-teal-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'overview' ? 'Overview' : t === 'cv' ? 'CV' + (enhancedCV ? ' ✨' : '') : 'Cover Letter' + (coverLetter ? ' ✓' : '')}
            </button>
          ))}
        </div>

        {/* Tab: Overview — JD left, keywords right */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Job Description */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Job Description</h2>
              {job.description ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No description available.</p>
              )}
            </div>

            {/* Right: Keywords */}
            <div className="flex flex-col gap-4">
              {job.matched_keywords.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-green-600 mb-3">✓ Matched ({job.matched_keywords.length})</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.matched_keywords.map((kw) => (
                      <span key={kw} className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.missing_keywords.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-red-500 mb-3">✗ Missing ({job.missing_keywords.length})</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.missing_keywords.map((kw) => (
                      <span key={kw} className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-100">{kw}</span>
                    ))}
                  </div>
                  <button onClick={handleEnhanceCV} disabled={isEnhancing} className="mt-4 text-sm text-purple-600 font-semibold hover:underline disabled:opacity-50">
                    ✨ Add these to my CV automatically →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: CV */}
        {tab === 'cv' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {enhancedCV ? '✨ Enhanced CV' : 'Your CV'}
              </h2>
              {enhancedCV && (
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(enhancedCV, 'enhanced-cv.pdf')}
                    className="px-4 py-2 rounded-lg bg-teal-dark text-white text-sm font-semibold hover:bg-teal-mid transition-colors"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadWord(enhancedCV, 'enhanced-cv.docx')}
                    className="px-4 py-2 rounded-lg border-2 border-teal-mid text-teal-dark text-sm font-semibold hover:bg-teal-light transition-colors"
                  >
                    Download Word
                  </button>
                </div>
              )}
            </div>
            <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
              {enhancedCV || cvText || 'No CV text available.'}
            </pre>
          </div>
        )}

        {/* Tab: Cover Letter */}
        {tab === 'cover-letter' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Cover Letter</h2>
              {coverLetter && (
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(coverLetter, 'cover-letter.pdf')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadWord(coverLetter, 'cover-letter.docx')}
                    className="px-4 py-2 rounded-lg border-2 border-blue-500 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Download Word
                  </button>
                </div>
              )}
            </div>
            {coverLetter ? (
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{coverLetter}</pre>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No cover letter generated yet.</p>
                <button
                  onClick={handleGenerateLetter}
                  disabled={isGeneratingLetter}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isGeneratingLetter ? 'Generating…' : '📝 Generate Cover Letter'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/app/scan/job/page.tsx
git commit -m "feat: add job detail page with CV/JD view, AI enhancement, cover letter, and status tracking"
```

---

### Task 7: Push and deploy

- [ ] **Step 1: Push all commits**
```bash
git push
```

- [ ] **Step 2: Redeploy Vercel**
```bash
cd frontend && vercel deploy --yes --prod --scope arctinode-6752s-projects
```
