'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { enhanceCV, generateCoverLetter } from '@/lib/api'
import type { JobMatch } from '@/lib/api'
import ScoreRing from '@/components/ScoreRing'
import { getSupabaseClient } from '@/lib/supabase'

type Status = 'saved' | 'applied' | null
type Tab = 'overview' | 'cv' | 'cover-letter'

// ── persistence ───────────────────────────────────────────────────────────
function getStatuses(): Record<string, Status> {
  try { return JSON.parse(localStorage.getItem('radarjobs_statuses') ?? '{}') } catch { return {} }
}
function persistStatus(url: string, status: Status) {
  const s = getStatuses()
  if (status === null) delete s[url]; else s[url] = status
  localStorage.setItem('radarjobs_statuses', JSON.stringify(s))
}

// ── downloads ─────────────────────────────────────────────────────────────
async function downloadPDF(text: string, filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(text, pageWidth)
  let y = margin
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = margin }
    doc.text(line, margin, y)
    y += 6
  }
  doc.save(filename)
}

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

// ── CV template renderer ──────────────────────────────────────────────────
const SECTION_HEADERS = /^(PROFESSIONAL SUMMARY|SUMMARY|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|SKILLS & COMPETENCIES|COMPETENCIES|CERTIFICATIONS|PROJECTS|LANGUAGES|REFERENCES|FORMATION|COMPÉTENCES|EXPÉRIENCE|PROJETS|BÉNÉVOLAT|VOLUNTEER|AWARDS|PUBLICATIONS|INTERESTS|OBJECTIVE|PROFILE)\s*:?\s*$/i

function CVTemplate({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trimEnd())
  const sections: Array<{ type: 'name' | 'contact' | 'header' | 'job-line' | 'bullet' | 'body' | 'blank'; text: string }> = []

  let nameFound = false
  let contactDone = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      sections.push({ type: 'blank', text: '' })
      continue
    }

    if (!nameFound) {
      sections.push({ type: 'name', text: trimmed })
      nameFound = true
      continue
    }

    // Contact lines: email, phone, linkedin, location (first few non-blank lines after name)
    if (!contactDone && i < 7 && /[@|•|\||\/]|linkedin|github|\+\d|\(\d{3}\)|\d{3}[-.\s]\d{3}|montreal|toronto|canada|@/i.test(trimmed)) {
      sections.push({ type: 'contact', text: trimmed })
      continue
    }

    // Section headers
    if (
      SECTION_HEADERS.test(trimmed) ||
      (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 50 && !/^\d/.test(trimmed) && !/^•/.test(trimmed))
    ) {
      contactDone = true
      sections.push({ type: 'header', text: trimmed })
      continue
    }

    contactDone = true

    // Bullet lines starting with •
    if (/^•/.test(trimmed)) {
      sections.push({ type: 'bullet', text: trimmed.replace(/^•\s*/, '') })
      continue
    }

    // Job title lines: "Title | Company | City | YYYY – YYYY"
    if (/\|/.test(trimmed) && /\d{4}/.test(trimmed)) {
      sections.push({ type: 'job-line', text: trimmed })
      continue
    }

    sections.push({ type: 'body', text: trimmed })
  }

  return (
    <div className="font-sans text-gray-800 max-w-2xl mx-auto">
      {sections.map((s, i) => {
        if (s.type === 'blank') return <div key={i} className="h-2.5" />
        if (s.type === 'name') return (
          <h1 key={i} className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">{s.text}</h1>
        )
        if (s.type === 'contact') return (
          <p key={i} className="text-xs text-gray-500 mb-0.5">{s.text}</p>
        )
        if (s.type === 'header') return (
          <div key={i} className="mt-5 mb-2 border-b-2 border-teal-mid pb-1">
            <h2 className="text-xs font-extrabold text-teal-dark uppercase tracking-widest">{s.text}</h2>
          </div>
        )
        if (s.type === 'job-line') return (
          <p key={i} className="text-sm font-semibold text-gray-900 mt-2 mb-1">{s.text}</p>
        )
        if (s.type === 'bullet') return (
          <div key={i} className="flex gap-2 text-sm leading-relaxed mb-0.5 pl-1">
            <span className="text-teal-mid shrink-0 mt-0.5">•</span>
            <span className="text-gray-700">{s.text}</span>
          </div>
        )
        return (
          <p key={i} className="text-sm text-gray-600 leading-relaxed mb-0.5">{s.text}</p>
        )
      })}
    </div>
  )
}

// ── animated score counter ────────────────────────────────────────────────
function useAnimatedScore(target: number, duration = 1400) {
  const [display, setDisplay] = useState(target)
  const prevTarget = useRef(target)

  useEffect(() => {
    const start = prevTarget.current
    const end = target
    prevTarget.current = target
    if (start === end) return
    let step = 0
    const steps = 50
    const interval = setInterval(() => {
      step++
      const t = step / steps
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (step >= steps) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [target, duration])

  return display
}

// ── main component ────────────────────────────────────────────────────────
function JobDetailInner() {
  const router = useRouter()
  const params = useSearchParams()
  const jobUrl = params.get('url') ?? ''

  const [job, setJob] = useState<JobMatch | null>(null)
  const [cvText, setCvText] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [status, setStatus] = useState<Status>(null)

  const [enhancedCV, setEnhancedCV] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [keywordsAdded, setKeywordsAdded] = useState(false)
  const [newScore, setNewScore] = useState<number | null>(null)

  const [coverLetter, setCoverLetter] = useState('')
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false)
  const [letterError, setLetterError] = useState<string | null>(null)

  const cvScrollRef = useRef<HTMLDivElement>(null)

  const scoreTarget = newScore ?? (job?.score ?? 0)
  const displayScore = useAnimatedScore(scoreTarget)
  const scoreColor = displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-amber-500' : 'text-red-500'
  const scoreDelta = newScore !== null && job ? newScore - job.score : 0

  useEffect(() => {
    const raw = sessionStorage.getItem('radarjobs_scan')
    if (!raw) { router.replace('/scan'); return }
    const scan = JSON.parse(raw)
    const found = (scan.matches as JobMatch[]).find((m) => m.url === jobUrl)
    if (!found) { router.replace('/scan'); return }
    setJob(found)
    setCvText(scan.cvText ?? '')
    setStatus(getStatuses()[jobUrl] ?? null)
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
      setKeywordsAdded(true)
      // Estimate new score: each missing keyword added ≈ +4 pts, capped at 98
      const estimated = Math.min(98, job.score + Math.round(job.missing_keywords.length * 4))
      setNewScore(estimated)
      setTab('cv')
      setTimeout(() => {
        cvScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
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
    setStatus(next)
    persistStatus(jobUrl, next)
  }

  if (!job) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  const activeCVText = enhancedCV || cvText

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── Top bar ── */}
      <div className="shrink-0 bg-gradient-to-r from-teal-dark to-teal-mid px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white text-sm flex items-center gap-1 font-medium whitespace-nowrap">
            ← Back
          </button>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => handleStatusToggle('saved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${status === 'saved' ? 'bg-amber-400 border-amber-400 text-white' : 'border-white/40 text-white hover:border-white'}`}
            >
              {status === 'saved' ? '★ Saved' : '☆ Save'}
            </button>
            <button
              onClick={() => handleStatusToggle('applied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${status === 'applied' ? 'bg-green-500 border-green-500 text-white' : 'border-white/40 text-white hover:border-white'}`}
            >
              {status === 'applied' ? '✓ Applied' : 'Mark Applied'}
            </button>
            <a href={job.url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-teal-dark hover:bg-teal-light transition-colors">
              Apply Now →
            </a>
          </div>
        </div>
      </div>

      {/* ── Job header strip ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <ScoreRing score={displayScore} size={56} strokeWidth={6} />
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-gray-900 text-base leading-tight truncate">{job.job_title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            <span className={`text-2xl font-extrabold tabular-nums leading-none ${scoreColor}`}>
              {displayScore}%
            </span>
            {scoreDelta > 0 && (
              <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full leading-tight">
                +{scoreDelta} pts ✨
              </span>
            )}
            {scoreDelta > 0 && (
              <span className="text-[10px] text-gray-400 leading-tight">AI-enhanced</span>
            )}
          </div>
        </div>
      </div>

      {/* ── AI buttons ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
          <button
            onClick={handleEnhanceCV}
            disabled={isEnhancing || job.missing_keywords.length === 0 || keywordsAdded}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEnhancing ? (
              <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Enhancing CV…</>
            ) : keywordsAdded ? '✨ CV Enhanced' : '✨ Magic AI — Add missing keywords'}
          </button>
          <button
            onClick={handleGenerateLetter}
            disabled={isGeneratingLetter}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingLetter ? (
              <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating…</>
            ) : '📝 Cover Letter'}
          </button>
          {(enhanceError || letterError) && (
            <p className="text-red-500 text-xs">{enhanceError ?? letterError}</p>
          )}

          {/* Tabs */}
          <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['overview', 'cv', 'cover-letter'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === t ? 'bg-white text-teal-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'overview' ? 'Overview' : t === 'cv' ? `CV${enhancedCV ? ' ✨' : ''}` : `Letter${coverLetter ? ' ✓' : ''}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-4">

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="h-full grid lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="shrink-0 px-5 pt-4 pb-2 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-700">Job Description</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {job.description ? (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No description available.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto">
                <p className="text-xs text-gray-400 italic shrink-0">{job.summary}</p>

                {job.matched_keywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 shrink-0">
                    <h2 className="text-xs font-bold text-green-600 mb-2">✓ Matched ({job.matched_keywords.length})</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {job.matched_keywords.map((kw) => (
                        <span key={kw} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {job.missing_keywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 shrink-0">
                    {keywordsAdded ? (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none">✨</span>
                        <div>
                          <p className="text-sm font-bold text-purple-700">Missing keywords added to your CV!</p>
                          <p className="text-xs text-gray-400 mt-1">Your CV is now ATS-optimized in Canadian format.</p>
                          <button onClick={() => setTab('cv')}
                            className="mt-2 text-xs text-purple-600 font-semibold hover:underline">
                            View enhanced CV →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xs font-bold text-red-500 mb-2">✗ Missing ({job.missing_keywords.length})</h2>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {job.missing_keywords.map((kw) => (
                            <span key={kw} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">{kw}</span>
                          ))}
                        </div>
                        <button
                          onClick={handleEnhanceCV}
                          disabled={isEnhancing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          {isEnhancing
                            ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Enhancing…</>
                            : '✨ Magic AI — Add to my CV automatically'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CV tab */}
          {tab === 'cv' && (
            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-gray-700">
                    {enhancedCV ? '✨ Enhanced CV — Canadian Format' : 'Your CV'}
                  </h2>
                  {enhancedCV && (
                    <p className="text-xs text-gray-400 mt-0.5">ATS-optimized · No dashes or asterisks · Ready to apply</p>
                  )}
                </div>
                {enhancedCV && (
                  <div className="flex items-center gap-3">
                    {scoreDelta > 0 && (
                      <div className="text-center">
                        <span className="text-xs text-gray-400 block">Match score</span>
                        <span className="text-lg font-extrabold text-purple-600 tabular-nums leading-tight">
                          {displayScore}%
                          <span className="text-xs font-bold text-green-600 ml-1">+{scoreDelta}</span>
                        </span>
                      </div>
                    )}
                    <button onClick={() => downloadPDF(enhancedCV, 'enhanced-cv.pdf')}
                      className="px-3 py-1.5 rounded-lg bg-teal-dark text-white text-xs font-semibold hover:bg-teal-mid transition-colors">
                      PDF
                    </button>
                    <button onClick={() => downloadWord(enhancedCV, 'enhanced-cv.docx')}
                      className="px-3 py-1.5 rounded-lg border-2 border-teal-mid text-teal-dark text-xs font-semibold hover:bg-teal-light transition-colors">
                      Word
                    </button>
                  </div>
                )}
              </div>
              <div ref={cvScrollRef} className="flex-1 overflow-y-auto px-8 py-6">
                <CVTemplate text={activeCVText || 'No CV text available.'} />
              </div>
            </div>
          )}

          {/* Cover Letter tab */}
          {tab === 'cover-letter' && (
            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-bold text-gray-700">Cover Letter</h2>
                {coverLetter && (
                  <div className="flex gap-2">
                    <button onClick={() => downloadPDF(coverLetter, 'cover-letter.pdf')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                      PDF
                    </button>
                    <button onClick={() => downloadWord(coverLetter, 'cover-letter.docx')}
                      className="px-3 py-1.5 rounded-lg border-2 border-blue-500 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors">
                      Word
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {coverLetter ? (
                  <div className="max-w-2xl mx-auto font-sans text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {coverLetter}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <p className="text-gray-400 text-sm">No cover letter generated yet.</p>
                    <button onClick={handleGenerateLetter} disabled={isGeneratingLetter}
                      className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isGeneratingLetter ? 'Generating…' : '📝 Generate Cover Letter'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    }>
      <JobDetailInner />
    </Suspense>
  )
}
