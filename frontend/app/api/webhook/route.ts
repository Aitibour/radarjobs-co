import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = body.type

    console.log('[Webhook] Received event:', event, body)

    // Handle auth events
    if (event === 'INSERT' && body.table === 'users') {
      // User just signed up — could trigger welcome email
      console.log('[Webhook] New user:', body.record?.email)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
