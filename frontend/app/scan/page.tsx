'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import CVUpload from '@/components/CVUpload'
import JobCard from '@/components/JobCard'
import { extractCV, scanCV } from '@/lib/api'
import type { JobMatch, ScanResponse, ExtractResponse } from '@/lib/api'
import clsx from 'clsx'

type Step = 'start' | 'confirm' | 'results'
type InputMode = 'cv' | 'manual'

// ── Client-side fallback extraction ─────────────────────────────────────────
const TITLE_KEYWORDS = /\b(engineer|developer|designer|manager|analyst|architect|scientist|consultant|director|lead|senior|junior|full.?stack|frontend|backend|devops|product|software|data|cloud|security|mobile|qa|test|ux|ui|research|ingénieur|développeur|chargé|chef|responsable|coordinateur|technicien|architecte|analyste|directeur|gestionnaire|support|infrastructure|projet|réseau|système|spécialiste|administrateur|conseiller|agent)\b/i
const LOCATION_PATTERN = /([\w\u00C0-\u024F][\w\u00C0-\u024F\s]{1,20}),\s*([A-Z]{2})\b/

function extractFromCVText(text: string): { title: string; location: string } {
  const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  let title = ''
  for (const line of lines.slice(1, 12)) {
    if (/@|\u2022|linkedin|http|\+\d/.test(line)) continue
    if (/^\d/.test(line)) continue
    if (line === line.toUpperCase() && line.length > 6) continue
    const wordCount = line.split(/\s+/).length
    if (wordCount >= 2 && wordCount <= 12 && TITLE_KEYWORDS.test(line) && line.length < 80) {
      title = line.split(',')[0].trim()
      break
    }
  }
  let location = ''
  for (const line of lines.slice(0, 6)) {
    const m = line.match(LOCATION_PATTERN)
    if (m) { location = `${m[1].trim()}, ${m[2]}`; break }
  }
  return { title, location }
}

// Always search last 15 days (maps to JSearch "month" — closest option)
const HOURS_OLD = 360

export default function ScanPage() {
  const [step, setStep] = useState<Step>('start')
  const [inputMode, setInputMode] = useState<InputMode>('cv')

  const [cvText, setCvText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractResponse | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')

  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<ScanResponse | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleTextExtracted = async (text: string) => {
    setCvText(text)
    setExtractError(null)
    setIsExtracting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const info = await extractCV(text, session?.access_token)
      setExtracted(info)
      setJobTitle(info.title !== 'Unknown' ? info.title : '')
      setLocation(info.location || '')
      setStep('confirm')
    } catch {
      const local = extractFromCVText(text)
      setExtracted(null)
      setJobTitle(local.title)
      setLocation(local.location)
      if (!local.title) setExtractError('Could not detect your job title — please fill it in below.')
      setStep('confirm')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleManualProceed = () => {
    if (!jobTitle.trim()) return
    setExtracted(null)
    setExtractError(null)
    setStep('confirm')
  }

  const handleScan = async () => {
    if (!jobTitle.trim()) return
    setIsScanning(true)
    setScanError(null)
    setResults(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const effectiveCv = cvText.trim() || `Candidate searching for: ${jobTitle}`
      const response = await scanCV(
        { cv_text: effectiveCv, job_title: jobTitle, location: location || 'United States', hours_old: HOURS_OLD },
        session?.access_token
      )
      sessionStorage.setItem('radarjobs_scan', JSON.stringify({ matches: response.matches, cvText: effectiveCv, jobTitle, location }))
      setResults(response)
      setStep('results')
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const resetToStart = () => {
    setStep('start')
    setCvText('')
    setExtracted(null)
    setJobTitle('')
    setLocation('')
    setResults(null)
    setScanError(null)
    setExtractError(null)
  }

  const stepLabels = ['Start', 'Confirm', 'Results']
  const stepKeys: Step[] = ['start', 'confirm', 'results']

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── Fixed gradient header ── */}
      <div className="shrink-0 bg-gradient-to-r from-teal-dark to-teal-mid px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Radar Scan</h1>
              <p className="text-white/70 text-xs mt-0.5">Last 15 days · LinkedIn, Indeed, Glassdoor, Google &amp; more</p>
            </div>
            {/* Step pills */}
            <div className="flex items-center gap-2">
              {stepKeys.map((s, i) => {
                const active = step === s
                const done = stepKeys.indexOf(step) > i
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      active ? 'bg-white text-teal-dark' :
                      done ? 'bg-teal-accent/70 text-white' : 'bg-white/20 text-white/50'
                    )}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={clsx('text-xs font-medium hidden sm:inline', active ? 'text-white' : 'text-white/40')}>
                      {stepLabels[i]}
                    </span>
                    {i < 2 && <div className="w-4 h-px bg-white/25 hidden sm:block" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

          {/* ── STEP 1: Start ── */}
          {step === 'start' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Mode tabs */}
              <div className="grid grid-cols-2 border-b border-gray-100">
                <button
                  onClick={() => setInputMode('cv')}
                  className={clsx(
                    'py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2',
                    inputMode === 'cv'
                      ? 'text-teal-dark border-b-2 border-teal-dark bg-teal-light/40'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Match via CV
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={clsx(
                    'py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2',
                    inputMode === 'manual'
                      ? 'text-teal-dark border-b-2 border-teal-dark bg-teal-light/40'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Enter manually
                </button>
              </div>

              {/* CV mode */}
              {inputMode === 'cv' && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Upload your CV</h2>
                  <p className="text-gray-500 text-sm mb-6">AI reads your CV, detects your role and skills, then finds the best matching jobs from the last 15 days.</p>
                  {isExtracting ? (
                    <div className="flex flex-col items-center gap-4 py-10">
                      <svg className="w-16 h-16 animate-spin" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="36" stroke="#E1F5EE" strokeWidth="3" />
                        <circle cx="40" cy="40" r="24" stroke="#E1F5EE" strokeWidth="2" />
                        <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.5" />
                        <circle cx="40" cy="40" r="3" fill="#1D9E75" />
                      </svg>
                      <p className="font-bold text-teal-dark">Analysing your CV…</p>
                      <p className="text-sm text-gray-400">Detecting your role, location and skills</p>
                    </div>
                  ) : (
                    <CVUpload onTextExtracted={handleTextExtracted} />
                  )}
                </div>
              )}

              {/* Manual mode */}
              {inputMode === 'manual' && (
                <div className="p-8 flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Search by job title</h2>
                    <p className="text-gray-500 text-sm">We&apos;ll scan 50+ job boards for the last 15 days and return the best matches.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Job title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualProceed()}
                      placeholder="e.g. Software Engineer, Administrateur Systèmes"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Location <span className="text-gray-300 font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualProceed()}
                      placeholder="e.g. Montréal, QC · Toronto, ON · Remote"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleManualProceed}
                    disabled={!jobTitle.trim()}
                    className={clsx(
                      'w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2',
                      jobTitle.trim()
                        ? 'bg-teal-dark text-white hover:bg-teal-mid hover:shadow-md'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 'confirm' && (
            <div className="flex flex-col gap-5">

              {extracted && (
                <div className="bg-teal-light rounded-2xl border border-teal-accent/30 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-mid/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider">Detected from CV</p>
                    <p className="text-gray-700 text-sm truncate">
                      <span className="font-semibold">{extracted.title}</span>
                      {extracted.location && <> · {extracted.location}</>}
                      {extracted.skills.length > 0 && <span className="text-gray-400"> · {extracted.skills.slice(0, 4).join(', ')}{extracted.skills.length > 4 ? ' +more' : ''}</span>}
                    </p>
                  </div>
                  <button onClick={resetToStart} className="text-xs text-teal-mid font-semibold hover:underline shrink-0">
                    Change
                  </button>
                </div>
              )}

              {extractError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">{extractError}</div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Confirm your search</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Scanning last 15 days across LinkedIn, Indeed, Glassdoor, Google Jobs &amp; more</p>
                </div>

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
                    placeholder="e.g. Montréal, QC · Toronto, ON · Remote"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={!jobTitle.trim() || isScanning}
                className={clsx(
                  'w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200',
                  jobTitle.trim() && !isScanning
                    ? 'bg-teal-dark text-white hover:bg-teal-mid hover:shadow-lg hover:scale-[1.01]'
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
                ) : '🔍 Scan Now'}
              </button>

              {scanError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {scanError.toLowerCase().includes('fetch')
                    ? 'Cannot reach the backend — make sure NEXT_PUBLIC_API_URL is set.'
                    : scanError}
                </div>
              )}

              {isScanning && (
                <div className="bg-teal-light rounded-2xl p-6 flex flex-col items-center gap-4">
                  <svg className="w-16 h-16" viewBox="0 0 80 80" fill="none" style={{ animation: 'spin 2s linear infinite' }}>
                    <circle cx="40" cy="40" r="36" stroke="#E1F5EE" strokeWidth="3" />
                    <circle cx="40" cy="40" r="24" stroke="#E1F5EE" strokeWidth="2" />
                    <circle cx="40" cy="40" r="12" stroke="#E1F5EE" strokeWidth="2" />
                    <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.5" />
                    <circle cx="40" cy="40" r="3" fill="#1D9E75" />
                  </svg>
                  <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  <div className="text-center">
                    <p className="font-bold text-teal-dark">Scanning for &ldquo;{jobTitle}&rdquo;{location ? ` in ${location}` : ''}…</p>
                    <p className="text-sm text-gray-500 mt-1">LinkedIn · Indeed · Glassdoor · Google · Last 15 days</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Results ── */}
          {step === 'results' && results && (
            <div className="flex flex-col gap-5">

              {/* Results header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-extrabold text-teal-dark">
                      {results.matches.length} match{results.matches.length !== 1 ? 'es' : ''} found
                    </p>
                    <p className="text-gray-500 text-sm mt-0.5">
                      from <span className="font-semibold text-gray-700">{results.total_jobs_scanned.toLocaleString()} jobs</span> scanned
                      {' '}· &ldquo;{jobTitle}&rdquo;{location ? ` in ${location}` : ''} · Last 15 days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setStep('confirm')} className="text-sm font-semibold text-teal-mid border-2 border-teal-mid px-3 py-2 rounded-xl hover:bg-teal-light transition-colors">
                      Refine
                    </button>
                    <button onClick={resetToStart} className="text-sm font-semibold text-gray-500 border-2 border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition-colors">
                      New scan
                    </button>
                  </div>
                </div>
              </div>

              {/* Job cards */}
              {results.matches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                  <p className="text-gray-400 text-2xl mb-3">🔍</p>
                  <p className="font-semibold text-gray-700 mb-1">No jobs found</p>
                  <p className="text-gray-500 text-sm mb-4">Try a broader job title or a different location.</p>
                  <button onClick={() => setStep('confirm')} className="text-sm font-semibold text-teal-mid underline underline-offset-2">
                    Adjust search
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.matches.map((job: JobMatch, i: number) => (
                    <JobCard key={job.url ?? i} job={job} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
