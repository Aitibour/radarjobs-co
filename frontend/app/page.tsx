'use client'

import Link from 'next/link'

const BLIPS = [
  { label: 'Senior Dev',      match: '87%', x: '69%', y: '11%', delay: '0s'    },
  { label: 'ML Engineer',     match: '94%', x: '38%', y: '19%', delay: '0.65s' },
  { label: 'Data Engineer',   match: '91%', x: '10%', y: '42%', delay: '1.35s' },
  { label: 'Backend Dev',     match: '88%', x: '7%',  y: '72%', delay: '2s'    },
  { label: 'DevOps Lead',     match: '83%', x: '34%', y: '80%', delay: '2.65s' },
  { label: 'UX Designer',     match: '79%', x: '67%', y: '74%', delay: '3.35s' },
  { label: 'Product Manager', match: '76%', x: '83%', y: '46%', delay: '4s'    },
]

export default function LandingPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-teal-dark to-teal-mid font-sans relative">

      {/* ─── Full-screen radar background ────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

        {/* Spinning radar SVG */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ width: '150vmin', height: '150vmin' }}>
            <svg width="100%" height="100%" viewBox="0 0 210 210" fill="none"
              style={{ animation: 'radarSpin 5s linear infinite' }}>
              <defs>
                <linearGradient id="bgSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#5DCAA5" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.9"/>
                </linearGradient>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#5DCAA5" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0"/>
                </radialGradient>
              </defs>
              {/* Rings */}
              <circle cx="105" cy="105" r="98" fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.25"/>
              <circle cx="105" cy="105" r="72" fill="none" stroke="#5DCAA5" strokeWidth="0.8" strokeOpacity="0.18"/>
              <circle cx="105" cy="105" r="48" fill="none" stroke="#5DCAA5" strokeWidth="0.8" strokeOpacity="0.18"/>
              <circle cx="105" cy="105" r="25" fill="none" stroke="#5DCAA5" strokeWidth="0.8" strokeOpacity="0.18"/>
              {/* Cross hairs */}
              <line x1="105" y1="7"   x2="105" y2="203" stroke="#5DCAA5" strokeWidth="0.5" strokeOpacity="0.18"/>
              <line x1="7"   y1="105" x2="203" y2="105" stroke="#5DCAA5" strokeWidth="0.5" strokeOpacity="0.18"/>
              <line x1="30"  y1="30"  x2="180" y2="180" stroke="#5DCAA5" strokeWidth="0.4" strokeOpacity="0.1"/>
              <line x1="180" y1="30"  x2="30"  y2="180" stroke="#5DCAA5" strokeWidth="0.4" strokeOpacity="0.1"/>
              {/* Center glow */}
              <circle cx="105" cy="105" r="98" fill="url(#centerGlow)"/>
              {/* Sweep wedge */}
              <path d="M105 105 L105 7 A98 98 0 0 1 203 105 Z" fill="url(#bgSweep)" opacity="0.7"/>
              {/* Centre dot */}
              <circle cx="105" cy="105" r="3" fill="#5DCAA5" fillOpacity="0.9"/>
              <circle cx="105" cy="105" r="8" fill="#5DCAA5" fillOpacity="0.15"/>
            </svg>
          </div>
        </div>

        {/* Job title blips — pop up as the sweep discovers them */}
        {BLIPS.map(({ label, match, x, y, delay }) => (
          <div
            key={label}
            className="absolute flex items-center gap-2"
            style={{ left: x, top: y, animation: `blipPop 5s ease-out ${delay} infinite` }}
          >
            {/* Dot */}
            <div className="shrink-0 w-2 h-2 rounded-full bg-teal-accent shadow-[0_0_6px_2px_rgba(93,202,165,0.6)]"/>
            {/* Card */}
            <div className="bg-white/10 backdrop-blur-md border border-teal-accent/30 rounded-lg px-2.5 py-1.5 shadow-lg"
              style={{ minWidth: 110 }}>
              <p className="text-white text-[11px] font-bold leading-tight">{label}</p>
              <p className="text-teal-accent text-[10px] font-semibold">{match} match ✓</p>
            </div>
          </div>
        ))}

        <style jsx>{`
          @keyframes radarSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes blipPop {
            0%   { opacity: 0; transform: scale(0.6) translateY(4px); }
            8%   { opacity: 1; transform: scale(1.08) translateY(0); }
            18%  { opacity: 1; transform: scale(1); }
            45%  { opacity: 0.65; }
            65%  { opacity: 0; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>

      {/* ─── Nav ─────────────────────────────────────── */}
      <nav className="shrink-0 flex items-center justify-between px-8 py-4 bg-black/10 border-b border-white/10 relative" style={{ zIndex: 10 }}>
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
      <div className="flex-1 flex overflow-hidden relative" style={{ zIndex: 10 }}>

        {/* ── Left: copy + CTA ── */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-14 lg:px-20">

          <div className="flex items-center gap-2 mb-7 w-fit bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse shrink-0"/>
            <span className="text-xs font-semibold text-white/90 tracking-wide">
              Live · 50+ job boards scanned
            </span>
          </div>

          <h1 className="font-black text-white leading-[1.1] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)' }}>
            Put your CV on the Radar
            <br />
            <span className="text-teal-accent">for the right job.</span>
          </h1>

          <p className="text-white/70 mb-8 leading-relaxed"
             style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)', maxWidth: '420px' }}>
            Upload your CV once — our AI scans LinkedIn, Indeed, Glassdoor
            and 47 more boards, then ranks every match by how well it fits
            your actual skills.{' '}
            <span className="text-white font-semibold">Free. No account needed.</span>
          </p>

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

          <div className="flex flex-wrap gap-2">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Google Jobs', '+46 more'].map((b) => (
              <span key={b}
                className="text-xs font-medium text-white/60 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: how it works ── */}
        <div className="hidden lg:flex w-[36%] flex-col justify-center gap-6 pr-16">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-semibold">How it works</p>
          <div className="flex flex-col gap-5">
            {[
              { n: '01', title: 'Upload your CV',          sub: 'PDF or text — skills extracted instantly' },
              { n: '02', title: 'Radar scans 50+ boards',  sub: 'LinkedIn, Indeed, Glassdoor & more' },
              { n: '03', title: 'Get ranked matches',       sub: 'Every job scored against your profile' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-4">
                <span className="shrink-0 text-teal-accent font-black tabular-nums leading-none mt-0.5"
                  style={{ fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', opacity: 0.5 }}>
                  {n}
                </span>
                <div>
                  <p className="text-white/90 font-semibold leading-tight"
                    style={{ fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }}>
                    {title}
                  </p>
                  <p className="text-white/40 mt-0.5"
                    style={{ fontSize: 'clamp(0.7rem, 0.85vw, 0.78rem)' }}>
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats strip ─────────────────────────────── */}
      <div className="shrink-0 bg-white/90 border-t border-black/8 py-3 px-8 relative" style={{ zIndex: 10 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[
              { value: '10 000+',      label: 'jobs scanned daily' },
              { value: 'AI-powered',   label: 'match scoring'      },
              { value: 'Free forever', label: 'no credit card'     },
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900">{value}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">RadarJobs © 2026</p>
        </div>
      </div>
    </main>
  )
}
