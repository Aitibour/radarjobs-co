'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isLoadingOAuth, setIsLoadingOAuth] = useState(false)
  const [isLoadingMagic, setIsLoadingMagic] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleSignIn = async () => {
    setIsLoadingOAuth(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    })
    if (error) {
      setError(error.message)
      setIsLoadingOAuth(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setIsLoadingMagic(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    setIsLoadingMagic(false)
    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-teal-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-teal-dark rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-teal-dark tracking-tight">RadarJobs</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-1">
            Sign in to RadarJobs
          </h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            Save your CV, track matches, and get alerts.
          </p>

          {/* Magic link success */}
          {magicLinkSent ? (
            <div className="bg-teal-light border border-teal-accent rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-teal-mid/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-teal-dark text-lg mb-1">Check your email!</p>
              <p className="text-gray-600 text-sm">
                We sent a magic link to <span className="font-medium text-teal-dark">{email}</span>. Click it to sign in.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="mt-4 text-sm text-teal-mid hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              {/* Google OAuth button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoadingOAuth}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3.5 px-4 font-semibold text-gray-700 hover:border-teal-mid hover:bg-teal-light transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mb-5"
              >
                {isLoadingOAuth ? (
                  <svg className="w-5 h-5 animate-spin text-teal-mid" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {isLoadingOAuth ? 'Connecting…' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-mid transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoadingMagic || !email.trim()}
                  className="w-full bg-teal-dark text-white font-bold py-3.5 rounded-xl hover:bg-teal-mid transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingMagic ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    'Send magic link'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-teal-dark transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          By signing in you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  )
}
