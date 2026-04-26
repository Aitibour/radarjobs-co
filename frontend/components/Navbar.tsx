'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

type DropItem = { label: string; desc: string; href: string }
type NavItem =
  | { label: string; href: string; items?: never }
  | { label: string; href?: string; items: DropItem[] }

const NAV: NavItem[] = [
  {
    label: 'Job Match',
    items: [
      { label: 'AI Job Finder',    desc: 'Search 50+ job boards by title + filters', href: '/scan' },
      { label: 'Keyword Analyzer', desc: 'Score your CV against any job posting',    href: '/keywords' },
    ],
  },
  {
    label: 'ATS Resume',
    items: [
      { label: 'ATS Optimizer', desc: 'Beat applicant tracking systems',    href: '/ats-resume' },
      { label: 'CV Templates',  desc: 'ATS-friendly templates to download', href: '/cv-templates' },
    ],
  },
  {
    label: 'Cover Letter',
    items: [
      { label: 'AI Cover Letter',    desc: 'Tailored cover letters in seconds', href: '/cover-letter' },
      { label: 'Cover Letter Guide', desc: 'Templates & best practices',        href: '/resources/how-to-write-cover-letter' },
    ],
  },
  {
    label: 'LinkedIn',
    items: [
      { label: 'Headline Generator',   desc: 'AI headline from your CV upload',      href: '/linkedin' },
      { label: 'Profile Gap Analysis', desc: 'HR-specialist review of your profile', href: '/profile-gap' },
    ],
  },
  {
    label: 'Interview Prep',
    items: [
      { label: 'Interview Q&A',  desc: 'Top 10 questions tailored to your role', href: '/interview-prep' },
      { label: 'Opening Pitch',  desc: 'Generate your perfect opening pitch',    href: '/interview-prep' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources',
    items: [
      { label: 'ATS Guide',    desc: 'How applicant tracking systems work', href: '/resources/what-is-ats' },
      { label: 'Resume Tips',  desc: 'Land more interviews faster',         href: '/resources/how-to-write-resume' },
      { label: 'CV Templates', desc: 'ATS-friendly designs, free download', href: '/cv-templates' },
    ],
  },
  { label: 'Organizations', href: '/organizations' },
]

export default function Navbar() {
  const path = usePathname()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(label)
  }

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 250)
  }

  return (
    <nav className="bg-gradient-to-r from-teal-dark to-teal-mid sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-0.5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <path d="M4 14a10 10 0 0 1 10-10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 14a10 10 0 0 1-10 10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M8 14a6 6 0 0 1 6-6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 14a6 6 0 0 1-6 6" stroke="#E1F5EE" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="white"/>
          </svg>
          <span className="text-lg font-black tracking-tight">
            <span className="text-white">Radar</span><span className="text-teal-accent">Jobs</span>
          </span>
        </Link>

        {/* Nav items */}
        <div className="hidden lg:flex items-center flex-1 gap-0">
          {NAV.map(item => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.items ? handleMouseEnter(item.label) : undefined}
              onMouseLeave={item.items ? handleMouseLeave : undefined}
            >
              {item.href && !item.items ? (
                <Link
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    path === item.href ? 'text-white' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <>
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      openMenu === item.label ? 'text-white bg-white/10' : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${openMenu === item.label ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {openMenu === item.label && item.items && (
                    <div
                      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                      onMouseEnter={() => handleMouseEnter(item.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {item.items.map(sub => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className="flex flex-col px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-teal-dark">{sub.label}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{sub.desc}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link href="/login" className="text-sm font-medium text-white/75 hover:text-white transition-colors px-2 hidden sm:block">
            Sign in
          </Link>
          <Link href="/scan"
            className="text-sm font-bold bg-white text-teal-dark px-4 py-1.5 rounded-full hover:bg-teal-light hover:scale-105 transition-all duration-200 shadow-sm whitespace-nowrap">
            Try free →
          </Link>
        </div>
      </div>
    </nav>
  )
}
