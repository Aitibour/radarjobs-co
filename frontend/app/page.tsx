'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-teal-dark to-teal-mid font-sans">

      {/* ─── Nav ─────────────────────────────────────── */}
      <nav className="shrink-0 flex items-center justify-between px-8 py-4 bg-black/10 border-b border-white/10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M4 14a10 10 0 0 1 10-10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 14a10 10 0 0 1-10 10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M8 14a6 6 0 0 1 6-6"  stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 14a6 6 0 0 1-6 6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="white"/>
          </svg>
          <span className="text-xl font-black tracking-tight">
            <span className="text-white">Radar</span><span className="text-teal-accent">Jobs</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-4">
          <Link href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/scan"
            className="text-sm font-bold bg-white text-teal-dark px-5 py-2 rounded-full hover:bg-teal-light hover:scale-105 transition-all duration-200 shadow-md">
            Try free →
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: copy + CTA ── */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-14 lg:px-20">

          {/* Live badge */}
          <div className="flex items-center gap-2 mb-7 w-fit bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse shrink-0"/>
            <span className="text-xs font-semibold text-white/90 tracking-wide">
              Live · 50+ job boards scanned
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-black text-white leading-[1.1] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)' }}>
            Put your CV on the Radar
            <br />
            <span className="text-teal-accent">for the right job.</span>
          </h1>

          {/* Body */}
          <p className="text-white/70 mb-8 leading-relaxed"
             style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)', maxWidth: '420px' }}>
            Upload your CV once — our AI scans LinkedIn, Indeed, Glassdoor
            and 47 more boards, then ranks every match by how well it fits
            your actual skills.{' '}
            <span className="text-white font-semibold">Free. No account needed.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/scan"
              className="inline-flex items-center gap-2 font-bold text-sm bg-white text-teal-dark px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Scan my CV free →
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 font-semibold text-sm text-white border-2 border-white/30 px-7 py-3.5 rounded-full hover:bg-white/10 transition-all duration-200">
              Sign in
            </Link>
          </div>

          {/* Board chips */}
          <div className="flex flex-wrap gap-2">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Google Jobs', '+46 more'].map((b) => (
              <span key={b}
                className="text-xs font-medium text-white/60 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: radar + steps ── */}
        <div className="hidden lg:flex w-[44%] flex-col items-center justify-center gap-8 pr-14">

          {/* Radar */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, #5DCAA5 0%, transparent 70%)', transform: 'scale(1.3)' }}/>

            <svg width="210" height="210" viewBox="0 0 210 210" fill="none"
              style={{ animation: 'radarSpin 5s linear infinite', position: 'relative', zIndex: 1 }}>
              <defs>
                <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#5DCAA5" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.75"/>
                </linearGradient>
              </defs>
              {/* Rings */}
              <circle cx="105" cy="105" r="98" fill="none" stroke="#5DCAA5" strokeWidth="1.5" strokeOpacity="0.4"/>
              <circle cx="105" cy="105" r="65" fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.25"/>
              <circle cx="105" cy="105" r="33" fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.25"/>
              {/* Cross hairs */}
              <line x1="105" y1="7"   x2="105" y2="203" stroke="#5DCAA5" strokeWidth="0.6" strokeOpacity="0.2"/>
              <line x1="7"   y1="105" x2="203" y2="105" stroke="#5DCAA5" strokeWidth="0.6" strokeOpacity="0.2"/>
              {/* Sweep wedge */}
              <path d="M105 105 L105 7 A98 98 0 0 1 203 105 Z" fill="url(#sweep)"/>
              {/* Centre */}
              <circle cx="105" cy="105" r="5" fill="#5DCAA5"/>
              <circle cx="105" cy="105" r="11" fill="#5DCAA5" fillOpacity="0.2"/>
              {/* Blips */}
              <circle cx="155" cy="65" r="4.5" fill="#5DCAA5" fillOpacity="0.9"/>
              <circle cx="155" cy="65" r="9"   fill="#5DCAA5" fillOpacity="0.2"/>
              <circle cx="68"  cy="138" r="3.5" fill="#5DCAA5" fillOpacity="0.75"/>
              <circle cx="162" cy="125" r="2.5" fill="#5DCAA5" fillOpacity="0.6"/>
            </svg>

            <style jsx>{`
              @keyframes radarSpin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
            `}</style>

            {/* Floating match card */}
            <div className="absolute -right-4 top-6 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2 shadow-lg"
              style={{ minWidth: 130 }}>
              <p className="text-white text-xs font-bold leading-tight">Senior Dev</p>
              <p className="text-teal-accent text-xs font-semibold">87% match ✓</p>
            </div>
          </div>

          {/* How it works */}
          <div className="flex flex-col gap-2.5 w-full" style={{ maxWidth: 250 }}>
            {[
              { n: '1', title: 'Upload your CV',       sub: 'PDF or text — skills extracted instantly' },
              { n: '2', title: 'Radar scans 50+ boards', sub: 'LinkedIn, Indeed, Glassdoor & more' },
              { n: '3', title: 'Get ranked matches',   sub: 'Every job scored against your profile' },
            ].map(({ n, title, sub }) => (
              <div key={n}
                className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl p-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-teal-accent/25 border border-teal-accent/50
                  flex items-center justify-center text-xs font-black text-teal-accent">
                  {n}
                </span>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats strip ─────────────────────────────── */}
      <div className="shrink-0 bg-black/25 border-t border-white/10 py-3 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[
              { value: '10 000+',     label: 'jobs scanned daily' },
              { value: 'AI-powered',  label: 'match scoring'      },
              { value: 'Free forever',label: 'no credit card'     },
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{value}</span>
                <span className="text-xs text-white/50">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 font-medium">RadarJobs © 2026</p>
        </div>
      </div>
    </main>
  )
}
