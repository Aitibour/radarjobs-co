'use client'

import Link from 'next/link'

export default function LandingPage() {
  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-white font-sans">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-dark to-teal-mid">
        {/* Radar animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="relative w-[600px] h-[600px] opacity-10">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-teal-accent animate-ping"
                style={{
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: '3s',
                  transform: `scale(${i * 0.25})`,
                  top: '50%',
                  left: '50%',
                  marginTop: `-${i * 75}px`,
                  marginLeft: `-${i * 75}px`,
                  width: `${i * 150}px`,
                  height: `${i * 150}px`,
                }}
              />
            ))}
            {/* Sweep line */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 600 600"
              style={{ animation: 'spin 4s linear infinite' }}
            >
              <defs>
                <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5DCAA5" stopOpacity="0" />
                  <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path d="M300 300 L300 50 A250 250 0 0 1 550 300 Z" fill="url(#sweep)" />
              <circle cx="300" cy="300" r="250" fill="none" stroke="#5DCAA5" strokeWidth="1.5" />
              <circle cx="300" cy="300" r="175" fill="none" stroke="#5DCAA5" strokeWidth="1" />
              <circle cx="300" cy="300" r="100" fill="none" stroke="#5DCAA5" strokeWidth="1" />
              <circle cx="300" cy="300" r="4" fill="#5DCAA5" />
            </svg>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Scanning 50+ job boards in real-time</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Your CV on radar.
            <br />
            <span style={{ color: '#5DCAA5' }}>The right job locked on.</span>
          </h1>

          <p className="text-white/80 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed">
            AI scans LinkedIn, Indeed, Glassdoor and more — then scores each role against your CV in seconds.{' '}
            <span className="text-white font-semibold">100% free.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/scan"
              className="inline-flex items-center justify-center gap-2 bg-white text-teal-dark font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Scan my CV free →
            </Link>
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-semibold text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              See how it works
            </button>
          </div>

          {/* Floating stat chips */}
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Reed', 'Monster', '+46 more'].map((board) => (
              <span
                key={board}
                className="bg-white/10 border border-white/20 text-white/80 text-sm px-3 py-1 rounded-full"
              >
                {board}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-teal-dark py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          {[
            { value: '10,000+', label: 'jobs scanned daily' },
            { value: 'AI-powered', label: 'match scoring' },
            { value: 'Free forever', label: 'no credit card' },
          ].map(({ value, label }) => (
            <div key={value} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span className="text-white font-bold text-lg">{value}</span>
              <span className="text-white/60 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-teal-dark mb-4">
              How RadarJobs works
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From CV upload to scored matches in under 60 seconds — no account required to start.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-teal-light rounded-2xl p-8 flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="#085041" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="absolute top-6 right-6 text-5xl font-black text-teal-mid/20">1</span>
              <h3 className="text-xl font-bold text-teal-dark">Upload your CV</h3>
              <p className="text-gray-600 leading-relaxed">
                Paste or upload your CV — PDF or text. We extract your skills and experience instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-teal-light rounded-2xl p-8 flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="#085041" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="3" stroke="#085041" strokeWidth={1.8} />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
                </svg>
              </div>
              <span className="absolute top-6 right-6 text-5xl font-black text-teal-mid/20">2</span>
              <h3 className="text-xl font-bold text-teal-dark">Radar scans 50+ job boards</h3>
              <p className="text-gray-600 leading-relaxed">
                We scan LinkedIn, Indeed, Glassdoor and more in parallel. No account needed on those sites.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-teal-light rounded-2xl p-8 flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="#085041" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="absolute top-6 right-6 text-5xl font-black text-teal-mid/20">3</span>
              <h3 className="text-xl font-bold text-teal-dark">Get your match score + alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Every job gets scored 0–100 against your CV. Get daily email alerts for roles above your threshold.
              </p>
            </div>
          </div>

          {/* CTA under how it works */}
          <div className="mt-16 text-center">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 bg-teal-dark text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-teal-mid hover:scale-105 transition-all duration-200"
            >
              Try it free — no sign-up needed →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-teal-dark py-8 px-6 text-center">
        <p className="text-white/60 text-sm">
          RadarJobs © 2025 · Built for job seekers who hate manual searching
        </p>
      </footer>
    </main>
  )
}
