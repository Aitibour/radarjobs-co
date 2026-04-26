'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const FREE_FEATURES = [
  '5 CV scans on signup',
  '5 CV scans monthly',
  '5 job matches per scan',
  'Match score & keyword analysis',
  'Basic application tracker',
  'Job board access',
  'No credit card required',
]

const PRO_FEATURES = [
  'Unlimited CV scans',
  'Unlimited AI optimizations',
  'AI cover letter generator',
  'AI interview prep — questions & coached answers',
  'Unlimited job matches per scan',
  'Unlimited keyword comparisons',
  'Unlimited ATS & recruiter findings',
  'AI job match scoring',
  'Daily email job alerts',
  'Unlimited application tracker',
  'Download CV as PDF or Word',
  'Priority support',
]

const FAQS = [
  {
    q: 'What happens after my free scans run out?',
    a: 'You keep access to your previous results. To run new scans, upgrade for unlimited access — or wait until next month when your 5 free scans reset.',
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

const LOGOS = [
  {
    name: 'Amazon',
    svg: (
      <svg viewBox="0 0 603 182" className="h-6 w-auto" fill="currentColor">
        <path d="M373.2 144.5c-34.8 25.7-85.3 39.4-128.8 39.4-60.9 0-115.8-22.5-157.3-60 -3.3-3 -.3-7 3.6-4.7 44.8 26 100.2 41.7 157.4 41.7 38.6 0 81-8 120-24.5 5.9-2.5 10.8 3.8 4.1 8z"/>
        <path d="M387.3 128.8c-4.5-5.7-29.6-2.7-40.9-1.4-3.4.4-3.9-2.6-.9-4.7 20-14.1 52.9-10 56.7-5.3 3.8 4.8-1 37.8-19.8 53.6-2.9 2.4-5.6 1.1-4.3-2.1 4.2-10.5 13.7-34.4 9.2-40.1z"/>
        <path d="M347.6 20.5V7.6c0-2 1.5-3.3 3.3-3.3h58.5c1.9 0 3.4 1.4 3.4 3.3v11.1c0 1.9-1.6 4.3-4.3 8.1l-30.3 43.2c11.3-.3 23.2 1.4 33.4 7.1 2.3 1.3 2.9 3.2 3.1 5v13.7c0 1.9-2.1 4.2-4.3 3-17.9-9.4-41.7-10.4-61.5.1-2 1.1-4.2-1.1-4.2-3V82.4c0-2.1 0-5.7 2.2-8.9l35.1-50.3h-30.6c-1.9 0-3.3-1.3-3.3-3.2v-.5z"/>
        <path d="M124.4 99.6H109c-1.7-.1-3.1-1.4-3.2-3.1V7.8c0-1.8 1.5-3.3 3.4-3.3h14.4c1.8.1 3.2 1.5 3.3 3.2v11.7h.3c3.7-11.5 10.8-16.9 20.3-16.9 9.7 0 15.7 5.4 20.1 16.9 3.7-11.5 12.2-16.9 21.2-16.9 6.4 0 13.4 2.6 17.7 8.6 4.8 6.6 3.8 16.2 3.8 24.6l-.1 61.2c0 1.8-1.5 3.3-3.4 3.3h-15.3c-1.8-.1-3.3-1.6-3.3-3.3V42.4c0-3.3.3-11.5-.4-14.6-1.1-5.3-4.4-6.8-8.7-6.8-3.6 0-7.3 2.4-8.8 6.2-1.5 3.9-1.4 10.3-1.4 15.2v54.5c0 1.8-1.5 3.3-3.4 3.3h-15.3c-1.8-.1-3.3-1.6-3.3-3.3l-.1-54.5c0-11.5 1.9-28.4-9.2-28.4-11.2 0-10.8 16.6-10.8 28.4v54.5c0 1.8-1.5 3.3-3.4 3.3z"/>
        <path d="M456.6 2.9c23.1 0 35.6 19.8 35.6 45.1 0 24.4-13.9 43.8-35.6 43.8-22.7 0-35-19.8-35-44.6 0-25 12.4-44.3 35-44.3zm.1 16.3c-11.4 0-12.2 15.6-12.2 25.3s-.1 30.6 12.1 30.6c12 0 12.6-16.8 12.6-27 0-6.7-.3-14.7-2.3-21.1-1.8-5.5-5.3-7.8-10.2-7.8z"/>
        <path d="M521.8 99.6h-15.4c-1.8-.1-3.3-1.6-3.3-3.3l-.1-88.7c.2-1.7 1.7-3 3.4-3h14.3c1.6.1 2.9 1.2 3.3 2.7v13.6h.3c4.3-12.3 10.3-18.1 20.9-18.1 6.9 0 13.5 2.5 17.8 9.3 4 6.4 4 17.1 4 24.8v60c-.2 1.7-1.7 3-3.4 3h-15.4c-1.6-.1-3-1.4-3.2-3V41.3c0-11.3 1.3-27.9-9.3-27.9-3.6 0-6.9 2.4-8.6 6.1-2.1 4.7-2.3 9.4-2.3 14.7v62.2c-.1 1.8-1.6 3.2-3.4 3.2z"/>
        <path d="M295.5 55.4v-5c-15.5 0-31.9 3.3-31.9 21.5 0 9.2 4.8 15.5 12.9 15.5 6 0 11.3-3.7 14.7-9.7 4.1-7.4 4.3-14.4 4.3-22.3zm21 44c-1.4 1.2-3.4 1.3-5 .5-7-5.8-8.2-8.5-12-14.1-11.5 11.7-19.6 15.2-34.5 15.2-17.6 0-31.4-10.9-31.4-32.6 0-17 9.2-28.5 22.3-34.1 11.4-5 27.2-5.9 39.3-7.2v-2.7c0-5 .4-10.9-2.6-15.2-2.6-3.9-7.5-5.5-11.9-5.5-8.1 0-15.3 4.1-17.1 12.7-.4 1.9-1.8 3.7-3.7 3.8l-14.8-1.6c-1.6-.4-3.4-1.7-3-4.2 3.5-18.3 20-23.8 34.8-23.8 7.6 0 17.5 2 23.5 7.8 7.6 7.1 6.9 16.6 6.9 26.9v24.4c0 7.3 3 10.5 5.9 14.5 1 1.4 1.2 3.1-.1 4.2-3.2 2.7-8.8 7.6-11.9 10.4l.3-.9z"/>
        <path d="M54.1 55.4v-5c-15.5 0-31.9 3.3-31.9 21.5 0 9.2 4.8 15.5 12.9 15.5 6 0 11.3-3.7 14.7-9.7 4.1-7.4 4.3-14.4 4.3-22.3zm21 44c-1.4 1.2-3.4 1.3-5 .5-7-5.8-8.2-8.5-12-14.1-11.5 11.7-19.6 15.2-34.5 15.2C5.9 101 -7.9 90.1-7.9 68.4c0-17 9.2-28.5 22.3-34.1 11.4-5 27.2-5.9 39.3-7.2v-2.7c0-5 .4-10.9-2.6-15.2-2.6-3.9-7.5-5.5-11.9-5.5-8.1 0-15.3 4.1-17.1 12.7-.4 1.9-1.8 3.7-3.7 3.8L3.6 18.6c-1.6-.4-3.4-1.7-3-4.2C4.1-3.9 20.6-9.4 35.4-9.4c7.6 0 17.5 2 23.5 7.8 7.6 7.1 6.9 16.6 6.9 26.9v24.4c0 7.3 3 10.5 5.9 14.5 1 1.4 1.2 3.1-.1 4.2-3.2 2.7-8.8 7.6-11.9 10.4l.3-.9z"/>
      </svg>
    ),
  },
  {
    name: 'Google',
    svg: (
      <svg viewBox="0 0 272 92" className="h-6 w-auto" fill="currentColor">
        <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
        <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
        <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
        <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
        <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
        <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65H35.29z" fill="#4285F4"/>
      </svg>
    ),
  },
  {
    name: 'Apple',
    svg: (
      <svg viewBox="0 0 814 1000" className="h-7 w-auto" fill="currentColor">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-109.2c-52.7-77.8-94.3-203.3-94.3-322.3C0 459.1 37.6 365.7 108.2 314c48.3-34.5 101.7-51.8 154.5-51.8 61.9 0 107.1 40.1 162.7 40.1 53.3 0 86.1-40.1 163.4-40.1 30.4 0 109.1 2.6 163.4 64.7zm-131.1-164.5C628.3 104.5 626.2 5 607.7 5c-2.6 0-5.8.6-9 1.3-25.1 9.7-67.3 61-67.3 148.1 0 87.1 40.2 131.5 61 131.5 2.6 0 5.8-.6 9-1.9 25.1-9.7 55.6-46.4 55.6-107.5z"/>
      </svg>
    ),
  },
  {
    name: 'Microsoft',
    svg: (
      <svg viewBox="0 0 23 23" className="h-6 w-auto">
        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
        <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
      </svg>
    ),
  },
  {
    name: 'Shopify',
    svg: (
      <svg viewBox="0 0 109.5 124.5" className="h-7 w-auto" fill="currentColor">
        <path d="M74.7 14.8s-.4.1-1 .3c-.1-.3-.3-.7-.5-1.1-.7-1.4-1.7-2.1-3-2.1-.1 0-.1 0-.2 0-.4-.5-.9-1-1.4-1.4-1.7-1.6-3.8-2.3-6.2-2.2-4.8.2-9.6 3.6-13.4 9.7-.1.1-.1.2-.2.3-2.7 4.5-4.8 10.1-5.4 14.5l-9.4 2.9c-2.8.9-2.9.9-3.2 3.5-.2 2-.8 6.8-1.5 13.2L17 102.7l37.5 7 37.5-9.1-9.9-84.4c-.3-.1-.7-.3-1-.4-1-.3-4.3-1-6.4-1zM63.2 18c-3.2.9-6.8 2.1-10.3 3.2 1-3.9 3-7.8 5.4-10.4.9-.9 2.1-2 3.5-2.6 1.4 2.7 2.1 6.4 1.4 9.8zm-7.2-13.1c1.1 0 2 .2 2.8.7-1.3.7-2.6 1.7-3.8 3C52.2 12 50 16.6 49 21.8c-2.8.9-5.6 1.7-8.2 2.5 1.5-7.4 7.1-19.2 15.2-19.4zm8 7.4c1-3.9.1-7.6-1.4-10.1.1 0 .2 0 .3 0 1.7 0 2.7.7 3.3 2.1l.1.1c.1.4.2.8.2 1.2-.2 1.2-.8 4.1-2.5 6.7z" fill="#95BF47"/>
        <path d="M73.7 14.8c-.3-.1-.7-.3-1-.4-1-.3-4.3-1-6.4-1h-.1s-.4.1-1 .3c-.1-.3-.3-.7-.5-1.1-.7-1.4-1.7-2.1-3-2.1-.1 0-.1 0-.2 0-.4-.5-.9-1-1.4-1.4-1.7-1.6-3.8-2.3-6.2-2.2-4.8.2-9.6 3.6-13.4 9.7-.1.1-.1.2-.2.3-2.7 4.5-4.8 10.1-5.4 14.5l-9.4 2.9c-2.8.9-2.9.9-3.2 3.5-.2 2-.8 6.8-1.5 13.2l-13.5 82 37.5 7 37.5-9.1-9.6-84.4h.1zM63.2 18c-3.2.9-6.8 2.1-10.3 3.2 1-3.9 3-7.8 5.4-10.4.9-.9 2.1-2 3.5-2.6 1.4 2.7 2.1 6.4 1.4 9.8z" fill="#5E8E3E"/>
        <path d="M54.5 124.5l37.5-9.1-9.9-84.4s-7 4.2-13.1 7.3c-2.4 1.2-4.6 2.3-6.4 3.1.5 2.3.9 4.7 1.3 7.1l-5.1 3.8c-.4-2.3-.7-4.6-1.2-6.8-1.9.6-3.3 1-3.3 1l-9.4 2.9c-2.8.9-2.9.9-3.2 3.5-.2 2-.8 6.8-1.5 13.2L17 102.7l37.5 21.8z" fill="#FFF" opacity=".5"/>
      </svg>
    ),
  },
  {
    name: 'Netflix',
    svg: (
      <svg viewBox="0 0 111 30" className="h-5 w-auto" fill="currentColor">
        <path d="M105.06 23.991c-3.677.13-7.361.468-11.032.794-.701-1.799-1.47-3.584-2.211-5.378-2.26 3.956-4.52 7.919-6.843 11.814a80.916 80.916 0 00-9.617-.62c3.614-6.13 7.243-12.246 10.8-18.413-3.323-6.617-6.638-13.256-10.003-19.852 3.226.13 6.453.26 9.688.376 1.931 4.242 3.877 8.5 5.749 12.75 1.938-4.243 3.84-8.493 5.794-12.73 3.083.213 6.166.415 9.26.604-3.447 6.27-6.87 12.548-10.234 18.856 3.742 7.135 7.46 14.26 11.072 21.441 3.671-.293 7.351-.499 11.025-.686L105.06 23.99zM80.695 0c-3.226-.13-6.453-.26-9.688-.376L64.06 30c3.226.13 6.453.26 9.688.376L80.694 0zM24.02 3.24l.009.002L28.05 30c3.226-.13 6.453-.26 9.688-.376l3.972-26.632c3.325.084 6.65.191 9.97.318L51.684.006C41.15-.13 30.607.044 20.05.308c.009 1.028.013 2.055.013 3.085L24.02 3.24zM0 29.383c3.226-.13 6.453-.26 9.688-.376L9.676 0 0 0 0 29.383z"/>
      </svg>
    ),
  },
]

const CHECK = (
  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
)

export default function PricingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const handleUpgrade = (plan: 'monthly' | 'quarterly') => {
    router.push(`/signup?plan=${plan}`)
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-teal-dark/5 to-transparent py-14 px-6 text-center">
        <h1 className="animate-fadeInUp text-4xl font-extrabold text-gray-900 mb-3">
          Boost your interview chances.
        </h1>
        <p className="animate-fadeInUp delay-100 text-gray-500 text-lg mb-2">Cancel any time.</p>
        <p className="animate-fadeInUp delay-200 text-sm font-semibold text-teal-mid">
          Up to 60% cheaper than the competition — same AI power.
        </p>
      </div>

      {/* Plans — 3 columns */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="reveal grid md:grid-cols-3 gap-5 mb-6">

          {/* Free */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm mb-2">/forever</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Get started — no card needed.</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="text-teal-mid">{CHECK}</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/scan"
              className="w-full py-3 rounded-xl border-2 border-teal-mid text-teal-dark font-bold text-sm text-center hover:bg-teal-light transition-colors">
              Start free →
            </Link>
          </div>

          {/* Quarterly — BEST VALUE */}
          <div className="bg-gradient-to-br from-teal-dark to-teal-mid rounded-2xl p-7 flex flex-col relative overflow-hidden shadow-xl">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-extrabold text-teal-dark bg-teal-accent px-3 py-1 rounded-full">BEST VALUE</span>
            </div>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Quarterly</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-white">$19.98</span>
            </div>
            <p className="text-white/60 text-sm leading-snug mb-1">per month</p>
            <p className="text-white/50 text-xs mb-1">Billed as $59.95 every 3 months</p>
            <span className="text-xs font-bold text-teal-accent mb-6">Save 40%</span>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                  <span className="text-teal-accent">{CHECK}</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('quarterly')}
              
              className="w-full py-3.5 rounded-xl bg-white text-teal-dark font-extrabold text-sm hover:bg-teal-light disabled:opacity-60 transition-colors shadow-md">
              Get Quarterly →
            </button>
            <p className="text-center text-xs text-white/40 mt-3">Cancel anytime · Secure checkout via Stripe</p>
          </div>

          {/* Monthly */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900">$39.95</span>
            </div>
            <p className="text-gray-400 text-sm leading-snug mb-1">per month</p>
            <p className="text-gray-300 text-xs mb-6">Billed as $39.95 every month</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="text-teal-mid">{CHECK}</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('monthly')}
              
              className="w-full py-3.5 rounded-xl bg-teal-dark text-white font-extrabold text-sm hover:bg-teal-mid disabled:opacity-60 transition-colors shadow-md">
              Get Monthly →
            </button>
            <p className="text-center text-xs text-gray-300 mt-3">Cancel anytime · Secure checkout via Stripe</p>
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
        <div className="reveal text-center mb-16">
          <p className="text-sm font-semibold text-gray-400 mb-6">
            Job seekers landing roles at top companies use RadarJobs
          </p>
          <div className="flex items-center justify-center flex-wrap gap-10">
            {LOGOS.map(({ name, svg }) => (
              <div key={name} className="text-gray-200 opacity-60 hover:opacity-80 transition-opacity" title={name}>
                {svg}
              </div>
            ))}
          </div>
        </div>

        {/* Feature comparison */}
        <div className="reveal bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-4 text-gray-500 font-semibold w-[46%]">Feature</th>
                <th className="text-center px-3 py-4 text-gray-600 font-bold">Free</th>
                <th className="text-center px-3 py-4 text-teal-dark font-bold">Quarterly</th>
                <th className="text-center px-3 py-4 text-gray-700 font-bold">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CV scans',                   '5 / month',  'Unlimited', 'Unlimited'],
                ['Job matches per scan',        '5',          'Unlimited', 'Unlimited'],
                ['Match score & keyword gap',   '✓',          '✓',         '✓'],
                ['AI CV optimization',          '—',          '✓',         '✓'],
                ['AI cover letter',             '—',          '✓',         '✓'],
                ['AI interview prep',           '—',          '✓',         '✓'],
                ['Keyword comparisons',         '—',          'Unlimited', 'Unlimited'],
                ['Daily email alerts',          '—',          '✓',         '✓'],
                ['Application tracker',         'Basic',      'Unlimited', 'Unlimited'],
                ['Download PDF / Word',         '—',          '✓',         '✓'],
              ].map(([feat, free, quarterly, monthly], i) => (
                <tr key={feat} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="px-6 py-3 text-gray-700">{feat}</td>
                  <td className="text-center px-3 py-3 text-gray-400">{free}</td>
                  <td className="text-center px-3 py-3 font-semibold text-teal-dark">{quarterly}</td>
                  <td className="text-center px-3 py-3 text-gray-600">{monthly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="reveal max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Frequently asked questions</h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                  <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
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

      <Footer />
    </div>
  )
}
