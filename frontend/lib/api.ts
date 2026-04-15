const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ScanRequest {
  cv_text: string
  job_title: string
  location: string
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

export async function scanCV(data: ScanRequest, token?: string): Promise<ScanResponse> {
  const res = await fetchWithAuth('/scan', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token)
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
