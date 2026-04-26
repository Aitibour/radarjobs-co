'use client'

import { useState, KeyboardEvent } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { scanCV, UpgradeRequiredError } from '@/lib/api'
import type { JobMatch, ScanResponse } from '@/lib/api'
import UpgradeModal from '@/components/UpgradeModal'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type DateFilter  = 'any' | 'today' | '3days' | 'week' | 'month'
type TypeFilter  = 'any' | 'fulltime' | 'parttime' | 'contract' | 'internship'
type WorkFilter  = 'any' | 'remote' | 'onsite' | 'hybrid'

const DATE_OPTS: { label: string; val: DateFilter; hours: number }[] = [
  { label: 'Any time',   val: 'any',    hours: 8760 },
  { label: 'Today',      val: 'today',  hours: 24   },
  { label: 'Last 3 days',val: '3days',  hours: 72   },
  { label: 'This week',  val: 'week',   hours: 168  },
  { label: 'This month', val: 'month',  hours: 720  },
]
const TYPE_OPTS: { label: string; val: TypeFilter }[] = [
  { label: 'Any type',   val: 'any'       },
  { label: 'Full-time',  val: 'fulltime'  },
  { label: 'Part-time',  val: 'parttime'  },
  { label: 'Contract',   val: 'contract'  },
  { label: 'Internship', val: 'internship'},
]
const WORK_OPTS: { label: string; val: WorkFilter }[] = [
  { label: 'Any',      val: 'any'    },
  { label: 'Remote',   val: 'remote' },
  { label: 'On-site',  val: 'onsite' },
  { label: 'Hybrid',   val: 'hybrid' },
]

function matchesWork(job: JobMatch, filter: WorkFilter): boolean {
  if (filter === 'any') return true
  const loc = (job.location ?? '').toLowerCase()
  const sum = (job.summary ?? '').toLowerCase()
  const combined = loc + ' ' + sum
  if (filter === 'remote')  return combined.includes('remote')
  if (filter === 'hybrid')  return combined.includes('hybrid')
  if (filter === 'onsite')  return !combined.includes('remote') && !combined.includes('hybrid')
  return true
}

function matchesType(job: JobMatch, filter: TypeFilter): boolean {
  if (filter === 'any') return true
  const sum = (job.summary ?? '').toLowerCase()
  const title = (job.job_title ?? '').toLowerCase()
  const combined = sum + ' ' + title
  if (filter === 'fulltime')   return combined.includes('full-time') || combined.includes('full time') || combined.includes('permanent')
  if (filter === 'parttime')   return combined.includes('part-time') || combined.includes('part time')
  if (filter === 'contract')   return combined.includes('contract') || combined.includes('freelance')
  if (filter === 'internship') return combined.includes('intern')
  return true
}

function timeAgo(score: number) {
  const h = Math.round((1 - score / 100) * 48)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function ScanPage() {
  const [jobTitle, setJobTitle]     = useState('')
  const [location, setLocation]     = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills]         = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('any')
  const [workFilter, setWorkFilter] = useState<WorkFilter>('any')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [results, setResults]       = useState<ScanResponse | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [scansUsed, setScansUsed]   = useState(3)

  const supabase = getSupabaseClient()

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput('')
  }
  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() }
    if (e.key === 'Backspace' && !skillInput && skills.length) setSkills(prev => prev.slice(0, -1))
  }
  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))

  const handleSearch = async () => {
    if (!jobTitle.trim()) { setError('Please enter a job title.'); return }
    setError('')
    setLoading(true)
    setResults(null)
    const hours = DATE_OPTS.find(d => d.val === dateFilter)?.hours ?? 8760
    const cvText = skills.length ? `Skills: ${skills.join(', ')}` : ''
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await scanCV(
        { cv_text: cvText, job_title: jobTitle, location: location || 'Canada', hours_old: hours },
        session?.access_token
      )
      setResults(res)
    } catch (err) {
      if (err instanceof UpgradeRequiredError) {
        setScansUsed(err.scansUsed)
        setShowUpgrade(true)
      } else {
        setError('Search failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = results?.matches.filter(j => matchesWork(j, workFilter) && matchesType(j, typeFilter)) ?? []

  const scoreColor = (s: number) =>
    s >= 75 ? 'text-green-600 border-green-400' : s >= 50 ? 'text-teal-dark border-teal-mid' : 'text-gray-400 border-gray-300'

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {showUpgrade && <UpgradeModal scansUsed={scansUsed} onClose={() => setShowUpgrade(false)} />}
      <Navbar />

      {/* Search hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">AI Job Finder</h1>
          <p className="text-sm text-gray-400 mb-6">Search across LinkedIn, Indeed, Glassdoor and more — filtered by your skills.</p>

          {/* Main search row */}
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Job title — e.g. Product Manager"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors" />
            </div>
            <div className="flex-1 min-w-[160px] relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <input value={location} onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Location — e.g. Toronto, ON"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors" />
            </div>
            <button onClick={handleSearch} disabled={loading}
              className="px-8 py-3 rounded-xl bg-teal-dark text-white font-extrabold text-sm hover:bg-teal-mid transition-colors disabled:opacity-60 shadow-sm shrink-0 flex items-center gap-2">
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Searching…</>
              ) : 'Search Jobs'}
            </button>
          </div>

          {/* Skills input */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 shrink-0">Match my skills:</span>
            {skills.map(s => (
              <span key={s} className="flex items-center gap-1 text-xs font-semibold bg-teal-dark/10 text-teal-dark px-2.5 py-1 rounded-full border border-teal-mid/30">
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors ml-0.5">×</button>
              </span>
            ))}
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={onSkillKey} onBlur={addSkill}
              placeholder={skills.length ? 'Add skill…' : 'React, Python, SQL… (press Enter)'}
              className="text-xs border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-teal-mid placeholder-gray-300 bg-white" />
          </div>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6 flex-wrap">
          {/* Date */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Date</span>
            {DATE_OPTS.map(o => (
              <button key={o.val} onClick={() => setDateFilter(o.val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${dateFilter === o.val ? 'bg-teal-dark text-white border-teal-dark' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          {/* Type */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Type</span>
            {TYPE_OPTS.map(o => (
              <button key={o.val} onClick={() => setTypeFilter(o.val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${typeFilter === o.val ? 'bg-teal-dark text-white border-teal-dark' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          {/* Work */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Work</span>
            {WORK_OPTS.map(o => (
              <button key={o.val} onClick={() => setWorkFilter(o.val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${workFilter === o.val ? 'bg-teal-dark text-white border-teal-dark' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {!results && !loading && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto mb-5 opacity-15" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#1D9E75" strokeWidth="3"/>
              <circle cx="40" cy="40" r="24" stroke="#1D9E75" strokeWidth="2"/>
              <circle cx="40" cy="40" r="12" stroke="#1D9E75" strokeWidth="2"/>
              <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.7"/>
              <circle cx="40" cy="40" r="3.5" fill="#1D9E75"/>
            </svg>
            <p className="text-sm font-semibold text-gray-500 mb-2">Enter a job title to start searching</p>
            <p className="text-xs text-gray-400">Add skills to see how well each job matches your profile</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-5" style={{ animation: 'spin 2s linear infinite' }}>
              <svg viewBox="0 0 80 80" fill="none" className="w-14 h-14">
                <circle cx="40" cy="40" r="36" stroke="#E1F5EE" strokeWidth="3"/>
                <circle cx="40" cy="40" r="24" stroke="#C8EDE3" strokeWidth="2"/>
                <circle cx="40" cy="40" r="12" stroke="#C8EDE3" strokeWidth="2"/>
                <path d="M40 40 L40 4 A36 36 0 0 1 76 40 Z" fill="#5DCAA5" fillOpacity="0.6"/>
                <circle cx="40" cy="40" r="3.5" fill="#1D9E75"/>
              </svg>
            </div>
            <style jsx>{`div { animation: spin 2s linear infinite; } @keyframes spin { to { transform: rotate(360deg); }}`}</style>
            <p className="text-sm font-semibold text-teal-dark">Scanning {jobTitle} jobs{location ? ` in ${location}` : ''}…</p>
            <p className="text-xs text-gray-400 mt-1">LinkedIn · Indeed · Glassdoor · and more</p>
          </div>
        )}

        {results && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-lg font-extrabold text-gray-900">
                  {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  From {results.total_jobs_scanned.toLocaleString()} scanned · &ldquo;{jobTitle}&rdquo;{location ? ` · ${location}` : ''}
                  {skills.length ? ` · Matched against: ${skills.join(', ')}` : ''}
                </p>
              </div>
              <button onClick={() => setResults(null)} className="text-xs font-semibold text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                New search
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <p className="text-gray-400 font-semibold mb-2">No jobs match these filters</p>
                <p className="text-xs text-gray-400">Try removing a filter or broadening your search.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((job, i) => (
                  <div key={job.url ?? i} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-mid/30 transition-all p-5 flex items-start gap-4">
                    {/* Company initial avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-dark/10 to-teal-mid/20 border border-teal-mid/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-extrabold text-teal-dark">{job.company?.[0]?.toUpperCase() ?? '?'}</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold text-gray-900 leading-snug">{job.job_title}</p>
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">{job.company}</p>
                        </div>
                        {skills.length > 0 && (
                          <div className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center text-xs font-extrabold ${scoreColor(job.score)}`}>
                            {job.score}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {job.location && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {job.location}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-300">{timeAgo(job.score)}</span>
                        {job.salary_min && (
                          <span className="text-[11px] font-semibold text-green-600">
                            ${Math.round(job.salary_min / 1000)}k{job.salary_max ? `–$${Math.round(job.salary_max / 1000)}k` : '+'}
                          </span>
                        )}
                      </div>

                      {skills.length > 0 && job.matched_keywords.length > 0 && (
                        <div className="flex gap-1.5 mt-2.5 flex-wrap">
                          {job.matched_keywords.slice(0, 5).map(k => (
                            <span key={k} className="text-[10px] font-semibold bg-teal-dark/8 text-teal-dark px-2 py-0.5 rounded-full border border-teal-mid/20">{k}</span>
                          ))}
                          {job.matched_keywords.length > 5 && <span className="text-[10px] text-gray-400">+{job.matched_keywords.length - 5} more</span>}
                        </div>
                      )}
                    </div>

                    {/* Apply button */}
                    <a href={job.url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-xs font-bold bg-teal-dark text-white px-4 py-2 rounded-xl hover:bg-teal-mid transition-colors shadow-sm">
                      Apply →
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-10">
              <p className="text-xs text-gray-400 mb-3">Want your CV to match these jobs automatically?</p>
              <Link href="/ats-resume" className="inline-flex items-center gap-2 text-xs font-bold text-teal-dark border border-teal-mid/30 px-5 py-2.5 rounded-xl hover:bg-teal-light transition-colors">
                Optimize CV for ATS →
              </Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
