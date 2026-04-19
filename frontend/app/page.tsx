'use client'

import Link from 'next/link'
import { useState } from 'react'
import { redirectToCheckout } from '@/lib/stripe'

const BLIPS = [
  { label: 'Senior Dev',    match: '87%', pos: { top: '2px',    right: '-148px' }, delay: '0s'    },
  { label: 'ML Engineer',   match: '94%', pos: { top: '-52px',  left: '28px'    }, delay: '1.25s' },
  { label: 'Data Engineer', match: '91%', pos: { top: '80px',   left: '-148px'  }, delay: '2.5s'  },
  { label: 'UX Designer',   match: '79%', pos: { bottom: '-52px',left: '28px'   }, delay: '3.75s' },
]

const FREE_FEATURES = [
  '3 CV scans per month',
  '5 job matches per scan',
  'Match score + keyword analysis',
  'Basic application tracking',
  'No credit card required',
]

const PRO_FEATURES = [
  'Unlimited CV scans',
  '15 job matches per scan',
  '✨ Magic AI — add missing keywords to CV',
  '📝 AI cover letter generation',
  '🎯 Interview prep — questions + coached answers',
  '⬇️ Download CV as PDF or Word',
  '📬 Daily email job alerts',
  'Full application tracker (unlimited)',
  'Priority support',
]

export default function LandingPage() {
  const [annual, setAnnual] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const proPrice = annual ? 99 : 12
  const proLabel = annual ? '/year' : '/month'

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      await redirectToCheckout(annual ? 'annual' : 'monthly')
    } catch {
      setCheckoutLoading(false)
    }
  }

  return (
    <main className="bg-white font-sans">

      {/* ─── Nav ─────────────────────────────────────── */}
      <nav className="bg-gradient-to-r from-teal-dark to-teal-mid px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign in</Link>
            <Link href="/scan"
              className="text-sm font-bold bg-white text-teal-dark px-5 py-2 rounded-full hover:bg-teal-light hover:scale-105 transition-all duration-200 shadow-md">
              Try free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-dark to-teal-mid">
        <div className="max-w-6xl mx-auto px-8 py-20 flex items-center gap-12">

          {/* Left */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-7 w-fit bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse shrink-0"/>
              <span className="text-xs font-semibold text-white/90 tracking-wide">Live · 50+ job boards scanned</span>
            </div>

            <h1 className="font-black text-white leading-[1.1] tracking-tight mb-5"
                style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
              Put your CV on the Radar
              <br />
              <span className="text-teal-accent">for the right job.</span>
            </h1>

            <p className="text-white/70 mb-8 leading-relaxed max-w-md"
               style={{ fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)' }}>
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

          {/* Right: radar only */}
          <div className="hidden lg:flex w-[380px] items-center justify-center">
            <div className="relative" style={{ width: 220, height: 220 }}>
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, #5DCAA5 0%, transparent 70%)', opacity: 0.25, transform: 'scale(1.35)' }}/>
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
              {BLIPS.map(({ label, match, pos, delay }) => (
                <div key={label} className="absolute flex items-center gap-1.5 pointer-events-none"
                  style={{ ...pos, animation: `blipPop 5s ease-out ${delay} infinite`, zIndex: 2 }}>
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
                @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-black/20 border-t border-white/10 py-3 px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
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
          </div>
        </div>
      </div>

      {/* ─── How it works ───────────────────────────── */}
      <div className="py-24 px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-teal-mid text-sm font-bold uppercase tracking-wider text-center mb-3">How it works</p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-16">From CV to perfect match in minutes</h2>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                n: '01',
                icon: '📄',
                title: 'Upload your CV',
                desc: 'Drop a PDF or paste your text. Our AI extracts your skills, experience, and job title automatically.',
              },
              {
                n: '02',
                icon: '🔍',
                title: 'Radar scans 50+ boards',
                desc: 'We search LinkedIn, Indeed, Glassdoor, Google Jobs and 46 more — all jobs from the last 15 days.',
              },
              {
                n: '03',
                icon: '🎯',
                title: 'Get ranked matches',
                desc: 'Every job is scored against your profile. See matched keywords, gaps, and AI-powered suggestions.',
              },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-dark/5 flex items-center justify-center text-3xl mb-4">
                  {icon}
                </div>
                <span className="text-xs font-black text-teal-mid/50 tracking-widest mb-2">{n}</span>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/scan"
              className="inline-flex items-center gap-2 font-bold text-sm bg-teal-dark text-white px-8 py-3.5 rounded-full shadow-lg hover:bg-teal-mid hover:scale-105 transition-all duration-200">
              Try it free — no account needed →
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Pricing ─────────────────────────────────── */}
      <div className="py-24 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-teal-mid text-sm font-bold uppercase tracking-wider text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4">Simple, honest pricing</h2>
          <p className="text-gray-500 text-center mb-8">Start free. Upgrade when you need the AI features.</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-semibold ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-teal-mid' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`}/>
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1.5 text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Save 31%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-400 text-sm mb-1.5">/forever</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Get started — no card needed.</p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="text-teal-mid mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/scan"
                className="w-full py-3 rounded-xl border-2 border-teal-mid text-teal-dark font-bold text-sm text-center hover:bg-teal-light transition-colors">
                Start free →
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-teal-dark to-teal-mid rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-xl">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-extrabold text-teal-dark bg-teal-accent px-3 py-1 rounded-full">MOST POPULAR</span>
              </div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Pro</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold text-white">${proPrice}</span>
                <span className="text-white/60 text-sm mb-1.5">{proLabel}</span>
              </div>
              <p className="text-white/60 text-sm mb-6">Everything you need to land the job.</p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                    <span className="text-teal-accent mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={handleUpgrade} disabled={checkoutLoading}
                className="w-full py-3.5 rounded-xl bg-white text-teal-dark font-extrabold text-sm hover:bg-teal-light disabled:opacity-60 transition-colors shadow-md">
                {checkoutLoading ? 'Redirecting…' : 'Get Pro →'}
              </button>
              {annual && <p className="text-center text-xs text-white/50 mt-3">Billed as $99/year · Cancel anytime</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="bg-teal-dark py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="text-lg font-black tracking-tight">
            <span className="text-white">Radar</span><span className="text-teal-accent">Jobs</span>
          </span>
          <div className="flex items-center gap-6">
            <Link href="/scan"    className="text-xs text-white/50 hover:text-white transition-colors">Scan CV</Link>
            <Link href="/pricing" className="text-xs text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login"   className="text-xs text-white/50 hover:text-white transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-white/30">RadarJobs © 2026</p>
        </div>
      </footer>

    </main>
  )
}
