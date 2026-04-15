'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setIsAuthed(true)
        setIsChecking(false)
      }
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthed(true)
        setIsChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isChecking) {
    return (
      <div className="min-h-screen bg-teal-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Radar loading spinner */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 animate-spin" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#E1F5EE" strokeWidth="4" />
              <path
                d="M32 4a28 28 0 0 1 28 28"
                stroke="#1D9E75"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-teal-mid" />
            </div>
          </div>
          <p className="text-teal-dark font-medium text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (!isAuthed) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
