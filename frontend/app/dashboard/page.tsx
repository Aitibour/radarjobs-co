'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import JobCard from '@/components/JobCard'
import AlertForm from '@/components/AlertForm'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'


interface MatchRow {
  id: string
  score: number
  matched_keywords: string[]
  missing_keywords: string[]
  summary: string
  created_at: string
  jobs: {
    title: string
    company: string
    url: string
    source: string
    location: string
    salary_min: number | null
    salary_max: number | null
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [lastScanned, setLastScanned] = useState<Date | null>(null)
  const [showAlertForm, setShowAlertForm] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      setUser(session.user)
      await fetchMatches(session.user.id)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMatches = async (userId: string) => {
    setIsLoadingMatches(true)
    const { data, error } = await supabase
      .from('matches')
      .select('*, jobs(*)')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(10)

    if (!error && data) {
      setMatches(data as MatchRow[])
      if (data.length > 0) {
        setLastScanned(new Date(data[0].created_at))
      }
    }
    setIsLoadingMatches(false)
  }

  const getLastScannedLabel = () => {
    if (!lastScanned) return 'Never'
    const diffMs = Date.now() - lastScanned.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return 'Less than an hour ago'
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── Top bar ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-teal-dark">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Last scanned: <span className="font-medium text-gray-700">{getLastScannedLabel()}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAlertForm((v) => !v)}
              className="border-2 border-teal-mid text-teal-mid font-semibold px-4 py-2 rounded-xl hover:bg-teal-light transition-colors text-sm"
            >
              {showAlertForm ? 'Hide Alerts' : 'Alert Preferences'}
            </button>
            <Link
              href="/scan"
              className="bg-teal-dark text-white font-bold px-5 py-2 rounded-xl hover:bg-teal-mid transition-colors text-sm inline-flex items-center gap-1.5"
            >
              New Scan →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-teal-dark">{matches.length}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Total matches</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-teal-mid">
              {matches.length > 0 ? `${matches[0].score}%` : '—'}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Top score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-gray-700">
              {matches.length > 0
                ? `${Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length)}%`
                : '—'}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Avg score</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-5">

          {/* Alert form */}
          {showAlertForm && (
            <div className="mb-5">
              <AlertForm />
            </div>
          )}

          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Matches</h2>
            {matches.length > 0 && (
              <span className="text-sm text-gray-400">{matches.length} result{matches.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {isLoadingMatches ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-teal-light rounded-3xl p-12 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-10 h-10 text-teal-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="M11 4a7 7 0 0 1 7 7" className="animate-ping origin-center" style={{ transformOrigin: '11px 11px' }} />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-teal-dark mb-2">No scans yet</h3>
                <p className="text-gray-500 mb-5 max-w-xs mx-auto">
                  Run your first radar scan to see scored job matches here.
                </p>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 bg-teal-dark text-white font-bold px-7 py-3 rounded-full hover:bg-teal-mid transition-colors"
                >
                  Run your first scan →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <JobCard key={match.id} job={{
                    job_title: match.jobs.title,
                    company: match.jobs.company,
                    url: match.jobs.url,
                    score: match.score,
                    matched_keywords: match.matched_keywords,
                    missing_keywords: match.missing_keywords,
                    summary: match.summary,
                    source: match.jobs.source,
                    location: match.jobs.location,
                    salary_min: match.jobs.salary_min ?? undefined,
                    salary_max: match.jobs.salary_max ?? undefined,
                  }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
