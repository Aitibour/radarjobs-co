import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY ?? '').trim()
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
}

const PRICES = {
  monthly:   () => (process.env.STRIPE_PRICE_MONTHLY ?? '').trim(),
  quarterly: () => (process.env.STRIPE_PRICE_ANNUAL  ?? '').trim(),
}

export async function POST(req: NextRequest) {
  try {
    // Require authenticated user server-side
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n) => cookieStore.get(n)?.value } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json() as { plan: 'monthly' | 'quarterly' }
    const { plan } = body
    const priceId = PRICES[plan]?.()
    if (!priceId) return NextResponse.json({ error: 'Invalid plan or missing price configuration' }, { status: 400 })

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://radarjobs.co').trim()
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url:  `${appUrl}/pricing`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
