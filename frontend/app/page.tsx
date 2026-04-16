'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden font-sans select-none"
      style={{ background: 'linear-gradient(145deg, #1a5a42 0%, #22734f 40%, #155438 100%)' }}>

      {/* subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>

      {/* ── Nav ── */}
      <nav className="relative shrink-0 flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.12)' }}>
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
            <path d="M4 14a10 10 0 0 1 10-10" stroke="#7ee8c4" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 14a10 10 0 0 1-10 10" stroke="#7ee8c4" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M8 14a6 6 0 0 1 6-6" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 14a6 6 0 0 1-6 6" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3" fill="#7ee8c4"/>
          </svg>
          <span className="font-black text-xl tracking-tight">
            <span className="text-white">Radar</span><span style={{ color: '#7ee8c4' }}>Jobs</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
            Sign in
          </Link>
          <Link href="/scan"
            className="text-sm font-bold px-5 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: '#7ee8c4', color: '#0f3d2a', boxShadow: '0 4px 20px rgba(126,232,196,0.35)' }}>
            Try free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative flex-1 flex overflow-hidden">

        {/* ── Left column ── */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-20 py-6 z-10">

          {/* Live pill */}
          <div className="flex items-center gap-2 mb-6 w-fit px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(126,232,196,0.12)', border: '1px solid rgba(126,232,196,0.3)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7ee8c4' }}/>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#7ee8c4' }}>
              Live · 50+ job boards
            </span>
          </div>

          {/* Headline */}
          <div className="mb-5">
            <h1 className="font-black leading-[1.08] tracking-tight"
              style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3rem)' }}>
              <span className="text-white">Put your CV on the Radar</span><br/>
              <span style={{ color: '#7ee8c4' }}>for the right job.</span>
            </h1>
          </div>

          {/* Body */}
          <p className="mb-7 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.875rem,1.3vw,1rem)', maxWidth: '400px' }}>
            Upload your CV once — our AI scans LinkedIn, Indeed, Glassdoor and 47 more job boards, then ranks every match by how well it fits your actual skills.{' '}
            <span className="font-semibold text-white">Free, no sign-up needed.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-7">
            <Link href="/scan"
              className="font-bold text-sm px-7 py-3 rounded-full transition-all duration-200 hover:scale-105"
              style={{ background: '#7ee8c4', color: '#0f3d2a', boxShadow: '0 6px 24px rgba(126,232,196,0.4)' }}>
              Scan my CV free →
            </Link>
            <Link href="/login"
              className="font-semibold text-sm px-7 py-3 rounded-full text-white transition-all duration-200 hover:bg-white/10"
              style={{ border: '1.5px solid rgba(255,255,255,0.25)' }}>
              Sign in
            </Link>
          </div>

          {/* Board chips */}
          <div className="flex flex-wrap gap-2">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Google Jobs', '+46 more'].map((b) => (
              <span key={b} className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="hidden lg:flex w-[46%] flex-col items-center justify-center gap-8 px-8 z-10">

          {/* Radar */}
          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            {/* Glow */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(126,232,196,0.18) 0%, transparent 70%)' }}/>
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none"
              style={{ animation: 'radarSpin 4s linear infinite', position: 'relative', zIndex: 1 }}>
              <defs>
                <radialGradient id="rdGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7ee8c4" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#7ee8c4" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="rdSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7ee8c4" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#7ee8c4" stopOpacity="0.7"/>
                </linearGradient>
              </defs>
              {/* Rings */}
              <circle cx="100" cy="100" r="94" fill="url(#rdGlow)" stroke="#7ee8c4" strokeWidth="1" strokeOpacity="0.35"/>
              <circle cx="100" cy="100" r="64" fill="none" stroke="#7ee8c4" strokeWidth="1" strokeOpacity="0.2"/>
              <circle cx="100" cy="100" r="34" fill="none" stroke="#7ee8c4" strokeWidth="1" strokeOpacity="0.2"/>
              {/* Cross hairs */}
              <line x1="100" y1="6" x2="100" y2="194" stroke="#7ee8c4" strokeWidth="0.5" strokeOpacity="0.15"/>
              <line x1="6" y1="100" x2="194" y2="100" stroke="#7ee8c4" strokeWidth="0.5" strokeOpacity="0.15"/>
              {/* Sweep */}
              <path d="M100 100 L100 6 A94 94 0 0 1 194 100 Z" fill="url(#rdSweep)"/>
              {/* Center */}
              <circle cx="100" cy="100" r="5" fill="#7ee8c4"/>
              <circle cx="100" cy="100" r="10" fill="#7ee8c4" fillOpacity="0.2"/>
              {/* Blips */}
              <circle cx="148" cy="62" r="4" fill="#7ee8c4" fillOpacity="0.9"/>
              <circle cx="65" cy="130" r="3" fill="#7ee8c4" fillOpacity="0.7"/>
              <circle cx="160" cy="118" r="2.5" fill="#7ee8c4" fillOpacity="0.6"/>
            </svg>
            <style jsx>{`
              @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
            {[
              { n: '1', title: 'Upload your CV', sub: 'PDF or text — skills detected instantly' },
              { n: '2', title: 'Radar scans 50+ boards', sub: 'LinkedIn, Indeed, Glassdoor & more' },
              { n: '3', title: 'Get ranked matches', sub: 'Every job scored against your profile' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-3 rounded-2xl p-3.5 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: 'rgba(126,232,196,0.25)', color: '#7ee8c4', border: '1px solid rgba(126,232,196,0.4)' }}>
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

      {/* ── Footer ── */}
      <div className="relative shrink-0 px-8 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[
              { v: '10 000+', l: 'jobs scanned daily' },
              { v: 'AI-scored', l: 'match ranking' },
              { v: 'Free forever', l: 'no credit card' },
            ].map(({ v, l }) => (
              <div key={v} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{v}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>RadarJobs © 2026</p>
        </div>
      </div>
    </main>
  )
}
