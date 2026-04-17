import { loadStripe } from '@stripe/stripe-js'

const KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
let stripePromise: ReturnType<typeof loadStripe> | null = null

export function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(KEY)
  return stripePromise
}

export async function redirectToCheckout(plan: 'monthly' | 'annual') {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
  if (!res.ok) throw new Error('Failed to create checkout session')
  const { url } = await res.json()
  window.location.href = url
}

export async function redirectToPortal() {
  const res = await fetch('/api/billing/portal', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create portal session')
  const { url } = await res.json()
  window.location.href = url
}
