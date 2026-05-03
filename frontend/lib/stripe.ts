import { loadStripe } from '@stripe/stripe-js'

const KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
let stripePromise: ReturnType<typeof loadStripe> | null = null

export function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(KEY)
  return stripePromise
}

export async function redirectToCheckout(plan: 'monthly' | 'quarterly') {
  const { createClient } = await import('@/lib/supabase')
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ plan }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create checkout session')
  }
  const { url } = await res.json()
  window.location.href = url
}

export async function redirectToPortal() {
  const res = await fetch('/api/billing/portal', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create portal session')
  const { url } = await res.json()
  window.location.href = url
}
