import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RadarJobs — Your CV on radar. The right job locked on.',
  description: 'AI-powered job matching. Upload your CV, we scan every job board and score each role against your skills. Free forever.',
  keywords: ['job matching', 'AI', 'CV scanner', 'job search', 'career'],
  openGraph: {
    title: 'RadarJobs',
    description: 'AI scans every job board and scores each role against your CV.',
    url: 'https://radarjobs.co',
    siteName: 'RadarJobs',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
