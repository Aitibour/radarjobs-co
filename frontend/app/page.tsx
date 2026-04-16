'use client'

import Link from 'next/link'

const BLIPS = [
  { label: 'Senior Dev',    match: '87%', pos: { top: '2px',    right: '-148px' }, delay: '0s'    },
  { label: 'ML Engineer',   match: '94%', pos: { top: '-52px',  left: '28px'    }, delay: '1.25s' },
  { label: 'Data Engineer', match: '91%', pos: { top: '80px',   left: '-148px'  }, delay: '2.5s'  },
  { label: 'UX Designer',   match: '79%', pos: { bottom: '-52px',left: '28px'   }, delay: '3.75s' },
]

export default function LandingPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-teal-dark to-teal-mid font-sans">

      {/* ─── Nav ─────────────────────────────────────── */}
      <nav className="shrink-0 flex items-center justify-between px-8 py-4 bg-black/10 border-b border-white/10">
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
      <div className="flex-1 flex overflow-hidden">

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

        {/* ── Right: radar + blips + steps ── */}
        <div className="hidden lg:flex w-[46%] flex-col items-center justify-center gap-10 pr-14">

          {/* Radar with discovery blips */}
          <div className="relative" style={{ width: 220, height: 220 }}>
            {/* Glow behind radar */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #5DCAA5 0%, transparent 70%)',
                opacity: 0.25,
                transform: 'scale(1.35)',
              }}/>

            {/* Radar SVG */}
            <svg width="220" height="220" viewBox="0 0 210 210" fill="none"
              style={{ animation: 'radarSpin 5s linear infinite', position: 'relative', zIndex: 1 }}>
              <defs>
                <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#5DCAA5" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
              <circle cx="105" cy="105" r="98" fill="none" stroke="#5DCAA5" strokeWidth="1.5" strokeOpacity="0.4"/>
              <circle cx="105" cy="105" r="65" fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.25"/>
              <circle cx="105" cy="105" r="33" fill="none" stroke="#5DCAA5" strokeWidth="1"   strokeOpacity="0.25"/>
              <line x1="105" y1="7"   x2="105" y2="203" stroke="#5DCAA5" strokeWidth="0.6" strokeOpacity="0.2"/>
              <line x1="7"   y1="105" x2="203" y2="105" stroke="#5DCAA5" strokeWidth="0.6" strokeOpacity="0.2"/>
              <path d="M105 105 L105 7 A98 98 0 0 1 203 105 Z" fill="url(#sweep)"/>
              <circle cx="105" cy="105" r="5"  fill="#5DCAA5"/>
              <circle cx="105" cy="105" r="11" fill="#5DCAA5" fillOpacity="0.2"/>
            </svg>

            {/* Discovery blip cards */}
            {BLIPS.map(({ label, match, pos, delay }) => (
              <div
                key={label}
                className="absolute flex items-center gap-1.5 pointer-events-none"
                style={{ ...pos, animation: `blipPop 5s ease-out ${delay} infinite`, zIndex: 2 }}
              >
                <div className="w-2 h-2 rounded-full bg-teal-accent shrink-0"
                  style={{ boxShadow: '0 0 6px 2px rgba(93,202,165,0.55)' }}/>
                <div className="bg-white/12 backdrop-blur-sm border border-teal-accent/30 rounded-xl px-2.5 py-1.5 shadow-lg"
                  style={{ minWidth: 118 }}>
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
                0%   { opacity: 0; transform: scale(0.65) translateY(3px); }
                9%   { opacity: 1; transform: scale(1.06) translateY(0);   }
                20%  { opacity: 1; transform: scale(1);                    }
                48%  { opacity: 0.6; }
                65%  { opacity: 0; }
                100% { opacity: 0; }
              }
            `}</style>
          </div>

          {/* How it works — minimal */}
          <div className="flex flex-col gap-4" style={{ width: 240 }}>
            <p className="text-white/35 text-[10px] uppercase tracking-[0.14em] font-semibold">How it works</p>
            {[
              { n: '01', title: 'Upload your CV',          sub: 'PDF or text — skills extracted instantly' },
              { n: '02', title: 'Radar scans 50+ boards',  sub: 'LinkedIn, Indeed, Glassdoor & more' },
              { n: '03', title: 'Get ranked matches',       sub: 'Every job scored against your profile' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-3.5">
                <span className="shrink-0 font-black tabular-nums text-teal-accent/45 mt-0.5"
                  style={{ fontSize: '0.82rem' }}>
                  {n}
                </span>
                <div>
                  <p className="text-white/85 font-semibold leading-tight" style={{ fontSize: '0.84rem' }}>{title}</p>
                  <p className="text-white/40 mt-0.5" style={{ fontSize: '0.72rem' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stats strip ─────────────────────────────── */}
      <div className="shrink-0 bg-black/20 border-t border-white/10 py-3 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[
              { value: '10 000+',      label: 'jobs scanned daily' },
              { value: 'AI-powered',   label: 'match scoring'      },
              { value: 'Free forever', label: 'no credit card'     },
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
