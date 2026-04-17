'use client'

import Link from 'next/link'
import { useState } from 'react'
import { redirectToCheckout } from '@/lib/stripe'

const FREE_FEATURES = [
  '3 CV scans per month',
  '5 job matches per scan',
  'Match score + keyword analysis',
  'Basic application tracking',
  'No credit card required',
]

const PRO_FEATURES = [
  'Unlimited CV scans',
  '15 job matches per scan (full results)',
  '✨ Magic AI — add missing keywords to CV',
  '📝 AI cover letter generation',
  '🎯 Interview prep — questions + coached answers',
  '⬇️ Download CV as PDF or Word',
  '📬 Daily email job alerts',
  'Full application tracker (unlimited)',
  'Priority support',
]

const FAQS = [
  {
    q: 'How does the free plan work?',
    a: 'You get 3 full CV scans per month — no credit card needed. Each scan searches 50+ job boards and returns the top 5 matches scored against your CV.',
  },
  {
    q: 'What counts as a scan?',
    a: 'One scan = one run of the full pipeline: CV parsing → job board search → AI scoring. Browsing results or re-opening a job does not count.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings and your Pro access continues until the end of the billing period. No questions asked.',
  },
  {
    q: 'Is my CV data safe?',
    a: 'Your CV is stored encrypted in Supabase (row-level security). It is never shared with third parties or used to train AI models.',
  },
  {
    q: 'What job boards are covered?',
    a: 'LinkedIn, Indeed, Glassdoor, Google Jobs, and 46+ more — all via the JSearch aggregator. Results from the last 15 days.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      await redirectToCheckout(annual ? 'annual' : 'monthly')
    } catch {
      setCheckoutLoading(false)
      alert('Could not start checkout. Please try again.')
    }
  }

  const proPrice = annual ? 99 : 12
  const proLabel = annual ? '/year' : '/month'
  const proSaving = annual ? 'Save $45' : null

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

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
      <div className="bg-gradient-to-b from-teal-dark/5 to-transparent py-16 px-6 text-center">
        <p className="text-teal-mid text-sm font-bold uppercase tracking-wider mb-3">Pricing</p>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Start free. Upgrade when you need the AI features that land jobs faster.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-semibold ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-teal-mid' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : 'translate-x-1'}`}/>
          </button>
          <span className={`text-sm font-semibold ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
            Annual
            <span className="ml-1.5 text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Save 31%</span>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6 mb-16">

          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-400 text-sm mb-1.5">/forever</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">Get started — no card needed.</p>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="text-teal-mid mt-0.5 shrink-0">✓</span>
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
            <div className="mb-6">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">${proPrice}</span>
                <span className="text-white/60 text-sm mb-1.5">{proLabel}</span>
                {proSaving && (
                  <span className="ml-2 text-xs font-bold text-teal-accent bg-white/10 px-2 py-0.5 rounded-full mb-1.5">{proSaving}</span>
                )}
              </div>
              <p className="text-white/60 text-sm mt-2">Everything you need to land the job.</p>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                  <span className="text-teal-accent mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="w-full py-3.5 rounded-xl bg-white text-teal-dark font-extrabold text-sm hover:bg-teal-light disabled:opacity-60 transition-colors shadow-md">
              {checkoutLoading ? 'Redirecting…' : 'Get Pro →'}
            </button>
            {annual && (
              <p className="text-center text-xs text-white/50 mt-3">Billed as $99/year · Cancel anytime</p>
            )}
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-gray-500 font-semibold w-[55%]">Feature</th>
                <th className="text-center px-4 py-4 text-gray-700 font-bold">Free</th>
                <th className="text-center px-4 py-4 text-teal-dark font-bold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CV scans', '3 / month', 'Unlimited'],
                ['Job matches per scan', '5', '15'],
                ['Match score & keyword gap', '✓', '✓'],
                ['Magic AI — CV enhancement', '✗', '✓'],
                ['AI cover letter', '✗', '✓'],
                ['Interview prep AI', '✗', '✓'],
                ['Download PDF / Word', '✗', '✓'],
                ['Daily email alerts', '✗', '✓'],
                ['Application tracker', '3 jobs', 'Unlimited'],
              ].map(([feat, free, pro], i) => (
                <tr key={feat} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="px-6 py-3 text-gray-700">{feat}</td>
                  <td className="text-center px-4 py-3 text-gray-500">{free}</td>
                  <td className="text-center px-4 py-3 font-semibold text-teal-dark">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Frequently asked</h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                  <span className={`text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm mb-4">Still deciding? Start free — no credit card required.</p>
          <Link href="/scan"
            className="inline-flex items-center gap-2 font-bold text-sm bg-teal-dark text-white px-8 py-3.5 rounded-full shadow-lg hover:bg-teal-mid hover:scale-105 transition-all duration-200">
            Scan my CV free →
          </Link>
        </div>
      </div>
    </div>
  )
}
