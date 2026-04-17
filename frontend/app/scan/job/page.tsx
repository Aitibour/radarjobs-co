'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { enhanceCV, generateCoverLetter, generateInterviewPrep } from '@/lib/api'
import type { JobMatch, InterviewPrepResult } from '@/lib/api'
import ScoreRing from '@/components/ScoreRing'
import { getSupabaseClient } from '@/lib/supabase'

type Status = 'saved' | 'applied' | null
type Tab = 'overview' | 'cv' | 'cover-letter' | 'interview'

function getStatuses(): Record<string, Status> {
  try { return JSON.parse(localStorage.getItem('radarjobs_statuses') ?? '{}') } catch { return {} }
}
function persistStatus(url: string, status: Status) {
  const s = getStatuses()
  if (status === null) delete s[url]; else s[url] = status
  localStorage.setItem('radarjobs_statuses', JSON.stringify(s))
}

// ─── Styled PDF download matching the Canadian CV template ────────────────
async function downloadPDF(text: string, filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })

  const M = 18
  const PW = doc.internal.pageSize.getWidth()
  const CW = PW - M * 2
  let y = M

  const T: [number, number, number] = [8, 80, 65]    // teal
  const D: [number, number, number] = [28, 28, 28]    // dark
  const G: [number, number, number] = [110, 110, 110] // gray

  const chk = (need = 8) => { if (y + need > 248) { doc.addPage(); y = M } }

  const lines = text.split('\n')
  let nb = 0   // non-blank line count
  let stage = 0 // 0=name 1=role 2=contact 3+=body

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      if (stage >= 3) y += 2
      continue
    }
    nb++

    // ── Name
    if (nb === 1) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(21)
      doc.setTextColor(...D)
      doc.text(line, M, y)
      y += 9; stage = 1; continue
    }

    // ── Role subtitle (second non-blank, mixed case)
    if (nb === 2 && line !== line.toUpperCase()) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.setTextColor(...T)
      doc.text(line, M, y)
      y += 4
      doc.setDrawColor(...T); doc.setLineWidth(0.3)
      doc.line(M, y, PW - M, y)
      y += 5; stage = 2; continue
    }

    // ── Contact line
    if (stage <= 2 && /@|linkedin|\+\d|\(\d{3}\)|\d{3}[-.\s]\d{3}/i.test(line)) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...G)
      doc.text(line, M, y)
      y += 8; stage = 3; continue
    }

    if (stage < 3) stage = 3

    // ── Section headers (ALL CAPS, no bullets, no pipes, no digits at start)
    if (
      line === line.toUpperCase() && line.length > 2 && line.length < 60 &&
      !line.startsWith('•') && !/^\d/.test(line) && !line.includes('|')
    ) {
      chk(12); y += 3
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...T)
      doc.text(line, M, y)
      y += 2.5
      doc.setDrawColor(...T); doc.setLineWidth(0.5)
      doc.line(M, y, PW - M, y)
      y += 5; continue
    }

    // ── Bullet points
    if (line.startsWith('•')) {
      chk(7)
      const txt = line.replace(/^•\s*/, '')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...D)
      const wrapped = doc.splitTextToSize(txt, CW - 7)
      doc.text('•', M + 2, y)
      doc.text(wrapped, M + 7, y)
      y += wrapped.length * 5 + 1; continue
    }

    // ── Job line "Title | Company | City | YYYY – YYYY"
    if (line.includes('|') && /\d{4}/.test(line)) {
      chk(10); y += 2
      const parts = line.split('|').map(p => p.trim())
      const title = parts[0]
      const rest = ' | ' + parts.slice(1).join(' | ')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...D)
      const tw = doc.getTextWidth(title)
      doc.text(title, M, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...G)
      if (tw + doc.getTextWidth(rest) < CW) {
        doc.text(rest, M + tw, y)
        y += 5.5
      } else {
        y += 5
        const wrest = doc.splitTextToSize(parts.slice(1).join(' | '), CW - 4)
        doc.text(wrest, M + 4, y)
        y += wrest.length * 4.5 + 1
      }
      doc.setTextColor(...D); continue
    }

    // ── Skills category "Category: skill, skill"
    if (/^[A-Za-z][A-Za-z\s&]+:\s/.test(line)) {
      chk(7)
      const ci = line.indexOf(':')
      const cat = line.substring(0, ci)
      const det = line.substring(ci + 1).trim()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...T)
      const cw2 = doc.getTextWidth(cat + ': ')
      doc.text(cat + ': ', M, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...D)
      const wrapped = doc.splitTextToSize(det, CW - cw2)
      doc.text(wrapped[0] ?? '', M + cw2, y)
      for (let i = 1; i < wrapped.length; i++) {
        y += 5
        doc.text(wrapped[i], M + cw2, y)
      }
      y += 5.5; continue
    }

    // ── Body text
    chk(7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...D)
    const wrapped = doc.splitTextToSize(line, CW)
    doc.text(wrapped, M, y)
    y += wrapped.length * 5 + 1
  }

  doc.save(filename)
}

// ─── Styled Word download matching the Canadian CV template ───────────────
async function downloadWord(text: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun, BorderStyle } = await import('docx')

  const TEAL = '085041'
  const DARK = '1C1C1C'
  const GRAY = '6E6E6E'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paragraphs: any[] = []
  const lines = text.split('\n')
  let nb = 0
  let stage = 0

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 80 } }))
      continue
    }
    nb++

    if (nb === 1) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 40, color: DARK })],
        spacing: { after: 60 },
      }))
      stage = 1; continue
    }

    if (nb === 2 && line !== line.toUpperCase()) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, italics: true, size: 22, color: TEAL })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 4 } },
        spacing: { after: 80 },
      }))
      stage = 2; continue
    }

    if (stage <= 2 && /@|linkedin|\+\d|\(\d{3}\)/i.test(line)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, size: 17, color: GRAY })],
        spacing: { after: 180 },
      }))
      stage = 3; continue
    }

    if (stage < 3) stage = 3

    if (
      line === line.toUpperCase() && line.length > 2 && line.length < 60 &&
      !line.startsWith('•') && !/^\d/.test(line) && !line.includes('|')
    ) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 20, color: TEAL })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 4 } },
        spacing: { before: 240, after: 100 },
      }))
      continue
    }

    if (line.startsWith('•')) {
      const txt = line.replace(/^•\s*/, '')
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: txt, size: 19, color: DARK })],
        bullet: { level: 0 },
        spacing: { after: 40 },
      }))
      continue
    }

    if (line.includes('|') && /\d{4}/.test(line)) {
      const parts = line.split('|').map(p => p.trim())
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: parts[0], bold: true, size: 20, color: DARK }),
          new TextRun({ text: ' | ' + parts.slice(1).join(' | '), size: 18, color: GRAY }),
        ],
        spacing: { before: 120, after: 60 },
      }))
      continue
    }

    if (/^[A-Za-z][A-Za-z\s&]+:\s/.test(line)) {
      const ci = line.indexOf(':')
      const cat = line.substring(0, ci)
      const det = line.substring(ci + 1).trim()
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: cat + ': ', bold: true, size: 19, color: TEAL }),
          new TextRun({ text: det, size: 19, color: DARK }),
        ],
        spacing: { after: 60 },
      }))
      continue
    }

    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: line, size: 19, color: DARK })],
      spacing: { after: 60 },
    }))
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
      children: paragraphs,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── CV template renderer ─────────────────────────────────────────────────
function CVTemplate({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trimEnd())
  type El = { type: 'name'|'role'|'contact'|'header'|'job-line'|'skill-cat'|'bullet'|'body'|'blank'; text: string }
  const els: El[] = []
  let nb = 0
  let stage = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { els.push({ type: 'blank', text: '' }); continue }
    nb++

    if (nb === 1) { els.push({ type: 'name', text: line }); stage = 1; continue }
    if (nb === 2 && line !== line.toUpperCase()) { els.push({ type: 'role', text: line }); stage = 2; continue }
    if (stage <= 2 && /@|linkedin|\+\d|\(\d{3}\)/i.test(line)) { els.push({ type: 'contact', text: line }); stage = 3; continue }
    if (stage < 3) stage = 3

    if (line === line.toUpperCase() && line.length > 2 && line.length < 60 && !line.startsWith('•') && !/^\d/.test(line) && !line.includes('|')) {
      els.push({ type: 'header', text: line }); continue
    }
    if (line.startsWith('•')) { els.push({ type: 'bullet', text: line.replace(/^•\s*/, '') }); continue }
    if (line.includes('|') && /\d{4}/.test(line)) { els.push({ type: 'job-line', text: line }); continue }
    if (/^[A-Za-z][A-Za-z\s&]+:\s/.test(line)) { els.push({ type: 'skill-cat', text: line }); continue }
    els.push({ type: 'body', text: line })
  }

  return (
    <div className="font-sans text-gray-800 max-w-2xl mx-auto">
      {els.map((s, i) => {
        if (s.type === 'blank') return <div key={i} className="h-2.5" />
        if (s.type === 'name') return <h1 key={i} className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">{s.text}</h1>
        if (s.type === 'role') return <p key={i} className="text-sm italic text-teal-dark mb-1 border-b border-teal-mid pb-1">{s.text}</p>
        if (s.type === 'contact') return <p key={i} className="text-xs text-gray-500 mb-3">{s.text}</p>
        if (s.type === 'header') return (
          <div key={i} className="mt-5 mb-2 border-b-2 border-teal-mid pb-1">
            <h2 className="text-xs font-extrabold text-teal-dark uppercase tracking-widest">{s.text}</h2>
          </div>
        )
        if (s.type === 'job-line') {
          const parts = s.text.split('|').map(p => p.trim())
          return (
            <p key={i} className="text-sm mt-2 mb-0.5">
              <span className="font-bold text-gray-900">{parts[0]}</span>
              {parts.length > 1 && <span className="text-gray-500 font-normal"> | {parts.slice(1).join(' | ')}</span>}
            </p>
          )
        }
        if (s.type === 'skill-cat') {
          const ci = s.text.indexOf(':')
          const cat = s.text.substring(0, ci)
          const det = s.text.substring(ci + 1).trim()
          return (
            <p key={i} className="text-sm mb-1 leading-relaxed">
              <span className="font-bold text-teal-dark">{cat}: </span>
              <span className="text-gray-700">{det}</span>
            </p>
          )
        }
        if (s.type === 'bullet') return (
          <div key={i} className="flex gap-2 text-sm leading-relaxed mb-0.5 pl-1">
            <span className="text-teal-mid shrink-0 mt-0.5">•</span>
            <span className="text-gray-700">{s.text}</span>
          </div>
        )
        return <p key={i} className="text-sm text-gray-600 leading-relaxed mb-0.5">{s.text}</p>
      })}
    </div>
  )
}

// ─── Animated score hook ──────────────────────────────────────────────────
function useAnimatedScore(target: number, duration = 1400) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    const start = prev.current
    const end = target
    prev.current = target
    if (start === end) return
    let step = 0
    const steps = 50
    const iv = setInterval(() => {
      step++
      const t = step / steps
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (step >= steps) clearInterval(iv)
    }, duration / steps)
    return () => clearInterval(iv)
  }, [target, duration])
  return display
}

// ─── Main component ───────────────────────────────────────────────────────
function JobDetailInner() {
  const router = useRouter()
  const params = useSearchParams()
  const jobUrl = params.get('url') ?? ''

  const [job, setJob] = useState<JobMatch | null>(null)
  const [cvText, setCvText] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [status, setStatus] = useState<Status>(null)

  const [enhancedCV, setEnhancedCV] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [keywordsAdded, setKeywordsAdded] = useState(false)
  const [newScore, setNewScore] = useState<number | null>(null)

  const [coverLetter, setCoverLetter] = useState('')
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false)
  const [letterError, setLetterError] = useState<string | null>(null)

  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepResult | null>(null)
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false)
  const [prepError, setPrepError] = useState<string | null>(null)
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  const cvScrollRef = useRef<HTMLDivElement>(null)

  const scoreTarget = newScore ?? (job?.score ?? 0)
  const displayScore = useAnimatedScore(scoreTarget)
  const scoreColor = displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-amber-500' : 'text-red-500'
  const scoreDelta = newScore !== null && job ? newScore - job.score : 0

  useEffect(() => {
    const raw = sessionStorage.getItem('radarjobs_scan')
    if (!raw) { router.replace('/scan'); return }
    const scan = JSON.parse(raw)
    const found = (scan.matches as JobMatch[]).find((m) => m.url === jobUrl)
    if (!found) { router.replace('/scan'); return }
    setJob(found)
    setCvText(scan.cvText ?? '')
    setStatus(getStatuses()[jobUrl] ?? null)
  }, [jobUrl, router])

  const handleEnhanceCV = async () => {
    if (!job) return
    setIsEnhancing(true)
    setEnhanceError(null)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const result = await enhanceCV(cvText, job.missing_keywords, job.job_title, job.company, session?.access_token)
      setEnhancedCV(result)
      setKeywordsAdded(true)
      const estimated = Math.min(98, job.score + Math.round(job.missing_keywords.length * 4))
      setNewScore(estimated)
      setTab('cv')
      setTimeout(() => { cvScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, 100)
    } catch {
      setEnhanceError('Enhancement failed. Try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleGenerateLetter = async () => {
    if (!job) return
    setIsGeneratingLetter(true)
    setLetterError(null)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const result = await generateCoverLetter(cvText, job.job_title, job.company, job.description ?? '', session?.access_token)
      setCoverLetter(result)
      setTab('cover-letter')
    } catch {
      setLetterError('Cover letter generation failed. Try again.')
    } finally {
      setIsGeneratingLetter(false)
    }
  }

  const handleGeneratePrep = async () => {
    if (!job) return
    setIsGeneratingPrep(true)
    setPrepError(null)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const result = await generateInterviewPrep(cvText, job.job_title, job.company, job.description ?? '', session?.access_token)
      setInterviewPrep(result)
      setTab('interview')
    } catch {
      setPrepError('Interview prep failed. Try again.')
    } finally {
      setIsGeneratingPrep(false)
    }
  }

  const handleStatusToggle = (s: 'saved' | 'applied') => {
    const next: Status = status === s ? null : s
    setStatus(next)
    persistStatus(jobUrl, next)
  }

  if (!job) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading…</p>
    </div>
  )

  const activeCVText = enhancedCV || cvText

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* Top bar */}
      <div className="shrink-0 bg-gradient-to-r from-teal-dark to-teal-mid px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white text-sm flex items-center gap-1 font-medium">
            ← Back
          </button>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => handleStatusToggle('saved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${status === 'saved' ? 'bg-amber-400 border-amber-400 text-white' : 'border-white/40 text-white hover:border-white'}`}>
              {status === 'saved' ? '★ Saved' : '☆ Save'}
            </button>
            <button onClick={() => handleStatusToggle('applied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${status === 'applied' ? 'bg-green-500 border-green-500 text-white' : 'border-white/40 text-white hover:border-white'}`}>
              {status === 'applied' ? '✓ Applied' : 'Mark Applied'}
            </button>
            <a href={job.url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-teal-dark hover:bg-teal-light transition-colors">
              Apply Now →
            </a>
          </div>
        </div>
      </div>

      {/* Job header */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <ScoreRing score={displayScore} size={56} strokeWidth={6} />
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-gray-900 text-base leading-tight truncate">{job.job_title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            <span className={`text-2xl font-extrabold tabular-nums leading-none ${scoreColor}`}>
              {displayScore}%
            </span>
            {scoreDelta > 0 && (
              <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                +{scoreDelta} pts ✨
              </span>
            )}
            {scoreDelta > 0 && <span className="text-[10px] text-gray-400">AI-enhanced</span>}
          </div>
        </div>
      </div>

      {/* AI action bar */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
          <button onClick={handleEnhanceCV}
            disabled={isEnhancing || job.missing_keywords.length === 0 || keywordsAdded}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isEnhancing
              ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Enhancing CV…</>
              : keywordsAdded ? '✨ CV Enhanced' : '✨ Magic AI — Add missing keywords'}
          </button>
          <button onClick={handleGenerateLetter} disabled={isGeneratingLetter}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isGeneratingLetter
              ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating…</>
              : '📝 Cover Letter'}
          </button>
          <button onClick={handleGeneratePrep} disabled={isGeneratingPrep}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-xs hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {isGeneratingPrep
              ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Preparing…</>
              : '🎯 Interview Prep'}
          </button>
          {(enhanceError || letterError || prepError) && <p className="text-red-500 text-xs">{enhanceError ?? letterError ?? prepError}</p>}

          <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['overview', 'cv', 'cover-letter', 'interview'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === t ? 'bg-white text-teal-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'overview' ? 'Overview'
                  : t === 'cv' ? `CV${enhancedCV ? ' ✨' : ''}`
                  : t === 'cover-letter' ? `Letter${coverLetter ? ' ✓' : ''}`
                  : `Interview${interviewPrep ? ' ✓' : ''}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-4">

          {/* Overview */}
          {tab === 'overview' && (
            <div className="h-full grid lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="shrink-0 px-5 pt-4 pb-2 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-700">Job Description</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {job.description
                    ? <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    : <p className="text-sm text-gray-400 italic">No description available.</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto">
                <p className="text-xs text-gray-400 italic shrink-0">{job.summary}</p>

                {job.matched_keywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 shrink-0">
                    <h2 className="text-xs font-bold text-green-600 mb-2">✓ Matched ({job.matched_keywords.length})</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {job.matched_keywords.map(kw => (
                        <span key={kw} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {job.missing_keywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 shrink-0">
                    {keywordsAdded ? (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none">✨</span>
                        <div>
                          <p className="text-sm font-bold text-purple-700">Missing keywords added to your CV!</p>
                          <p className="text-xs text-gray-400 mt-1">Reformatted to Canadian ATS standard. Ready to download.</p>
                          <button onClick={() => setTab('cv')} className="mt-2 text-xs text-purple-600 font-semibold hover:underline">
                            View enhanced CV →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xs font-bold text-red-500 mb-2">✗ Missing ({job.missing_keywords.length})</h2>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {job.missing_keywords.map(kw => (
                            <span key={kw} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">{kw}</span>
                          ))}
                        </div>
                        <button onClick={handleEnhanceCV} disabled={isEnhancing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
                          {isEnhancing
                            ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Enhancing…</>
                            : '✨ Magic AI — Add to my CV automatically'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CV tab */}
          {tab === 'cv' && (
            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-gray-700">
                    {enhancedCV ? '✨ Enhanced CV — Canadian Template' : 'Your CV'}
                  </h2>
                  {enhancedCV && (
                    <p className="text-xs text-gray-400 mt-0.5">ATS-optimized · No dashes or asterisks · Bullet format · Ready to apply</p>
                  )}
                </div>
                {enhancedCV && (
                  <div className="flex items-center gap-3">
                    {scoreDelta > 0 && (
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block leading-tight">New score</span>
                        <span className="text-lg font-extrabold text-purple-600 tabular-nums leading-tight">
                          {displayScore}%
                          <span className="text-xs font-bold text-green-600 ml-1">+{scoreDelta}</span>
                        </span>
                      </div>
                    )}
                    <button onClick={() => downloadPDF(enhancedCV, 'cv-enhanced.pdf')}
                      className="px-3 py-1.5 rounded-lg bg-teal-dark text-white text-xs font-semibold hover:bg-teal-mid transition-colors">
                      Download PDF
                    </button>
                    <button onClick={() => downloadWord(enhancedCV, 'cv-enhanced.docx')}
                      className="px-3 py-1.5 rounded-lg border-2 border-teal-mid text-teal-dark text-xs font-semibold hover:bg-teal-light transition-colors">
                      Download Word
                    </button>
                  </div>
                )}
              </div>
              <div ref={cvScrollRef} className="flex-1 overflow-y-auto px-8 py-6">
                <CVTemplate text={activeCVText || 'No CV text available.'} />
              </div>
            </div>
          )}

          {/* Cover letter tab */}
          {tab === 'cover-letter' && (
            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-bold text-gray-700">Cover Letter</h2>
                {coverLetter && (
                  <div className="flex gap-2">
                    <button onClick={() => downloadPDF(coverLetter, 'cover-letter.pdf')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                      PDF
                    </button>
                    <button onClick={() => downloadWord(coverLetter, 'cover-letter.docx')}
                      className="px-3 py-1.5 rounded-lg border-2 border-blue-500 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors">
                      Word
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {coverLetter ? (
                  <div className="max-w-2xl mx-auto font-sans text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {coverLetter}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <p className="text-gray-400 text-sm">No cover letter generated yet.</p>
                    <button onClick={handleGenerateLetter} disabled={isGeneratingLetter}
                      className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isGeneratingLetter ? 'Generating…' : '📝 Generate Cover Letter'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Interview Prep tab */}
          {tab === 'interview' && (
            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">🎯 Interview Prep</h2>
                <p className="text-xs text-gray-400 mt-0.5">Tailored questions + coached answers based on your CV and this job</p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {interviewPrep ? (
                  <div className="max-w-2xl mx-auto flex flex-col gap-6">

                    {/* Opening pitch */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Tell me about yourself</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{interviewPrep.opening_pitch}</p>
                    </div>

                    {/* Questions accordion */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Likely interview questions</p>
                      {interviewPrep.questions.map((q, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
                            className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                            <span className="text-sm font-semibold text-gray-800 leading-snug">{q.question}</span>
                            <span className={`text-gray-400 shrink-0 mt-0.5 transition-transform ${openQuestion === i ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                          {openQuestion === i && (
                            <div className="px-5 pb-4 bg-teal-dark/[0.02] border-t border-gray-50">
                              <p className="text-xs font-bold text-teal-dark uppercase tracking-wider mb-2 mt-3">Coached answer</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{q.coached_answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="text-5xl">🎯</div>
                    <div className="text-center">
                      <p className="text-gray-700 font-semibold text-sm mb-1">AI-powered interview coaching</p>
                      <p className="text-gray-400 text-xs max-w-xs">Get 5 tailored interview questions with coached answers based on your CV and this specific role.</p>
                    </div>
                    <button onClick={handleGeneratePrep} disabled={isGeneratingPrep}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors">
                      {isGeneratingPrep
                        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Preparing your questions…</>
                        : '🎯 Generate Interview Prep'}
                    </button>
                    {prepError && <p className="text-red-500 text-xs">{prepError}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    }>
      <JobDetailInner />
    </Suspense>
  )
}
