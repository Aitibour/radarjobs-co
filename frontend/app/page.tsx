'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { redirectToCheckout } from '@/lib/stripe'
import Navbar from '@/components/Navbar'

/* ── Radar blips ─────────────────────────────────── */
const BLIPS = [
  { label: 'Senior Dev',      match: '87%', pos: { top: '-15px',    right: '-185px' }, delay: '0s'   },
  { label: 'ML Engineer',     match: '94%', pos: { top: '30px',     left: '-185px'  }, delay: '1.5s' },
  { label: 'Data Scientist',  match: '91%', pos: { top: '120px',    right: '-190px' }, delay: '3s'   },
  { label: 'DevOps Lead',     match: '82%', pos: { bottom: '30px',  left: '-185px'  }, delay: '4.5s' },
  { label: 'Product Manager', match: '88%', pos: { top: '-30px',    left: '55px'    }, delay: '6s'   },
  { label: 'Full Stack Dev',  match: '95%', pos: { bottom: '-15px', right: '-190px' }, delay: '7.5s' },
  { label: 'Cloud Architect', match: '79%', pos: { bottom: '80px',  left: '-185px'  }, delay: '9s'   },
  { label: 'UX Designer',     match: '83%', pos: { top: '190px',    right: '-190px' }, delay: '10.5s'},
]

/* ── Rotating headlines ──────────────────────────── */
const HEADLINES = [
  { line1: 'Put your CV on the Radar',       line2: 'for the right job.',          sub: 'AI scans 50+ job boards and ranks every match against your skills — free, in seconds.' },
  { line1: '3×',                              line2: 'More Interview Callbacks',    sub: 'Recruiters spend 7 seconds on your resume. Make every second count with AI keyword matching.' },
  { line1: 'Beat the ATS.',                  line2: 'Land the interview.',          sub: '99% of Fortune 500 use applicant tracking systems. Our AI reverse-engineers every one of them.' },
  { line1: 'Your AI career',                 line2: 'co-pilot is ready.',           sub: 'CV scan, ATS optimizer, cover letter, interview prep, LinkedIn optimizer — all in one place.' },
]

/* ── Feature tabs ────────────────────────────────── */
const TABS = ['Match Report', 'One-Click Optimize', 'Job Match', 'LinkedIn', 'Job Tracker', 'Resume Builder']

/* ── Pricing ─────────────────────────────────────── */
const FREE_FEATURES  = ['3 CV scans per month','5 job matches per scan','Match score + keyword analysis','Basic application tracking','No credit card required']
const PRO_FEATURES   = ['Unlimited CV scans','15 job matches per scan','Magic AI — add missing keywords','AI cover letter generation','Interview prep + coached answers','PDF & Word download','Daily email job alerts','Full application tracker','Priority support']

/* ── FAQ ─────────────────────────────────────────── */
const FAQS = [
  { q:'How do I know if my resume is ATS-compliant?', a:'Upload your CV and paste a job description. RadarJobs scores it against the job requirements and flags every formatting issue or missing keyword an ATS would catch — with specific, actionable fixes.' },
  { q:'What is a good match score?', a:'Target 75%+. Many users see callbacks at 65%+. Avoid scores above 85% — they can signal keyword stuffing. Aim for natural, well-matched language.' },
  { q:'Do ATS actually scan resumes?', a:'Yes. 99% of Fortune 500 use ATS to filter applicants before a recruiter sees your resume. The system scans for specific keywords, job titles, skills, and education requirements.' },
  { q:'PDF or Word — which should I submit?', a:'Our tests show most ATS parse .docx more accurately. Submit in Word format unless the posting requests PDF. RadarJobs lets you download both.' },
  { q:'How does Magic AI CV Enhancement work?', a:'After your scan reveals missing keywords, one click rewrites the relevant CV sections to include those terms naturally. The AI follows Canadian ATS formatting standards — clean bullets, no tables or graphics.' },
  { q:'Is RadarJobs free?', a:'Yes — 3 scans/month, no credit card. Pro unlocks unlimited scans, Magic AI, cover letter, interview prep, PDF/Word download, and daily email alerts.' },
]

const TESTIMONIALS = [
  { name:'Sarah K.', role:'Product Manager → Google', quote:'I went from no responses to 4 interviews in two weeks. The keyword gap showed me exactly what was missing — things I never would have noticed myself.', stars:5, img:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face' },
  { name:'Marcus T.', role:'Software Engineer → Shopify', quote:'Magic AI rewrote my CV in 30 seconds with all the keywords from the job description. My score went from 61% to 89%. I got the callback the next day.', stars:5, img:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
  { name:'Priya M.', role:'Data Scientist → Amazon', quote:'Interview prep is what got me across the line. The coached answers were actually relevant to the specific role. Walked in confident and got the offer.', stars:5, img:'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=80&h=80&fit=crop&crop=face' },
]

/* ════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [headlineIdx, setHeadlineIdx] = useState(0)
  const [headlineVisible, setHeadlineVisible] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [tabVisible, setTabVisible] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState<'monthly'|'quarterly'|null>(null)
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const observerRef = useRef<IntersectionObserver|null>(null)

  /* Rotate headlines every 3.5s */
  useEffect(() => {
    const id = setInterval(() => {
      setHeadlineVisible(false)
      setTimeout(() => {
        setHeadlineIdx(i => (i + 1) % HEADLINES.length)
        setHeadlineVisible(true)
      }, 350)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  /* Scroll-reveal IntersectionObserver */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const handleUpgrade = async (plan: 'monthly'|'quarterly') => {
    setLoadingPlan(plan)
    try { await redirectToCheckout(plan) } catch { setLoadingPlan(null) }
  }

  const switchTab = (i: number) => {
    setTabVisible(false)
    setTimeout(() => { setActiveTab(i); setTabVisible(true) }, 200)
  }

  const hl = HEADLINES[headlineIdx]

  return (
    <main className="bg-white font-sans overflow-x-hidden">
      <Navbar />

      {/* ════ HERO — full viewport ═══════════════════════ */}
      <div className="bg-gradient-to-br from-teal-dark to-teal-mid relative overflow-hidden" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(93,202,165,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}/>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(93,202,165,0.1) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}/>

        <div className="max-w-6xl mx-auto px-8 flex items-center gap-12 h-full" style={{ paddingTop: '2.5vh', paddingBottom: '2.5vh' }}>

          {/* Left */}
          <div className="flex-1">
            {/* Rotating headline */}
            <div className="mb-4" style={{ minHeight: '6.5rem' }}>
              <h1 className="font-black text-white leading-[1.1] tracking-tight"
                  style={{
                    fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
                    opacity: headlineVisible ? 1 : 0,
                    transform: headlineVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}>
                {hl.line1}
                <br/>
                <span className="text-teal-accent">{hl.line2}</span>
              </h1>
            </div>

            <p className="text-white/70 mb-5 leading-relaxed max-w-md"
               style={{
                 fontSize: 'clamp(0.95rem, 1.3vw, 1.05rem)',
                 opacity: headlineVisible ? 1 : 0,
                 transition: 'opacity 0.5s ease 0.1s',
               }}>
              {hl.sub}{' '}
              <span className="text-white font-semibold">Free. No account needed.</span>
            </p>

            {/* Steps */}
            <div className="flex items-center gap-3 mb-5">
              {[{ n:'1', label:'Upload Resume' },{ n:'2', label:'Add Job' },{ n:'3', label:'View Results' }].map((s,i) => (
                <div key={s.n} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md ${i===0?'bg-white text-teal-dark':'bg-white/15 border border-white/25 text-white/60'}`}>{s.n}</div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${i===0?'text-white':'text-white/45'}`}>{s.label}</span>
                  </div>
                  {i<2 && <div className="w-8 h-px bg-white/20 mb-4"/>}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <Link href="/ats-resume"
                className="inline-flex items-center gap-2 font-extrabold text-sm bg-white text-teal-dark px-7 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 animate-pulse-ring">
                Scan my CV free →
              </Link>
              <Link href="/login"
                className="inline-flex items-center gap-2 font-semibold text-sm text-white border-2 border-white/30 px-7 py-3.5 rounded-full hover:bg-white/10 transition-all duration-200">
                Sign in
              </Link>
            </div>

            {/* Headline dots */}
            <div className="flex gap-2 mb-3">
              {HEADLINES.map((_,i) => (
                <button key={i} onClick={() => { setHeadlineVisible(false); setTimeout(()=>{ setHeadlineIdx(i); setHeadlineVisible(true) },350) }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i===headlineIdx ? 'w-6 bg-teal-accent' : 'w-1.5 bg-white/30'}`}/>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {['LinkedIn','Indeed','Glassdoor','Google Jobs','+46 more'].map(b => (
                <span key={b} className="text-xs font-medium text-white/55 bg-white/8 border border-white/12 px-3 py-1 rounded-full">{b}</span>
              ))}
            </div>
          </div>

          {/* Right: Radar */}
          <div className="hidden lg:flex w-[520px] items-center justify-center">
            <div className="relative animate-float" style={{ width: 300, height: 300 }}>
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background:'radial-gradient(circle, #5DCAA5 0%, transparent 70%)', opacity:0.2, transform:'scale(1.4)' }}/>
              <svg width="300" height="300" viewBox="0 0 300 300" fill="none"
                style={{ animation:'radarSpin 6s linear infinite', position:'relative', zIndex:1 }}>
                <defs>
                  <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#5DCAA5" stopOpacity="0"/>
                    <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.85"/>
                  </linearGradient>
                </defs>
                <circle cx="150" cy="150" r="140" fill="none" stroke="#5DCAA5" strokeWidth="1.5" strokeOpacity="0.4"/>
                <circle cx="150" cy="150" r="100" fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.3"/>
                <circle cx="150" cy="150" r="60"  fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.25"/>
                <circle cx="150" cy="150" r="25"  fill="none" stroke="#5DCAA5" strokeWidth="0.8" strokeOpacity="0.2"/>
                <line x1="150" y1="10"  x2="150" y2="290" stroke="#5DCAA5" strokeWidth="0.5" strokeOpacity="0.2"/>
                <line x1="10"  y1="150" x2="290" y2="150" stroke="#5DCAA5" strokeWidth="0.5" strokeOpacity="0.2"/>
                <line x1="51"  y1="51"  x2="249" y2="249" stroke="#5DCAA5" strokeWidth="0.5" strokeOpacity="0.12"/>
                <line x1="249" y1="51"  x2="51"  y2="249" stroke="#5DCAA5" strokeWidth="0.5" strokeOpacity="0.12"/>
                <path d="M150 150 L150 10 A140 140 0 0 1 290 150 Z" fill="url(#sweep)"/>
                <circle cx="150" cy="150" r="6"  fill="#5DCAA5"/>
                <circle cx="150" cy="150" r="14" fill="#5DCAA5" fillOpacity="0.2"/>
                <circle cx="150" cy="150" r="22" fill="#5DCAA5" fillOpacity="0.08"/>
              </svg>
              {BLIPS.map(({ label, match, pos, delay }) => (
                <div key={label} className="absolute flex items-center gap-1.5 pointer-events-none"
                  style={{ ...pos, animation:`blipPop 12s ease-out ${delay} infinite`, zIndex:2 }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-accent shrink-0"
                    style={{ boxShadow:'0 0 8px 3px rgba(93,202,165,0.6)' }}/>
                  <div className="bg-white/12 backdrop-blur-sm border border-teal-accent/30 rounded-xl px-2.5 py-1.5 shadow-lg" style={{ minWidth:128 }}>
                    <p className="text-white text-[11px] font-bold leading-tight">{label}</p>
                    <p className="text-teal-accent text-[10px] font-semibold">{match} match</p>
                  </div>
                </div>
              ))}
              <style jsx>{`
                @keyframes radarSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes blipPop {
                  0%   {opacity:0;transform:scale(0.6) translateY(4px)}
                  6%   {opacity:1;transform:scale(1.08) translateY(0)}
                  18%  {opacity:1;transform:scale(1)}
                  45%  {opacity:0.7}
                  60%  {opacity:0}
                  100% {opacity:0}
                }
              `}</style>
            </div>
          </div>

        </div>
      </div>

      {/* ════ COMPANY LOGOS STRIP ══════════════════════════ */}
      <div className="bg-white py-10 px-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Trusted by job seekers landing roles at</p>
          <div className="flex items-center justify-center flex-wrap gap-10 opacity-50 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-500">
            <img src="/logos/google.png" alt="Google" className="h-8 object-contain" loading="lazy" />
            <img src="/logos/amazon.png" alt="Amazon" className="h-8 object-contain" loading="lazy" />
            <img src="/logos/microsoft.jpg" alt="Microsoft" className="h-8 object-contain" loading="lazy" />
            <img src="/logos/apple.png" alt="Apple" className="h-8 object-contain" loading="lazy" />
            <img src="/logos/netflix.png" alt="Netflix" className="h-8 object-contain" loading="lazy" />
          </div>
        </div>
      </div>

      {/* ════ 3-STEP CTA STRIP ═══════════════════════════════ */}
      <div className="bg-gradient-to-br from-teal-dark to-teal-mid py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-teal-accent text-sm font-bold uppercase tracking-widest mb-2">Land more interviews</p>
          <h2 className="text-3xl font-extrabold text-white mb-2">3× more callbacks in 3 steps</h2>
          <p className="text-white/70 text-sm mb-10">No account needed to start. Free forever on the basics.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { n:1, title:'Upload your CV', desc:'PDF or TXT — we extract everything instantly.', icon:(
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              )},
              { n:2, title:'Paste the job description', desc:'Paste any posting from any job board — we do the rest.', icon:(
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              )},
              { n:3, title:'Get your match score', desc:'See missing keywords, fix them, download your optimized CV.', icon:(
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              )},
            ].map((step, i) => (
              <div key={step.n} className="relative flex flex-col items-center text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-0 h-px border-t-2 border-dashed border-white/20"/>
                )}
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-4 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-teal-accent text-teal-dark text-[10px] font-extrabold flex items-center justify-center">{step.n}</span>
                </div>
                <p className="text-sm font-extrabold text-white mb-1">{step.title}</p>
                <p className="text-xs text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/ats-resume" className="inline-flex items-center gap-2 font-extrabold text-sm bg-white text-teal-dark px-8 py-3.5 rounded-full shadow-xl hover:bg-teal-light hover:scale-105 transition-all duration-200">
            Get my free resume score →
          </Link>
        </div>
      </div>

      {/* ════ PLATFORM SHOWCASE — tabbed switcher ═══════════ */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 reveal">
            <p className="text-teal-mid text-sm font-bold uppercase tracking-widest mb-3">All-in-one platform</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Every tool you need to get hired</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto">Six AI-powered tools. One platform. Start free — no credit card.</p>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto gap-2 pb-2 mb-6 reveal scrollbar-hide">
            {[
              { label:'ATS Resume', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color:'teal' },
              { label:'Keyword Analyzer', icon:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color:'violet' },
              { label:'Cover Letter', icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color:'amber' },
              { label:'Interview Prep', icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color:'green' },
              { label:'LinkedIn', icon:'linkedin', color:'blue' },
              { label:'Profile Gap', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color:'rose' },
            ].map((tab, i) => {
              const active = activeTab === i
              const colors: {[k: string]: string} = {
                teal: active ? 'bg-teal-dark text-white border-teal-dark' : 'text-gray-500 border-gray-200 hover:border-teal-mid hover:text-teal-dark',
                violet: active ? 'bg-violet-600 text-white border-violet-600' : 'text-gray-500 border-gray-200 hover:border-violet-400 hover:text-violet-600',
                amber: active ? 'bg-amber-500 text-white border-amber-500' : 'text-gray-500 border-gray-200 hover:border-amber-400 hover:text-amber-600',
                green: active ? 'bg-green-600 text-white border-green-600' : 'text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600',
                blue: active ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600',
                rose: active ? 'bg-rose-500 text-white border-rose-500' : 'text-gray-500 border-gray-200 hover:border-rose-400 hover:text-rose-500',
              }
              return (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border transition-all duration-200 ${colors[tab.color]}`}>
                  {tab.icon === 'linkedin' ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon}/></svg>
                  )}
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab panels */}
          <div className="rounded-2xl border border-gray-200 shadow-xl bg-white overflow-hidden reveal">
            {activeTab === 0 && (
              <div className="flex flex-col md:flex-row min-h-[360px]">
                <div className="md:w-72 shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-teal-dark/10 flex items-center justify-center mb-5">
                      <svg className="w-5 h-5 text-teal-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">ATS Resume Optimizer</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">Upload your CV + paste a job description. AI rewrites your CV with exact keywords to beat applicant tracking systems.</p>
                    <ul className="flex flex-col gap-2">
                      {['Instant keyword gap analysis','Magic AI rewrites in one click','ATS-safe formatting','PDF & Word download'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-teal-mid shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/ats-resume" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-teal-dark hover:underline">Try ATS Optimizer <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></Link>
                </div>
                <div className="flex-1 bg-gray-50 p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-5 flex-wrap mb-6">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5"/>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1D9E75" strokeWidth="3.5" strokeDasharray="89 11" strokeLinecap="round"/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-teal-dark">89%</span>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-teal-dark mb-0.5">Strong ATS match</p>
                      <p className="text-xs text-gray-400">+28 pts after Magic AI</p>
                      <p className="text-[10px] text-gray-400 mt-1">Senior Software Engineer @ Shopify</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Keywords added by AI</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['GraphQL','Redis','Kubernetes','Docker','CI/CD','TypeScript','Microservices'].map(k => (
                        <span key={k} className="text-[10px] font-semibold bg-teal-dark/8 text-teal-dark border border-teal-mid/20 px-2.5 py-1 rounded-full">+ {k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 1 && (
              <div className="flex flex-col md:flex-row min-h-[360px]">
                <div className="md:w-72 shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-5">
                      <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Keyword Analyzer</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">See exactly which keywords your CV is missing vs the job description. Know your match score before you apply.</p>
                    <ul className="flex flex-col gap-2">
                      {['Instant match score','Matched keywords highlighted','Missing keywords listed','1-click ATS handoff'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/keywords" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:underline">Try Keyword Analyzer <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></Link>
                </div>
                <div className="flex-1 bg-gray-50 p-8 flex flex-col justify-center gap-5">
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5"/>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeDasharray="72 28" strokeLinecap="round"/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-violet-700">72%</span>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-violet-700">Partial match</p>
                      <p className="text-xs text-gray-400">18 of 25 keywords found</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Matched (18)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['React','TypeScript','Node.js','PostgreSQL','Docker'].map(k => (
                          <span key={k} className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Missing (7)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['GraphQL','Redis','Kubernetes'].map(k => (
                          <span key={k} className="text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 2 && (
              <div className="flex flex-col md:flex-row min-h-[360px]">
                <div className="md:w-72 shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">AI Cover Letter</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">Tailored to the job. Sounds like you. Generated in seconds from your CV and the job description.</p>
                    <ul className="flex flex-col gap-2">
                      {['Role-specific language','Mirrors your CV experience','Download as PDF','One letter per job posting'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/cover-letter" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline">Try Cover Letter <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></Link>
                </div>
                <div className="flex-1 bg-amber-50 p-8 flex flex-col justify-center">
                  <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">AI-generated · Stripe PM role</p>
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Pro</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed italic mb-3">&ldquo;Dear Hiring Team,</p>
                    <p className="text-sm text-gray-700 leading-relaxed italic mb-3">I&apos;m excited to apply for the Senior PM role at Stripe. My 5 years building payment products at scale align closely with your need for someone who can own the payments infrastructure roadmap...</p>
                    <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;What excites me most about Stripe is the opportunity to work on infrastructure that thousands of developers rely on every day.&rdquo;</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 3 && (
              <div className="flex flex-col md:flex-row min-h-[360px]">
                <div className="md:w-72 shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-5">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Interview Prep AI</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">10 interview questions tailored to the role + coached answers drawn from your CV. Walk in confident.</p>
                    <ul className="flex flex-col gap-2">
                      {['Role-specific questions','Coached answers from your CV','Opening pitch generator','Unlimited practice sessions'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/interview-prep" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-green-600 hover:underline">Try Interview Prep <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></Link>
                </div>
                <div className="flex-1 bg-gray-50 p-8 flex flex-col gap-3 justify-center">
                  {[
                    { q:'Tell me about yourself', a:'Start with your 5 years in payments, mention the 40% fraud reduction you shipped at your last role, then bridge to why Stripe...' },
                    { q:"Why do you want this role?", a:"Focus on Stripe's global infrastructure ambition and connect it to your experience owning cross-border payments at..." },
                    { q:'Describe a product launch you owned', a:'Walk through the BNPL feature: discovery, the 3-week sprint, the 0→1 rollout to 4 markets, and the 23% GMV lift...' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-start gap-2.5 mb-2">
                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center shrink-0 text-[10px]">{i+1}</span>
                        <p className="text-xs font-bold text-gray-800">{item.q}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed ml-7 italic">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 4 && (
              <div className="flex flex-col md:flex-row min-h-[360px]">
                <div className="md:w-72 shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">LinkedIn Headline</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">AI writes a recruiter-magnet headline based on your CV — keyword-rich, role-specific, and human-sounding.</p>
                    <ul className="flex flex-col gap-2">
                      {['3 headline variations','Based on your actual CV','Optimised for recruiter search','Copy in one click'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/linkedin" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">Try LinkedIn Headline <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></Link>
                </div>
                <div className="flex-1 bg-blue-50 p-8 flex flex-col gap-4 justify-center">
                  {[
                    'Senior PM | Payments & Fraud | ex-Stripe | 0→1 Products',
                    'Product Lead — Fintech & Payments | Built $50M GMV in 18 months',
                    'Senior Product Manager | B2B SaaS · Stripe · Shopify | Scaling payment infra globally',
                  ].map((h, i) => (
                    <div key={i} className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-blue-900 font-medium italic">&ldquo;{h}&rdquo;</p>
                      <button className="shrink-0 text-[10px] font-bold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">Copy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 5 && (
              <div className="flex flex-col md:flex-row min-h-[360px]">
                <div className="md:w-72 shrink-0 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center mb-5">
                      <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Profile Gap Analysis</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">AI compares your profile to the top 10% of candidates in your field. See exactly what you&apos;re missing — and what to do about it.</p>
                    <ul className="flex flex-col gap-2">
                      {['Skill gap identification','Certification recommendations','Experience benchmarking','Actionable improvement plan'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/profile-gap" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:underline">Try Profile Gap <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></Link>
                </div>
                <div className="flex-1 bg-gray-50 p-8 flex flex-col justify-center gap-4">
                  {[
                    { skill:'System Design', you:60, top:90, color:'rose' },
                    { skill:'Data Analysis', you:75, top:85, color:'rose' },
                    { skill:'Stakeholder Mgmt', you:85, top:88, color:'teal' },
                  ].map(item => (
                    <div key={item.skill}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-700">{item.skill}</p>
                        <p className="text-[10px] text-gray-400">You: {item.you}% · Top 10%: {item.top}%</p>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color === 'rose' ? 'bg-rose-400' : 'bg-teal-mid'}`} style={{ width: `${item.you}%` }}/>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 mt-2">Top gap: System Design — consider AWS Solutions Architect certification</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-10 reveal">
            <Link href="/signup?plan=quarterly" className="inline-flex items-center gap-2 font-extrabold text-sm bg-teal-dark text-white px-8 py-3.5 rounded-full shadow-xl hover:bg-teal-mid hover:scale-105 transition-all duration-200">
              Start free — 7 day trial →
            </Link>
            <p className="text-gray-400 text-xs mt-3">No credit card required · All 6 tools included in Pro</p>
          </div>
        </div>
      </div>

            {/* ════ TESTIMONIALS ═══════════════════════════════ */}
      <div className="py-24 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-teal-mid text-sm font-bold uppercase tracking-wider text-center mb-3 reveal">Customer Reviews</p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12 reveal">What RadarJobs users are saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t,i) => (
              <div key={t.name} className={`bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col card-lift reveal reveal-delay-${i+1}`}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({length:t.stars}).map((_,j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1 mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" loading="lazy"/>
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">{t.name}</p>
                    <p className="text-xs text-teal-mid font-semibold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ PRICING ════════════════════════════════════ */}
      <div className="py-24 px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-teal-mid text-sm font-bold uppercase tracking-wider text-center mb-3 reveal">Pricing</p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2 reveal">Simple, honest pricing</h2>
          <p className="text-gray-500 text-center mb-10 reveal">Start free. Upgrade when you need the AI features.</p>
          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col reveal">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-400 text-sm mb-1.5">/forever</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Get started — no card needed.</p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-teal-mid mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                  </li>
                ))}
              </ul>
              <Link href="/scan" className="w-full py-3 rounded-xl border-2 border-teal-mid text-teal-dark font-bold text-sm text-center hover:bg-teal-light transition-colors">Start free →</Link>
            </div>

            <div className="bg-gradient-to-br from-teal-dark to-teal-mid rounded-2xl p-7 flex flex-col relative overflow-hidden shadow-xl reveal reveal-delay-2">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-extrabold text-teal-dark bg-teal-accent px-3 py-1 rounded-full">BEST VALUE</span>
              </div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Quarterly</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">$19.98</span>
              </div>
              <p className="text-white/60 text-xs mb-1">per month · billed $59.95 / 3mo</p>
              <span className="text-xs font-bold text-teal-accent mb-5">Save 40%</span>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                    <svg className="w-4 h-4 text-teal-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade('quarterly')} disabled={!!loadingPlan}
                className="w-full py-3.5 rounded-xl bg-white text-teal-dark font-extrabold text-sm hover:bg-teal-light disabled:opacity-60 transition-colors shadow-md">
                {loadingPlan==='quarterly'?'Redirecting…':'Get Quarterly →'}
              </button>
              <p className="text-center text-xs text-white/40 mt-3">Cancel anytime · Stripe checkout</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col reveal reveal-delay-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">$39.95</span>
              </div>
              <p className="text-gray-400 text-xs mb-5">per month · billed monthly</p>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-teal-mid mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade('monthly')} disabled={!!loadingPlan}
                className="w-full py-3.5 rounded-xl bg-teal-dark text-white font-extrabold text-sm hover:bg-teal-mid disabled:opacity-60 transition-colors shadow-md">
                {loadingPlan==='monthly'?'Redirecting…':'Get Monthly →'}
              </button>
              <p className="text-center text-xs text-gray-300 mt-3">Cancel anytime · Stripe checkout</p>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-8 reveal">
            See full feature comparison →{' '}
            <Link href="/pricing" className="text-teal-mid font-semibold hover:text-teal-dark">pricing page</Link>
          </p>
        </div>
      </div>

      {/* ════ FAQ ════════════════════════════════════════ */}
      <div className="py-24 px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-teal-mid text-sm font-bold uppercase tracking-wider text-center mb-3 reveal">FAQs</p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12 reveal">Frequently asked questions</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq,i) => (
              <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden reveal">
                <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                  className="w-full flex items-start justify-between px-6 py-5 text-left hover:bg-gray-100 transition-colors gap-4">
                  <span className="text-sm font-extrabold text-gray-800 leading-snug">{faq.q}</span>
                  <svg className={`w-5 h-5 text-gray-400 shrink-0 mt-0.5 transition-transform duration-200 ${openFaq===i?'rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {openFaq===i && (
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ FINAL CTA ═══════════════════════════════════ */}
      <div className="bg-gradient-to-br from-teal-dark to-teal-mid py-20 px-8 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4 reveal">Start Optimizing Your Job Search</h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto reveal">
          Join thousands of job seekers who land interviews faster. Free to start. No credit card required.
        </p>
        <Link href="/ats-resume"
          className="inline-flex items-center gap-2 font-extrabold text-base bg-white text-teal-dark px-10 py-4 rounded-full shadow-xl hover:bg-teal-light hover:scale-105 transition-all duration-200 animate-pulse-ring reveal">
          Scan my CV free →
        </Link>
      </div>

      {/* ════ FOOTER ══════════════════════════════════════ */}
      <footer className="bg-gray-900 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-black tracking-tight">
                <span className="text-white">Radar</span><span className="text-teal-accent">Jobs</span>
              </span>
              <p className="text-gray-400 text-xs mt-3 leading-relaxed">The AI-powered job search platform that helps you land 3× more interviews.</p>
            </div>
            <div>
              <p className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Platform</p>
              <div className="flex flex-col gap-2.5">
                {[{l:'Pricing',href:'/pricing'},{l:'One-Click Optimize',href:'/ats-resume'},{l:'ATS Resume',href:'/ats-resume'},{l:'LinkedIn Optimization',href:'/linkedin'},{l:'Interview Prep',href:'/interview-prep'},{l:'Cover Letter',href:'/cover-letter'},{l:'Resources',href:'/resources'},{l:'Organizations',href:'/organizations'}].map(x => (
                  <Link key={x.l} href={x.href} className="text-xs text-gray-400 hover:text-white transition-colors">{x.l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">ATS Resume</p>
              <div className="flex flex-col gap-2.5">
                {['What Is an ATS?','How to Optimize for ATS','How to Write a Resume','Resume Formats','Resume Templates','Resume Examples'].map(l => (
                  <Link key={l} href="/resources" className="text-xs text-gray-400 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Cover Letter</p>
              <div className="flex flex-col gap-2.5">
                {['How to Write a Cover Letter','Cover Letter Formats','Cover Letter Templates','Cover Letter Examples'].map(l => (
                  <Link key={l} href="/cover-letter" className="text-xs text-gray-400 hover:text-white transition-colors">{l}</Link>
                ))}
                <p className="text-xs font-extrabold text-white uppercase tracking-wider mt-4 mb-2">LinkedIn</p>
                {['Profile Writing Guide','Headline Examples','Summary Examples'].map(l => (
                  <Link key={l} href="/linkedin" className="text-xs text-gray-400 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Company</p>
              <div className="flex flex-col gap-2.5">
                {[{l:'About',h:'/'},{l:'Organizations',h:'/organizations'},{l:'Pricing',h:'/pricing'},{l:'Contact',h:'mailto:a.aitibour@gmail.com'}].map(x => (
                  <a key={x.l} href={x.h} className="text-xs text-gray-400 hover:text-white transition-colors">{x.l}</a>
                ))}
                <p className="text-xs font-extrabold text-white uppercase tracking-wider mt-4 mb-2">Support</p>
                {[{l:'Customer Support',h:'mailto:a.aitibour@gmail.com'},{l:'Privacy',h:'/'},{l:'Terms',h:'/'}].map(x => (
                  <a key={x.l} href={x.h} className="text-xs text-gray-400 hover:text-white transition-colors">{x.l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs text-gray-500">© 2026 RadarJobs. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/scan"    className="text-xs text-gray-500 hover:text-white transition-colors">Scan CV</Link>
              <Link href="/pricing" className="text-xs text-gray-500 hover:text-white transition-colors">Pricing</Link>
              <Link href="/login"   className="text-xs text-gray-500 hover:text-white transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
