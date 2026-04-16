'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { enhanceCV, generateCoverLetter } from '@/lib/api'
import type { JobMatch } from '@/lib/api'
import ScoreRing from '@/components/ScoreRing'
import { getSupabaseClient } from '@/lib/supabase'

type Status = 'saved' | 'applied' | null
type Tab = 'overview' | 'cv' | 'cover-letter'

function getStatuses(): Record<string, Status> {
  try { return JSON.parse(localStorage.getItem('radarjobs_statuses') ?? '{}') } catch { return {} }
}
function persistStatus(url: string, status: Status) {
  const s = getStatuses()
  if (status === null) delete s[url]; else s[url] = status
  localStorage.setItem('radarjobs_statuses', JSON.stringify(s))
}

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
    setStatus(next)
    persistStatus(jobUrl, next)
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  const scoreColor = job.score >= 80 ? 'text-green-600' : job.score >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-teal-dark to-teal-mid px-6 py-4 sticky top-0 z-10 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white text-sm flex items-center gap-1 font-medium">
            ← Back to results
          </button>
          <div className="flex gap-2 flex-wrap">
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
          <div className="shrink-0">
            <ScoreRing score={job.score} size={80} strokeWidth={7} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{job.job_title}</h1>
            <p className="text-gray-500 font-medium mt-1">
              {job.company}{job.location ? ` · ${job.location}` : ''}
            </p>
            <p className={`text-lg font-bold mt-2 ${scoreColor}`}>{job.score}% match</p>
            <p className="text-sm text-gray-500 italic mt-1 leading-relaxed">{job.summary}</p>
          </div>
        </div>

        {/* AI action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleEnhanceCV}
            disabled={isEnhancing || job.missing_keywords.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isEnhancing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Enhancing CV…
              </>
            ) : '✨ Magic AI — Enhance my CV'}
          </button>
          <button
            onClick={handleGenerateLetter}
            disabled={isGeneratingLetter}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isGeneratingLetter ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating…
              </>
            ) : '📝 Generate Cover Letter'}
          </button>
          {(enhanceError || letterError) && (
            <p className="text-red-500 text-sm self-center">{enhanceError ?? letterError}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['overview', 'cv', 'cover-letter'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-teal-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'overview' ? 'Overview'
                : t === 'cv' ? `CV${enhancedCV ? ' ✨' : ''}`
                : `Cover Letter${coverLetter ? ' ✓' : ''}`}
            </button>
          ))}
        </div>

        {/* Overview: JD left, keywords right */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-auto max-h-[70vh]">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Job Description</h2>
              {job.description ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No description available.</p>
              )}
            </div>

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
                  <button
                    onClick={handleEnhanceCV}
                    disabled={isEnhancing}
                    className="mt-4 text-sm text-purple-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    ✨ Add these to my CV automatically →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CV tab */}
        {tab === 'cv' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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

        {/* Cover Letter tab */}
        {tab === 'cover-letter' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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

export default function JobDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    }>
      <JobDetailInner />
    </Suspense>
  )
}
