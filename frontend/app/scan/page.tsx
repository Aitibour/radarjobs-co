'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import CVUpload from '@/components/CVUpload'
import JobCard from '@/components/JobCard'
import { extractCV, scanCV } from '@/lib/api'
import type { JobMatch, ScanResponse, ExtractResponse } from '@/lib/api'
import clsx from 'clsx'

type Step = 'start' | 'confirm' | 'results'

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
      title = line.split(',')[0].trim(); break
    }
  }
  let location = ''
  for (const line of lines.slice(0, 6)) {
    const m = line.match(LOCATION_PATTERN)
    if (m) { location = `${m[1].trim()}, ${m[2]}`; break }
  }
  return { title, location }
}

const HOURS_OLD = 360

// ── Mini radar SVG (reusable) ─────────────────────────────────────────────
function RadarSpinner({ size = 56, label }: { size?: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ animation: 'radar-spin 2s linear infinite' }}>
        <circle cx="40" cy="40" r="36" stroke="#E1F5EE" strokeWidth="3"/>
        <circle cx="40" cy="40" r="24" stroke="#C8EDE3" strokeWidth="2"/>
        <circle cx="40" cy="40" r="12" stroke="#C8EDE3" strokeWidth="2"/>
        <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.6"/>
        <circle cx="40" cy="40" r="3.5" fill="#1D9E75"/>
      </svg>
      <style jsx>{`@keyframes radar-spin { to { transform: rotate(360deg); } }`}</style>
      <p className="text-sm font-semibold text-teal-dark text-center">{label}</p>
    </div>
  )
}

export default function ScanPage() {
  const [step, setStep] = useState<Step>('start')

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
      if (!local.title) setExtractError('Could not detect your job title — please fill it in.')
      setStep('confirm')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleScan = async () => {
    if (!jobTitle.trim()) return
    setIsScanning(true); setScanError(null); setResults(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const effectiveCv = cvText.trim() || `Candidate searching for: ${jobTitle}`
      const response = await scanCV(
        { cv_text: effectiveCv, job_title: jobTitle, location: location || 'United States', hours_old: HOURS_OLD },
        session?.access_token
      )
      sessionStorage.setItem('radarjobs_scan', JSON.stringify({ matches: response.matches, cvText: effectiveCv, jobTitle, location }))
      setResults(response); setStep('results')
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const resetToStart = () => {
    setStep('start'); setCvText(''); setExtracted(null)
    setJobTitle(''); setLocation(''); setResults(null)
    setScanError(null); setExtractError(null)
  }

  const stepLabels = ['Start', 'Confirm', 'Results']
  const stepKeys: Step[] = ['start', 'confirm', 'results']

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── Header ── */}
      <div className="shrink-0 bg-gradient-to-r from-teal-dark to-teal-mid px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">Radar Scan</h1>
            <p className="text-white/60 text-xs">Last 15 days · LinkedIn, Indeed, Glassdoor, Google &amp; more</p>
          </div>
          <div className="flex items-center gap-2">
            {stepKeys.map((s, i) => {
              const active = step === s
              const done = stepKeys.indexOf(step) > i
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    active ? 'bg-white text-teal-dark' :
                    done ? 'bg-teal-accent/70 text-white' : 'bg-white/20 text-white/50'
                  )}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={clsx('text-xs hidden sm:inline', active ? 'text-white font-semibold' : 'text-white/40')}>
                    {stepLabels[i]}
                  </span>
                  {i < 2 && <div className="w-4 h-px bg-white/25 hidden sm:block"/>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* ── STEP 1: Start ── */}
          {step === 'start' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="p-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upload your CV</p>
                  <CVUpload onTextExtracted={handleTextExtracted} />
                </div>
                <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 min-h-[200px]">
                  {isExtracting ? (
                    <RadarSpinner label="Analysing your CV…" />
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-teal-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">AI-powered matching</p>
                      <p className="text-xs text-gray-400 max-w-[200px] mb-4">We extract your skills and score every job against your profile</p>
                      <div className="text-left bg-teal-light/60 rounded-xl px-4 py-3 max-w-[220px]">
                        <p className="text-xs font-bold text-teal-dark mb-1">After upload you can:</p>
                        <p className="text-xs text-teal-dark/70">✏️ Edit the detected job title</p>
                        <p className="text-xs text-teal-dark/70">📍 Adjust your location</p>
                        <p className="text-xs text-teal-dark/70">🔍 Then launch the scan</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 'confirm' && (
            <div className="grid md:grid-cols-2 gap-5">

              {/* Left: form */}
              <div className="flex flex-col gap-4">
                {extracted && (
                  <div className="bg-teal-light rounded-2xl border border-teal-accent/30 p-4 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-teal-mid/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-teal-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-teal-dark uppercase tracking-wider mb-0.5">Detected from CV</p>
                      <p className="text-gray-700 text-sm">{extracted.title}{extracted.location && ` · ${extracted.location}`}</p>
                      {extracted.skills.length > 0 && (
                        <p className="text-gray-400 text-xs mt-0.5">{extracted.skills.slice(0, 5).join(', ')}{extracted.skills.length > 5 ? ' +more' : ''}</p>
                      )}
                    </div>
                    <button onClick={resetToStart} className="text-xs text-teal-mid font-semibold hover:underline shrink-0">Change</button>
                  </div>
                )}

                {extractError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">{extractError}</div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Job title <span className="text-red-400">*</span>
                      <span className="ml-2 text-gray-300 font-normal normal-case tracking-normal">✏️ correct if needed</span>
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior React Developer"
                      className="w-full border-2 border-teal-mid/40 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors text-sm font-medium"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Location <span className="text-gray-300 font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Montréal, QC · Remote"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleScan}
                  disabled={!jobTitle.trim() || isScanning}
                  className={clsx(
                    'w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all',
                    jobTitle.trim() && !isScanning
                      ? 'bg-teal-dark text-white hover:bg-teal-mid hover:shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {isScanning ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Scanning…</>
                  ) : '🔍 Scan Now'}
                </button>

                {scanError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {scanError.toLowerCase().includes('fetch') ? 'Cannot reach the backend — check NEXT_PUBLIC_API_URL.' : scanError}
                  </div>
                )}
              </div>

              {/* Right: radar animation or idle info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 min-h-[280px]">
                {isScanning ? (
                  <div className="text-center flex flex-col items-center gap-4">
                    <RadarSpinner size={72} label="" />
                    <div>
                      <p className="font-bold text-teal-dark text-base">Scanning for &ldquo;{jobTitle}&rdquo;{location ? ` in ${location}` : ''}…</p>
                      <p className="text-xs text-gray-400 mt-1">LinkedIn · Indeed · Glassdoor · Google · Last 15 days</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-20" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="36" stroke="#1D9E75" strokeWidth="3"/>
                      <circle cx="40" cy="40" r="24" stroke="#1D9E75" strokeWidth="2"/>
                      <circle cx="40" cy="40" r="12" stroke="#1D9E75" strokeWidth="2"/>
                      <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5"/>
                      <circle cx="40" cy="40" r="3.5" fill="#1D9E75"/>
                    </svg>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Ready to scan</p>
                    <p className="text-xs text-gray-400">Confirm your details and hit Scan Now</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Results ── */}
          {step === 'results' && results && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-extrabold text-teal-dark">
                    {results.matches.length} match{results.matches.length !== 1 ? 'es' : ''} found
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    from <span className="font-semibold text-gray-700">{results.total_jobs_scanned.toLocaleString()} jobs</span> scanned
                    {' '}· &ldquo;{jobTitle}&rdquo;{location ? ` in ${location}` : ''} · Last 15 days
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setStep('confirm')} className="text-xs font-semibold text-teal-mid border-2 border-teal-mid px-3 py-1.5 rounded-lg hover:bg-teal-light transition-colors">Refine</button>
                  <button onClick={resetToStart} className="text-xs font-semibold text-gray-500 border-2 border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors">New scan</button>
                </div>
              </div>

              {results.matches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                  <p className="text-gray-400 text-3xl mb-3">🔍</p>
                  <p className="font-semibold text-gray-700 mb-1">No jobs found</p>
                  <p className="text-gray-500 text-sm mb-4">Try a broader title or a different location.</p>
                  <button onClick={() => setStep('confirm')} className="text-sm font-semibold text-teal-mid underline underline-offset-2">Adjust search</button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
