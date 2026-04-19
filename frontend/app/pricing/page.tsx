'use client'

import Link from 'next/link'
import { useState } from 'react'
import { redirectToCheckout } from '@/lib/stripe'

const FREE_FEATURES = [
  '3 CV scans per month',
  '5 job matches per scan',
  'Match score & keyword analysis',
  'Basic application tracker',
  'No credit card required',
]

const PRO_FEATURES = [
  'Unlimited CV scans',
  '15 job matches per scan',
  'Magic AI — add missing keywords to CV',
  'AI cover letter generator',
  'AI interview prep — questions & coached answers',
  'Download CV as PDF or Word',
  'Daily email job alerts',
  'Unlimited application tracker',
  'Priority support',
]

const FAQS = [
  {
    q: 'What happens after my free scans run out?',
    a: 'You keep access to your previous results. To run new scans, upgrade to Pro for unlimited access — or wait until next month when your 3 free scans reset.',
  },
  {
    q: 'What counts as one scan?',
    a: 'One scan = one full pipeline run: CV parsing → 50+ job board search → AI scoring. Browsing results or opening a job does not count.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings and your Pro access continues until the end of the billing period. No questions asked, no cancellation fees.',
  },
  {
    q: 'How do you secure my CV data?',
    a: 'Your CV is stored encrypted in Supabase with row-level security. It is never shared with third parties or used to train AI models.',
  },
  {
    q: 'What job boards are covered?',
    a: 'LinkedIn, Indeed, Glassdoor, Google Jobs, and 46+ more — all via the JSearch aggregator. Results from the last 15 days, refreshed every scan.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards via Stripe. We do not store your card details — Stripe handles all payment processing with industry-standard encryption.',
  },
  {
    q: 'Do you offer team or organization plans?',
    a: 'Yes — contact us at a.aitibour@gmail.com for volume pricing for recruiting teams, career centres, and outplacement firms.',
  },
]

const LOGOS = ['Amazon', 'Google', 'Apple', 'Microsoft', 'Shopify', 'Netflix']

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)

  const proPrice  = annual ? 8 : 12
  const proLabel  = annual ? '/mo, billed $99/yr' : '/month'
  const proSaving = annual ? 'Save 33%' : null

  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    setLoading(plan)
    try {
      await redirectToCheckout(plan)
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-gradient-to-r from-teal-dark to-teal-mid px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path d="M4 14a10 10 0 0 1 10-10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 14a10 10 0 0 1-10 10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M8 14a6 6 0 0 1 6-6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 14a6 6 0 0 1-6 6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="14" cy="14" r="2.5" fill="white"/>
            </svg>
            <span className="text-lg font-black tracking-tight">
              <span className="text-white">Radar</span><span className="text-teal-accent">Jobs</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">Sign in</Link>
            <Link href="/scan" className="text-sm font-bold bg-white text-teal-dark px-4 py-1.5 rounded-full hover:bg-teal-light transition-colors">
              Try free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-teal-dark/5 to-transparent py-14 px-6 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          Boost your interview chances.
        </h1>
        <p className="text-gray-500 text-lg mb-2">Cancel any time.</p>
        <p className="text-sm font-semibold text-teal-mid">
          Up to 75% cheaper than the competition — same AI power.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-semibold ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? 'bg-teal-mid' : 'bg-gray-300'}`}>
            <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
              style={{ left: annual ? '26px' : '4px' }}/>
          </button>
          <span className={`text-sm font-semibold ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
            Annual
            <span className="ml-1.5 text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Save 33%</span>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Free */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm mb-2">/forever</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Get started — no card needed.</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-teal-mid mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  {f}
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
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-white">${proPrice}</span>
              <div className="mb-2 ml-1">
                <span className="text-white/60 text-sm block leading-tight">{proLabel}</span>
                {proSaving && <span className="text-xs font-bold text-teal-accent">{proSaving}</span>}
              </div>
            </div>
            <p className="text-white/60 text-sm mb-6">Everything you need to land the job.</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                  <svg className="w-4 h-4 text-teal-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(annual ? 'annual' : 'monthly')}
              disabled={!!loading}
              className="w-full py-3.5 rounded-xl bg-white text-teal-dark font-extrabold text-sm hover:bg-teal-light disabled:opacity-60 transition-colors shadow-md">
              {loading ? 'Redirecting…' : `Get Pro →`}
            </button>
            <p className="text-center text-xs text-white/40 mt-3">Cancel anytime · Secure checkout via Stripe</p>
          </div>
        </div>

        {/* Org CTA */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3 mb-16">
          <div>
            <p className="text-sm font-bold text-gray-800">Are you an organization?</p>
            <p className="text-xs text-gray-500 mt-0.5">Volume pricing for recruiting teams, career centres & outplacement firms.</p>
          </div>
          <a href="mailto:a.aitibour@gmail.com"
            className="text-sm font-bold text-teal-dark border-2 border-teal-mid px-5 py-2 rounded-full hover:bg-teal-light transition-colors whitespace-nowrap">
            Contact us →
          </a>
        </div>

        {/* Social proof */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-400 mb-6">
            Job seekers landing roles at top companies use RadarJobs
          </p>
          <div className="flex items-center justify-center flex-wrap gap-8">
            {LOGOS.map(name => (
              <span key={name} className="text-lg font-black text-gray-200 tracking-tight select-none">{name}</span>
            ))}
          </div>
        </div>

        {/* Feature comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-4 text-gray-500 font-semibold w-[55%]">Feature</th>
                <th className="text-center px-4 py-4 text-gray-600 font-bold">Free</th>
                <th className="text-center px-4 py-4 text-teal-dark font-bold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CV scans',                  '3 / month',  'Unlimited'],
                ['Job matches per scan',       '5',          '15'],
                ['Match score & keyword gap',  '✓',          '✓'],
                ['Magic AI — CV enhancement',  '—',          '✓'],
                ['AI cover letter',            '—',          '✓'],
                ['Interview prep AI',          '—',          '✓'],
                ['Download PDF / Word',        '—',          '✓'],
                ['Daily email alerts',         '—',          '✓'],
                ['Application tracker',        '3 jobs',     'Unlimited'],
              ].map(([feat, free, pro], i) => (
                <tr key={feat} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="px-6 py-3 text-gray-700">{feat}</td>
                  <td className="text-center px-4 py-3 text-gray-400">{free}</td>
                  <td className="text-center px-4 py-3 font-semibold text-teal-dark">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Frequently asked questions</h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                  <span className={`text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Still deciding? Start free — no credit card required.</p>
          <Link href="/scan"
            className="inline-flex items-center gap-2 font-bold text-sm bg-teal-dark text-white px-8 py-3.5 rounded-full shadow-lg hover:bg-teal-mid hover:scale-105 transition-all duration-200">
            Scan my CV free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm font-black tracking-tight">
            <span className="text-teal-dark">Radar</span><span className="text-teal-mid">Jobs</span>
          </span>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Home</Link>
            <Link href="/scan" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Scan CV</Link>
            <a href="mailto:a.aitibour@gmail.com" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-300">RadarJobs © 2026</p>
        </div>
      </footer>
    </div>
  )
}
