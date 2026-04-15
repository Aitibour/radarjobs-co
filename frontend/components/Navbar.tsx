'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } finally {
      setSigningOut(false)
    }
  }

  const navLinks = (
    <>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-gray-600 hover:text-teal-dark transition-colors"
        onClick={() => setMenuOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        href="/scan"
        className="text-sm font-semibold text-teal-mid hover:opacity-80 transition-opacity"
        onClick={() => setMenuOpen(false)}
      >
        New Scan
      </Link>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </>
  )

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-teal-light shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="RadarJobs home">
          {/* Radar icon: two concentric arcs + center dot */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            {/* Outer arc */}
            <path
              d="M4 14a10 10 0 0 1 10-10"
              stroke="#1D9E75"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M24 14a10 10 0 0 1-10 10"
              stroke="#1D9E75"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Inner arc */}
            <path
              d="M8 14a6 6 0 0 1 6-6"
              stroke="#5DCAA5"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M20 14a6 6 0 0 1-6 6"
              stroke="#5DCAA5"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Center dot */}
            <circle cx="14" cy="14" r="2.5" fill="#085041" />
          </svg>

          <span className="text-xl font-bold tracking-tight">
            <span className="text-teal-dark">Radar</span>
            <span className="text-teal-mid">Jobs</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6" aria-label="Main navigation">
          {navLinks}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-md text-gray-500 hover:text-teal-dark hover:bg-teal-light transition-colors"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            /* X icon */
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-teal-light bg-white px-4 py-4 flex flex-col gap-4">
          {navLinks}
        </div>
      )}
    </header>
  )
}
