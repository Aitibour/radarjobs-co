'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import CVUpload from '@/components/CVUpload'
import JobCard from '@/components/JobCard'
import { scanCV } from '@/lib/api'
import type { JobMatch, ScanResponse } from '@/lib/api'
import clsx from 'clsx'

export default function ScanPage() {
  const [cvText, setCvText] = useState('')
  const [cvTitle, setCvTitle] = useState('')
  const [cvSkillsCount, setCvSkillsCount] = useState(0)
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ScanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(0)
  const [sortOrder] = useState<'desc'>('desc')

  const supabase = getSupabaseClient()

  const handleTextExtracted = (text: string, meta?: { title?: string; skillsCount?: number }) => {
    setCvText(text)
    if (meta?.title) setCvTitle(meta.title)
    if (meta?.skillsCount) setCvSkillsCount(meta.skillsCount)
  }

  const handleScan = async () => {
    if (!cvText.trim()) {
      setError('Please upload or paste your CV first.')
      return
    }
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await scanCV(
        {
          cv_text: cvText,
          job_title: jobTitle || '',
          location: location || '',
        },
        token
      )
      setResults(response)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMatches: JobMatch[] = results
    ? results.matches
        .filter((m) => m.score >= minScore)
        .sort((a, b) => (sortOrder === 'desc' ? b.score - a.score : a.score - b.score))
    : []

  const canScan = cvText.trim().length > 0 && !isLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-teal-dark to-teal-mid py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Radar Scan
          </h1>
          <p className="text-white/70 text-lg">
            Upload your CV and we&apos;ll scan 50+ job boards for your best matches.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[420px_1fr] gap-8 items-start">

          {/* ── Left Panel (sticky) ── */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-5">

            {/* CV Upload */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-teal-light rounded-full flex items-center justify-center text-teal-dark font-black text-xs">1</span>
                Your CV
              </h2>
              <CVUpload onTextExtracted={handleTextExtracted} />

              {/* CV parsed summary */}
              {cvText && (
                <div className="mt-4 bg-teal-light rounded-xl px-4 py-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-mid flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-teal-dark font-medium">
                    CV parsed
                    {cvTitle ? `: ${cvTitle}` : ''}
                    {cvSkillsCount > 0 ? ` · ${cvSkillsCount} skills detected` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Job preferences */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-teal-light rounded-full flex items-center justify-center text-teal-dark font-black text-xs">2</span>
                Job Preferences
              </h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Job title <span className="text-gray-300 font-normal normal-case">(optional)</span>
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
                    placeholder="e.g. London, UK"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={!canScan}
              className={clsx(
                'w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-sm',
                canScan
                  ? 'bg-teal-dark text-white hover:bg-teal-mid hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Scanning…
                </>
              ) : (
                <>
                  🔍 Scan jobs now
                </>
              )}
            </button>

            {/* Loading detail */}
            {isLoading && (
              <div className="bg-teal-light rounded-2xl p-5 flex flex-col items-center gap-4">
                {/* Radar sweep animation */}
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
                  <p className="font-bold text-teal-dark">Scanning 50+ job boards…</p>
                  <p className="text-sm text-gray-500 mt-1">LinkedIn · Indeed · Glassdoor · Reed · Monster…</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* ── Right Panel ── */}
          <div className="flex flex-col gap-5">
            {results ? (
              <>
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
                        scanned
                      </p>
                    </div>

                    {/* Filter bar */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400 font-medium">Min score: {minScore}%</label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={minScore}
                          onChange={(e) => setMinScore(Number(e.target.value))}
                          className="w-32 accent-teal-mid"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 bg-teal-light text-teal-dark text-xs font-semibold px-3 py-1.5 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Score ↓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job cards */}
                {filteredMatches.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <p className="text-gray-500">No matches above {minScore}% score. Lower the filter to see more.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredMatches.map((job, i) => (
                      <JobCard key={job.url ?? i} job={job} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Empty state — radar waiting */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-5 text-center">
                {/* Pulsing radar */}
                <div className="relative w-28 h-28">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="absolute rounded-full border-2 border-teal-accent animate-ping"
                      style={{
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: '2.5s',
                        top: '50%',
                        left: '50%',
                        width: `${i * 36}px`,
                        height: `${i * 36}px`,
                        marginTop: `-${i * 18}px`,
                        marginLeft: `-${i * 18}px`,
                        opacity: 0.4 / i,
                      }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-14 h-14 text-teal-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="5" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <path strokeLinecap="round" d="M12 3a9 9 0 0 1 9 9" className="opacity-60" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Your matches will appear here</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Upload your CV and click &ldquo;Scan jobs now&rdquo; to see AI-scored job matches from 50+ boards.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
