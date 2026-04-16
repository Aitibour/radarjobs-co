'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-teal-dark to-teal-mid font-sans">

      {/* ── Nav strip ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-black/10">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M4 14a10 10 0 0 1 10-10" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round"/>
            <path d="M24 14a10 10 0 0 1-10 10" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 14a6 6 0 0 1 6-6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 14a6 6 0 0 1-6 6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="white"/>
          </svg>
          <span className="font-extrabold text-lg tracking-tight"><span className="text-white">Radar</span><span className="text-gray-900">Jobs</span></span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Sign in</Link>
          <Link href="/scan" className="bg-white text-teal-dark text-sm font-bold px-4 py-1.5 rounded-full hover:bg-teal-light transition-colors">
            Try free →
          </Link>
        </div>
      </div>

      {/* ── Hero (fills remaining height) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: text + CTA */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-14 lg:px-20 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 w-fit">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse shrink-0" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">50+ job boards · live scanning</span>
          </div>

          {/* Hook — CV + Radar + Job */}
          <h1 className="font-extrabold text-white leading-[1.1] tracking-tight mb-5">
            <span className="text-5xl md:text-6xl lg:text-7xl block">CV in.</span>
            <span className="text-5xl md:text-6xl lg:text-7xl block">Radar on.</span>
            <span className="text-4xl md:text-5xl lg:text-6xl block mt-1" style={{ color: '#5DCAA5' }}>
              Right job, locked on.
            </span>
          </h1>

          <p className="text-white/70 text-base md:text-lg max-w-md mb-8 leading-relaxed">
            Upload your CV — our AI scans LinkedIn, Indeed, Glassdoor and 47 more boards,
            then scores every role against your actual skills.{' '}
            <span className="text-white font-semibold">Free, no sign-up needed.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link
              href="/scan"
              className="inline-flex items-center justify-center gap-2 bg-white text-teal-dark font-bold text-base px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Scan my CV free →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold text-base px-7 py-3.5 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              Sign in
            </Link>
          </div>

          {/* Job board chips */}
          <div className="flex flex-wrap gap-2">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Google Jobs', '+46 more'].map((board) => (
              <span key={board} className="bg-white/10 border border-white/20 text-white/60 text-xs px-3 py-1 rounded-full">
                {board}
              </span>
            ))}
          </div>
        </div>

        {/* Right: radar animation + how it works */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-6 pr-16">
          {/* Radar */}
          <div className="relative w-48 h-48 opacity-80">
            <svg className="w-full h-full" viewBox="0 0 200 200" style={{ animation: 'spin 4s linear infinite' }}>
              <defs>
                <linearGradient id="sweep2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5DCAA5" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.7"/>
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#5DCAA5" strokeWidth="1" strokeOpacity="0.4"/>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#5DCAA5" strokeWidth="1" strokeOpacity="0.3"/>
              <circle cx="100" cy="100" r="30" fill="none" stroke="#5DCAA5" strokeWidth="1" strokeOpacity="0.3"/>
              <path d="M100 100 L100 10 A90 90 0 0 1 190 100 Z" fill="url(#sweep2)"/>
              <circle cx="100" cy="100" r="4" fill="#5DCAA5"/>
            </svg>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* How it works — compact vertical */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {[
              { n: '1', title: 'Upload your CV', desc: 'PDF or text — we extract skills instantly' },
              { n: '2', title: 'Radar scans all boards', desc: 'LinkedIn, Indeed, Glassdoor & more in parallel' },
              { n: '3', title: 'Get scored matches', desc: 'Every job scored 0–100 against your profile' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-xl p-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-teal-accent/30 border border-teal-accent/50 flex items-center justify-center text-white font-bold text-xs">{n}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom stats strip ── */}
      <div className="shrink-0 bg-black/20 py-3 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-center">
          {[
            { value: '10,000+', label: 'jobs scanned daily' },
            { value: 'AI-powered', label: 'match scoring' },
            { value: 'Free forever', label: 'no credit card' },
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{value}</span>
              <span className="text-white/50 text-xs">{label}</span>
            </div>
          ))}
          <p className="text-white/30 text-xs sm:ml-auto">RadarJobs © 2025</p>
        </div>
      </div>
    </main>
  )
}
