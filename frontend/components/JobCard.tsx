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
  }
}

function sourceBadge(source?: string) {
  if (!source) return null
  const label = source.charAt(0).toUpperCase()

  const colors: Record<string, string> = {
    LinkedIn: 'bg-blue-600',
    Indeed: 'bg-indigo-500',
    Glassdoor: 'bg-green-600',
  }
  const bg = colors[source] ?? 'bg-gray-500'

  return (
    <span
      className={`inline-flex items-center justify-center h-5 w-5 rounded text-white text-[10px] font-bold ${bg}`}
      title={source}
      aria-label={source}
    >
      {label}
    </span>
  )
}

function formatSalary(min?: number, max?: number): string | null {
  if (min == null && max == null) return null
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}/yr`
  if (min != null) return `From ${fmt(min)}/yr`
  return `Up to ${fmt(max!)}/yr`
}

export default function JobCard({ job }: JobCardProps) {
  const scoreColor =
    job.score >= 80
      ? 'bg-green-500 text-white'
      : job.score >= 60
      ? 'bg-amber-400 text-white'
      : 'bg-red-500 text-white'

  const salary = formatSalary(job.salary_min, job.salary_max)
  const visibleMissing = job.missing_keywords.slice(0, 5)
  const extraMissing = job.missing_keywords.length - visibleMissing.length

  return (
    <article className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3 flex items-start gap-4">
        {/* Score ring */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <ScoreRing score={job.score} size={64} strokeWidth={6} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreColor}`}>
            {job.score}% match
          </span>
        </div>

        {/* Title + company */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
            {job.job_title}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 font-medium">{job.company}</p>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            {sourceBadge(job.source)}
            {job.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {salary}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-100" />

      {/* Summary */}
      <div className="px-5 py-3">
        <p className="text-sm text-gray-500 italic line-clamp-2 leading-relaxed">
          {job.summary}
        </p>
      </div>

      {/* Keywords */}
      <div className="px-5 pb-4 space-y-3">
        {job.matched_keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-600 mb-1.5">&#10003; Matched</p>
            <div className="flex flex-wrap gap-1.5">
              {job.matched_keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {visibleMissing.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-400 mb-1.5">&#10007; Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleMissing.map((kw) => (
                <span
                  key={kw}
                  className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 border border-red-100"
                >
                  {kw}
                </span>
              ))}
              {extraMissing > 0 && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                  +{extraMissing} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="px-5 pb-5">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-teal-mid text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          Apply now
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>
  )
}
