'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { saveAlertPreferences, getAlertPreferences } from '@/lib/api'
import type { AlertPreferences } from '@/lib/api'

const DEFAULT_PREFS: AlertPreferences = {
  email_enabled: true,
  min_score: 70,
  job_titles: [],
  locations: [],
}

export default function AlertForm() {
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_PREFS)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [loading, setLoading] = useState(true)

  // On mount: fetch existing preferences
  useEffect(() => {
    async function fetchPrefs() {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const existing = await getAlertPreferences(session.access_token)
        if (existing) {
          setPrefs(existing)
        }
      } catch {
        // Non-fatal: just start with defaults
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [])

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSavedSuccess(false)

    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('You must be signed in to save preferences.')

      await saveAlertPreferences(prefs, session.access_token)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function addJobTitle() {
    const title = newJobTitle.trim()
    if (!title || prefs.job_titles.includes(title)) return
    setPrefs((p) => ({ ...p, job_titles: [...p.job_titles, title] }))
    setNewJobTitle('')
  }

  function removeJobTitle(title: string) {
    setPrefs((p) => ({ ...p, job_titles: p.job_titles.filter((t) => t !== title) }))
  }

  function addLocation() {
    const loc = newLocation.trim()
    if (!loc || prefs.locations.includes(loc)) return
    setPrefs((p) => ({ ...p, locations: [...p.locations, loc] }))
    setNewLocation('')
  }

  function removeLocation(loc: string) {
    setPrefs((p) => ({ ...p, locations: p.locations.filter((l) => l !== loc) }))
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-teal-light p-6 flex items-center justify-center h-48">
        <svg className="h-7 w-7 animate-spin text-teal-mid" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-teal-light p-6 space-y-6">
      {/* Title */}
      <h2 className="text-lg font-bold text-teal-dark flex items-center gap-2">
        <span aria-hidden="true">&#128231;</span> Email Alert Settings
      </h2>

      {/* Email enabled toggle */}
      <div className="flex items-center justify-between">
        <label htmlFor="email-toggle" className="text-sm font-medium text-teal-dark cursor-pointer">
          Enable email alerts
        </label>
        <button
          id="email-toggle"
          role="switch"
          aria-checked={prefs.email_enabled}
          onClick={() => setPrefs((p) => ({ ...p, email_enabled: !p.email_enabled }))}
          className={[
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-mid',
            prefs.email_enabled ? 'bg-teal-mid' : 'bg-gray-300',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
              prefs.email_enabled ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Min score slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="min-score" className="text-sm font-medium text-teal-dark">
            Minimum match score
          </label>
          <span className="text-sm font-bold text-teal-mid">{prefs.min_score}% match threshold</span>
        </div>
        <input
          id="min-score"
          type="range"
          min={0}
          max={100}
          step={5}
          value={prefs.min_score}
          onChange={(e) => setPrefs((p) => ({ ...p, min_score: Number(e.target.value) }))}
          className="w-full h-2 rounded-full appearance-none bg-white cursor-pointer accent-teal-mid"
          style={{ accentColor: '#1D9E75' }}
        />
        <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Job titles */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-teal-dark">Job titles</p>
        <div className="flex flex-wrap gap-2">
          {prefs.job_titles.map((title) => (
            <span
              key={title}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-teal-accent text-teal-dark text-xs font-medium"
            >
              {title}
              <button
                onClick={() => removeJobTitle(title)}
                className="ml-0.5 text-teal-mid hover:text-red-500 transition-colors leading-none"
                aria-label={`Remove ${title}`}
              >
                &times;
              </button>
            </span>
          ))}
          {prefs.job_titles.length === 0 && (
            <p className="text-xs text-gray-400 italic">No job titles added yet</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addJobTitle()}
            placeholder="e.g. Frontend Engineer"
            className="flex-1 rounded-lg border border-white bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-mid"
          />
          <button
            onClick={addJobTitle}
            disabled={!newJobTitle.trim()}
            className="px-4 py-1.5 rounded-lg bg-teal-mid text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Add
          </button>
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-teal-dark">Locations</p>
        <div className="flex flex-wrap gap-2">
          {prefs.locations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-teal-accent text-teal-dark text-xs font-medium"
            >
              {loc}
              <button
                onClick={() => removeLocation(loc)}
                className="ml-0.5 text-teal-mid hover:text-red-500 transition-colors leading-none"
                aria-label={`Remove ${loc}`}
              >
                &times;
              </button>
            </span>
          ))}
          {prefs.locations.length === 0 && (
            <p className="text-xs text-gray-400 italic">No locations added yet</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLocation()}
            placeholder="e.g. Remote, London, New York"
            className="flex-1 rounded-lg border border-white bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-mid"
          />
          <button
            onClick={addLocation}
            disabled={!newLocation.trim()}
            className="px-4 py-1.5 rounded-lg bg-teal-mid text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Add
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Save button + success feedback */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-mid text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isSaving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </>
          ) : (
            'Save preferences'
          )}
        </button>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 animate-fade-in">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </span>
        )}
      </div>
    </div>
  )
}
