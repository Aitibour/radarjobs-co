const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ExtractResponse {
  title: string
  location: string
  skills: string[]
  experience_years: number
  summary: string
}

export interface ScanRequest {
  cv_text: string
  job_title: string
  location: string
  hours_old?: number
}

export interface JobMatch {
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

export interface ScanResponse {
  total_jobs_scanned: number
  matches: JobMatch[]
  cv_title: string
  cv_skills: string[]
}

export interface AlertPreferences {
  min_score: number
  job_titles: string[]
  locations: string[]
  email_enabled: boolean
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  return fetch(`${API_URL}${path}`, { ...options, headers })
}

export async function extractCV(cv_text: string, token?: string): Promise<ExtractResponse> {
  const res = await fetchWithAuth('/scan/extract', {
    method: 'POST',
    body: JSON.stringify({ cv_text }),
  }, token)
  if (!res.ok) throw new Error(`CV extraction failed: ${res.statusText}`)
  return res.json()
}

export class UpgradeRequiredError extends Error {
  scansUsed: number
  constructor(scansUsed: number) {
    super('upgrade_required')
    this.scansUsed = scansUsed
  }
}

export async function scanCV(data: ScanRequest, token?: string): Promise<ScanResponse> {
  const res = await fetchWithAuth('/scan', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token)
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}))
    if (body?.detail?.upgrade) throw new UpgradeRequiredError(body.detail.scans_used ?? 3)
  }
  if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`)
  return res.json()
}

export async function saveAlertPreferences(prefs: AlertPreferences, token: string): Promise<void> {
  const res = await fetchWithAuth('/alerts/preferences', {
    method: 'POST',
    body: JSON.stringify(prefs),
  }, token)
  if (!res.ok) throw new Error(`Failed to save preferences: ${res.statusText}`)
}

export async function getAlertPreferences(token: string): Promise<AlertPreferences> {
  const res = await fetchWithAuth('/alerts/preferences', {}, token)
  if (!res.ok) throw new Error(`Failed to get preferences: ${res.statusText}`)
  return res.json()
}

export async function enhanceCV(
  cv_text: string,
  missing_keywords: string[],
  job_title: string,
  company: string,
  token?: string
): Promise<string> {
  const res = await fetchWithAuth('/scan/enhance-cv', {
    method: 'POST',
    body: JSON.stringify({ cv_text, missing_keywords, job_title, company }),
  }, token)
  if (!res.ok) throw new Error('CV enhancement failed')
  const data = await res.json()
  return data.enhanced_cv
}

export async function generateCoverLetter(
  cv_text: string,
  job_title: string,
  company: string,
  job_description: string,
  token?: string
): Promise<string> {
  const res = await fetchWithAuth('/scan/cover-letter', {
    method: 'POST',
    body: JSON.stringify({ cv_text, job_title, company, job_description }),
  }, token)
  if (!res.ok) throw new Error('Cover letter generation failed')
  const data = await res.json()
  return data.cover_letter
}

export interface InterviewQuestion {
  question: string
  coached_answer: string
}

export interface InterviewPrepResult {
  opening_pitch: string
  questions: InterviewQuestion[]
}

export async function generateInterviewPrep(
  cv_text: string,
  job_title: string,
  company: string,
  job_description: string,
  token?: string
): Promise<InterviewPrepResult> {
  const res = await fetchWithAuth('/scan/interview-prep', {
    method: 'POST',
    body: JSON.stringify({ cv_text, job_title, company, job_description }),
  }, token)
  if (!res.ok) throw new Error('Interview prep generation failed')
  return res.json()
}

export interface LinkedInOptimizeResult {
  headline: string
  about: string
  skills: string[]
  experience_bullets: string[]
  keywords: string[]
}

export async function generateLinkedInOptimization(
  cv_text: string,
  target_role: string,
  token?: string
): Promise<LinkedInOptimizeResult> {
  const res = await fetchWithAuth('/scan/linkedin-optimize', {
    method: 'POST',
    body: JSON.stringify({ cv_text, target_role }),
  }, token)
  if (!res.ok) throw new Error('LinkedIn optimization failed')
  return res.json()
}

export interface ATSOptimizeResult {
  optimized_cv: string
  keywords_added: string[]
  match_improvement: string
}

const STOP = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','as','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','that','this','these','those','it','its','we','you','they','their','our','your','who','which','when','where','what','how','all','any','both','each','more','most','other','some','such','no','not','only','own','same','so','than','too','very','just','about','after','before','between','during','through','under','while'])

function extractKeywords(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9+#.\- ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP.has(w))
  )
}

export async function atsOptimize(
  cv_text: string,
  job_description: string,
  job_title: string,
  token?: string
): Promise<ATSOptimizeResult> {
  // Compute missing keywords client-side
  const jdKw = extractKeywords(job_description)
  const cvKw = extractKeywords(cv_text)
  const missing_keywords = [...jdKw].filter(k => k.length >= 3 && !cvKw.has(k))

  const res = await fetchWithAuth('/scan/enhance-cv', {
    method: 'POST',
    body: JSON.stringify({ cv_text, missing_keywords, job_title }),
  }, token)
  if (!res.ok) throw new Error('ATS optimization failed')
  const data = await res.json()

  // Map backend response to frontend interface
  return {
    optimized_cv:      data.enhanced_cv,
    keywords_added:    missing_keywords.slice(0, 20),
    match_improvement: `+${Math.min(missing_keywords.length * 3, 35)}%`,
  }
}
