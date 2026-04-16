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
    const raw = sessionStorage.getItem('radarjobs_scan')
    const scan = raw ? JSON.parse(raw) : {}
    const jobs: JobCardProps['job'][] = scan.matches ?? []
    if (!jobs.find((j) => j.url === job.url)) {
      scan.matches = [...jobs, job]
      sessionStorage.setItem('radarjobs_scan', JSON.stringify(scan))
    }
    router.push(`/scan/job?url=${encodeURIComponent(job.url)}`)
  }

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
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
      <div className="px-5 pb-3 flex gap-4 text-xs font-semibold">
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
