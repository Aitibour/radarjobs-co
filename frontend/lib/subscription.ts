import { getSupabaseClient } from './supabase'

export type Plan = 'free' | 'pro'

export async function getUserPlan(): Promise<Plan> {
  try {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return 'free'

    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status, expires_at')
      .eq('user_id', session.user.id)
      .single()

    if (!data) return 'free'
    if (data.status !== 'active') return 'free'
    if (data.expires_at && new Date(data.expires_at) < new Date()) return 'free'
    return data.plan === 'pro' ? 'pro' : 'free'
  } catch {
    return 'free'
  }
}
