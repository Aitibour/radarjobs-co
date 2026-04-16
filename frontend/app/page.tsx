'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden font-sans" style={{ background: '#0d2b23' }}>

      {/* ── Nav ── */}
      <nav className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 14a10 10 0 0 1 10-10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 14a10 10 0 0 1-10 10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M8 14a6 6 0 0 1 6-6" stroke="#a7e8d4" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 14a6 6 0 0 1-6 6" stroke="#a7e8d4" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="#5DCAA5"/>
          </svg>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-white">Radar</span><span style={{ color: '#5DCAA5' }}>Jobs</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Sign in</Link>
          <Link href="/scan" className="text-sm font-bold px-5 py-2 rounded-full transition-all hover:scale-105"
            style={{ background: '#5DCAA5', color: '#0d2b23' }}>
            Try free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-14 lg:px-20">

          {/* Live badge */}
          <div className="flex items-center gap-2 mb-7 w-fit">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse"/>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#5DCAA5' }}>
              Live · 50+ job boards
            </span>
          </div>

          {/* Hook */}
          <h1 className="font-extrabold leading-tight tracking-tight mb-5">
            <span className="block text-white" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              Put your CV on the Radar.
            </span>
            <span className="block" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: '#5DCAA5' }}>
              Find the right job.
            </span>
          </h1>

          {/* Sub */}
          <p className="mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)', maxWidth: '440px' }}>
            Upload your CV once — our AI scans LinkedIn, Indeed, Glassdoor and 47 more boards, then scores every role against your real skills.{' '}
            <span className="font-semibold text-white">100% free.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/scan"
              className="inline-flex items-center gap-2 font-bold text-sm px-7 py-3 rounded-full shadow-lg hover:scale-105 transition-all duration-200"
              style={{ background: '#5DCAA5', color: '#0d2b23' }}>
              Scan my CV free →
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all duration-200">
              Sign in
            </Link>
          </div>

          {/* Board chips */}
          <div className="flex flex-wrap gap-2">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Google Jobs', '+46 more'].map((b) => (
              <span key={b} className="text-xs px-3 py-1 rounded-full border"
                style={{ borderColor: 'rgba(93,202,165,0.25)', color: 'rgba(255,255,255,0.45)', background: 'rgba(93,202,165,0.07)' }}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right — radar + steps */}
        <div className="hidden lg:flex w-[45%] flex-col items-center justify-center gap-8 pr-12">

          {/* Radar SVG */}
          <div style={{ width: 180, height: 180 }}>
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none"
              style={{ animation: 'rdr 4s linear infinite' }}>
              <defs>
                <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#5DCAA5" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="sw" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5DCAA5" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.65"/>
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r="85" fill="url(#rg)" stroke="#5DCAA5" strokeWidth="1" strokeOpacity="0.3"/>
              <circle cx="90" cy="90" r="56" fill="none" stroke="#5DCAA5" strokeWidth="1" strokeOpacity="0.25"/>
              <circle cx="90" cy="90" r="28" fill="none" stroke="#5DCAA5" strokeWidth="1" strokeOpacity="0.25"/>
              <path d="M90 90 L90 5 A85 85 0 0 1 175 90 Z" fill="url(#sw)"/>
              <circle cx="90" cy="90" r="5" fill="#5DCAA5"/>
              {/* Blip dots */}
              <circle cx="130" cy="55" r="3" fill="#5DCAA5" fillOpacity="0.8"/>
              <circle cx="60" cy="120" r="2.5" fill="#5DCAA5" fillOpacity="0.6"/>
              <circle cx="145" cy="105" r="2" fill="#5DCAA5" fillOpacity="0.5"/>
            </svg>
            <style jsx>{`@keyframes rdr { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3 w-64">
            {[
              { n: '1', title: 'Upload your CV', sub: 'PDF or text — skills extracted in seconds' },
              { n: '2', title: 'Radar scans 50+ boards', sub: 'LinkedIn, Indeed, Glassdoor & more' },
              { n: '3', title: 'Get scored matches', sub: 'Every job ranked 0–100 against your profile' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: 'rgba(93,202,165,0.08)', border: '1px solid rgba(93,202,165,0.18)' }}>
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(93,202,165,0.2)', color: '#5DCAA5', border: '1px solid rgba(93,202,165,0.4)' }}>
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="shrink-0 border-t border-white/10 py-3 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[
              { v: '10 000+', l: 'jobs scanned daily' },
              { v: 'AI-scored', l: 'match ranking' },
              { v: 'Free forever', l: 'no credit card' },
            ].map(({ v, l }) => (
              <div key={v} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{v}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</span>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>RadarJobs © 2026</p>
        </div>
      </div>
    </main>
  )
}
