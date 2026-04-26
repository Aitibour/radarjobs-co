'use client'

import { useState } from 'react'
import { redirectToCheckout } from '@/lib/stripe'

const PRO_HIGHLIGHTS = [
  'Unlimited CV scans',
  'Unlimited AI optimizations',
  'AI cover letter generation',
  'AI interview prep questions',
  'LinkedIn profile optimizer',
  'Download CV as PDF or Word',
]

interface Props {
  scansUsed: number
  onClose: () => void
}

export default function UpgradeModal({ scansUsed, onClose }: Props) {
  const [loading, setLoading] = useState<'monthly' | 'quarterly' | null>(null)

  const handleUpgrade = async (plan: 'monthly' | 'quarterly') => {
    setLoading(plan)
    try {
      await redirectToCheckout(plan)
    } catch {
      setLoading(null)
      alert('Could not start checkout. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-teal-dark to-teal-mid px-6 pt-6 pb-8 relative">
          <button onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white text-lg leading-none">✕</button>
          <p className="text-teal-accent text-xs font-bold uppercase tracking-wider mb-1">Free limit reached</p>
          <h2 className="text-xl font-extrabold text-white mb-1">
            You've used {scansUsed}/5 free scans
          </h2>
          <p className="text-white/70 text-sm">Upgrade to unlock unlimited scans and all AI features.</p>
        </div>

        {/* Features */}
        <div className="px-6 py-4">
          <ul className="flex flex-col gap-2 mb-5">
            {PRO_HIGHLIGHTS.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-teal-mid shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleUpgrade('quarterly')}
              disabled={!!loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-dark to-teal-mid text-white font-extrabold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-md">
              {loading === 'quarterly' ? 'Redirecting…' : 'Quarterly — $19.98/mo · Save 40% →'}
            </button>
            <button
              onClick={() => handleUpgrade('monthly')}
              disabled={!!loading}
              className="w-full py-3 rounded-xl border-2 border-teal-mid text-teal-dark font-bold text-sm hover:bg-teal-light disabled:opacity-60 transition-colors">
              {loading === 'monthly' ? 'Redirecting…' : 'Monthly — $39.95/month'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime · Secure checkout via Stripe</p>
        </div>
      </div>
    </div>
  )
}
