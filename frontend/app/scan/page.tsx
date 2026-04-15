'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import CVUpload from '@/components/CVUpload'
import JobCard from '@/components/JobCard'
import { extractCV, scanCV } from '@/lib/api'
import type { JobMatch, ScanResponse, ExtractResponse } from '@/lib/api'
import clsx from 'clsx'

type Step = 'upload' | 'confirm' | 'results'

// ── Client-side fallback extraction (used when backend is unreachable) ──────
const TITLE_KEYWORDS = /\b(engineer|developer|designer|manager|analyst|architect|scientist|consultant|director|lead|senior|junior|full.?stack|frontend|backend|devops|product|software|data|cloud|security|mobile|qa|test|ux|ui|research)\b/i
const LOCATION_PATTERN = /\b([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z]+))\b/

function extractFromCVText(text: string): { title: string; location: string } {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // Title: look in first 15 lines for a short line matching role keywords
  let title = ''
  for (const line of lines.slice(0, 15)) {
    const wordCount = line.split(/\s+/).length
    if (wordCount >= 2 && wordCount <= 7 && TITLE_KEYWORDS.test(line) && line.length < 60) {
      title = line.replace(/[|•·\/\\,]+$/, '').trim()
      break
    }
  }

  // Location: look in first 20 lines for a "City, Region" pattern
  let location = ''
  for (const line of lines.slice(0, 20)) {
    const m = line.match(LOCATION_PATTERN)
    if (m) {
      location = m[1].trim()
      break
    }
  }

  return { title, location }
}

const TIME_RANGES = [
  { label: 'Last 24h', hours: 24 },
  { label: 'Last 3 days', hours: 72 },
  { label: 'Last week', hours: 168 },
] as const

export default function ScanPage() {
  const [step, setStep] = useState<Step>('upload')

  // Step 1 — CV
  const [cvText, setCvText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  // Step 2 — Confirm
  const [extracted, setExtracted] = useState<ExtractResponse | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [hoursOld, setHoursOld] = useState<number>(72)

  // Step 3 — Results
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<ScanResponse | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(0)

  const supabase = getSupabaseClient()

  // After CV text is extracted from the file, call backend to parse title/location
  const handleTextExtracted = async (text: string) => {
    setCvText(text)
    setExtractError(null)
    setIsExtracting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const info = await extractCV(text, token)
      setExtracted(info)
      setJobTitle(info.title !== 'Unknown' ? info.title : '')
      setLocation(info.location || '')
      setStep('confirm')
    } catch {
      // Backend unreachable — fall back to client-side regex extraction
      const local = extractFromCVText(text)
      setExtracted(null)
      setJobTitle(local.title)
      setLocation(local.location)
      if (!local.title) {
        setExtractError('Could not auto-detect your job title — please fill it in below.')
      }
      setStep('confirm')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleScan = async () => {
    if (!cvText.trim() || !jobTitle.trim()) return
    setIsScanning(true)
    setScanError(null)
    setResults(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const response = await scanCV(
        { cv_text: cvText, job_title: jobTitle, location: location || 'United States', hours_old: hoursOld },
        token
      )
      setResults(response)
      setStep('results')
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const filteredMatches: JobMatch[] = results
    ? results.matches.filter((m) => m.score >= minScore)
    : []

  const resetToUpload = () => {
    setStep('upload')
    setCvText('')
    setExtracted(null)
    setJobTitle('')
    setLocation('')
    setResults(null)
    setScanError(null)
    setExtractError(null)
    setMinScore(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-teal-dark to-teal-mid py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Radar Scan</h1>
          <p className="text-white/70 text-lg">
            Upload your CV — we&apos;ll detect your role and find your best matches.
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-6">
            {(['upload', 'confirm', 'results'] as Step[]).map((s, i) => {
              const labels = ['Upload CV', 'Confirm', 'Results']
              const active = step === s
              const done =
                (s === 'upload' && (step === 'confirm' || step === 'results')) ||
                (s === 'confirm' && step === 'results')
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      active ? 'bg-white text-teal-dark' :
                      done ? 'bg-teal-accent/60 text-white' :
                      'bg-white/20 text-white/60'
                    )}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={clsx('text-sm font-medium hidden sm:inline', active ? 'text-white' : 'text-white/50')}>
                    {labels[i]}
                  </span>
                  {i < 2 && <div className="w-8 h-px bg-white/30 hidden sm:block" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Upload your CV</h2>
            <p className="text-gray-500 text-sm mb-6">
              We&apos;ll automatically detect your job title and location from your CV.
            </p>

            {isExtracting ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="36" stroke="#E1F5EE" strokeWidth="3" />
                    <circle cx="40" cy="40" r="24" stroke="#E1F5EE" strokeWidth="2" />
                    <circle cx="40" cy="40" r="12" stroke="#E1F5EE" strokeWidth="2" />
                    <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.5" />
                    <circle cx="40" cy="40" r="3" fill="#1D9E75" />
                  </svg>
                </div>
                <p className="font-bold text-teal-dark text-lg">Analysing your CV…</p>
                <p className="text-sm text-gray-400">Detecting your role, location and skills</p>
              </div>
            ) : (
              <CVUpload onTextExtracted={handleTextExtracted} />
            )}
          </div>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === 'confirm' && (
          <div className="flex flex-col gap-5">

            {/* Detected info */}
            {extracted && (
              <div className="bg-teal-light rounded-2xl border border-teal-accent/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider mb-1">Detected from your CV</p>
                  <p className="text-gray-700 text-sm">
                    <span className="font-semibold">{extracted.title}</span>
                    {extracted.location && <> · {extracted.location}</>}
                    {extracted.skills.length > 0 && (
                      <span className="text-gray-500"> · {extracted.skills.slice(0, 4).join(', ')}{extracted.skills.length > 4 ? ' +more' : ''}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={resetToUpload}
                  className="text-xs text-teal-mid hover:text-teal-dark font-semibold whitespace-nowrap underline underline-offset-2"
                >
                  Upload different CV
                </button>
              </div>
            )}

            {extractError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {extractError}
              </div>
            )}

            {/* Editable fields */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-gray-900">Confirm your search</h2>
              <p className="text-gray-500 text-sm -mt-2">Edit the fields below if needed, then choose how far back to search.</p>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Job title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior React Developer"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Location <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. London, UK or Remote"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors text-sm"
                />
              </div>

              {/* Time range */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Search period
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_RANGES.map(({ label, hours }) => (
                    <button
                      key={hours}
                      onClick={() => setHoursOld(hours)}
                      className={clsx(
                        'px-5 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all',
                        hoursOld === hours
                          ? 'bg-teal-dark border-teal-dark text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-teal-mid hover:text-teal-dark'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={!jobTitle.trim() || isScanning}
              className={clsx(
                'w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200',
                jobTitle.trim() && !isScanning
                  ? 'bg-teal-dark text-white hover:bg-teal-mid hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {isScanning ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Scanning job boards…
                </>
              ) : (
                '🔍 Confirm & Scan'
              )}
            </button>

            {/* Scanning animation */}
            {isScanning && (
              <div className="bg-teal-light rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none" style={{ animation: 'spin 2s linear infinite' }}>
                    <circle cx="40" cy="40" r="36" stroke="#E1F5EE" strokeWidth="3" />
                    <circle cx="40" cy="40" r="24" stroke="#E1F5EE" strokeWidth="2" />
                    <circle cx="40" cy="40" r="12" stroke="#E1F5EE" strokeWidth="2" />
                    <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.5" />
                    <circle cx="40" cy="40" r="3" fill="#1D9E75" />
                  </svg>
                  <style jsx>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  `}</style>
                </div>
                <div className="text-center">
                  <p className="font-bold text-teal-dark">
                    Scanning for &ldquo;{jobTitle}&rdquo;
                    {location ? ` in ${location}` : ''}…
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    LinkedIn · Indeed · Glassdoor · Google — {TIME_RANGES.find(r => r.hours === hoursOld)?.label}
                  </p>
                </div>
              </div>
            )}

            {scanError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {scanError}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Results ── */}
        {step === 'results' && results && (
          <div className="flex flex-col gap-5">

            {/* Results header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-teal-dark">
                    {results.matches.length} match{results.matches.length !== 1 ? 'es' : ''} found
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    from{' '}
                    <span className="font-semibold text-gray-700">
                      {results.total_jobs_scanned.toLocaleString()} jobs
                    </span>{' '}
                    scanned · &ldquo;{jobTitle}&rdquo;
                    {location ? ` in ${location}` : ''}
                    {' '}· {TIME_RANGES.find(r => r.hours === hoursOld)?.label}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Min score slider */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-medium">Min score: {minScore}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-28 accent-teal-mid"
                    />
                  </div>

                  {/* New scan */}
                  <button
                    onClick={() => setStep('confirm')}
                    className="text-sm font-semibold text-teal-mid border-2 border-teal-mid px-3 py-2 rounded-xl hover:bg-teal-light transition-colors"
                  >
                    Refine
                  </button>
                  <button
                    onClick={resetToUpload}
                    className="text-sm font-semibold text-gray-500 border-2 border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition-colors"
                  >
                    New CV
                  </button>
                </div>
              </div>
            </div>

            {/* Job cards */}
            {filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-gray-500">No matches above {minScore}%. Lower the filter or try a broader search.</p>
                <button
                  onClick={() => setStep('confirm')}
                  className="mt-4 text-sm font-semibold text-teal-mid underline underline-offset-2"
                >
                  Refine search
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredMatches.map((job, i) => (
                  <JobCard key={job.url ?? i} job={job} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
