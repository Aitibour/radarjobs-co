# RadarJobs.co

> "Your CV on radar. The right job locked on."

AI-powered job matching — upload your CV, we scan LinkedIn/Indeed/Glassdoor, score every job 0–100, and send daily email alerts. Free forever.

## Features

- CV parsing (PDF + text) in browser
- Scrapes LinkedIn, Indeed, Glassdoor, Google Jobs via JobSpy
- AI scoring using vector similarity + LLM (Gemini Flash → Groq Llama → OpenRouter fallback)
- Match scores 0–100 with matched/missing keywords
- Daily email alerts via Resend
- Supabase auth (Google OAuth + magic link)

## Tech Stack

- **Frontend**: Next.js 14 App Router, Tailwind CSS, Supabase JS
- **Backend**: FastAPI (Python), JobSpy, Cohere Embed 4, httpx
- **AI**: Gemini 2.0 Flash → Groq Llama 3.3 70B → OpenRouter DeepSeek R1 (free fallback chain)
- **DB**: Supabase (PostgreSQL + RLS + Auth)
- **Email**: Resend
- **Cron**: GitHub Actions daily at 07:00 UTC
- **Deploy**: Vercel (frontend) + Render (backend)

## Project Structure

```
radarjobs-co/
├── .github/
│   └── workflows/
│       └── daily-radar.yml          # GitHub Actions daily cron job
├── backend/
│   ├── .env.example                 # Example environment variables
│   ├── Dockerfile                   # Docker container configuration
│   ├── main.py                      # FastAPI entry point
│   ├── requirements.txt             # Python dependencies
│   ├── db/
│   │   ├── schema.sql               # Database schema
│   │   └── supabase.py              # Supabase client
│   ├── jobs/
│   │   ├── __init__.py
│   │   └── radar_scan.py            # Daily cron job script
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── alerts.py                # Alert preferences endpoints
│   │   ├── auth.py                  # Authentication endpoints
│   │   └── scan.py                  # Job scanning endpoints
│   └── services/
│       ├── __init__.py
│       ├── ai_router.py             # LLM fallback chain
│       ├── cv_parser.py             # CV text extraction
│       ├── emailer.py               # Email notifications
│       ├── embedder.py              # Cohere embeddings
│       ├── matcher.py               # Job matching logic
│       └── scraper.py               # JobSpy integration
├── frontend/
│   ├── .env.example                 # Example environment variables
│   ├── package.json                 # Node dependencies
│   ├── next.config.js               # Next.js configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS configuration
│   ├── app/
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── page.tsx                 # Home page
│   │   ├── login/
│   │   │   └── page.tsx             # Login page
│   │   ├── scan/
│   │   │   └── page.tsx             # Job scan page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Dashboard layout
│   │   │   └── page.tsx             # Dashboard (protected)
│   │   └── api/
│   │       └── webhook/
│   │           └── route.ts         # Webhook endpoints
│   ├── components/
│   │   ├── Navbar.tsx               # Navigation bar
│   │   ├── CVUpload.tsx             # CV upload component
│   │   ├── JobCard.tsx              # Job result card
│   │   ├── ScoreRing.tsx            # Match score visualization
│   │   └── AlertForm.tsx            # Alert preferences form
│   └── lib/
│       ├── api.ts                   # Backend API client
│       └── supabase.ts              # Supabase client setup
└── README.md                        # This file
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (free)
- API keys (all free, no card):
  - Gemini: https://ai.google.dev
  - Groq: https://console.groq.com
  - OpenRouter: https://openrouter.ai
  - Cohere: https://dashboard.cohere.com
  - Resend: https://resend.com

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/radarjobs-co.git
cd radarjobs-co
```

### 2. Supabase Setup

1. Create project at https://supabase.com
2. Run `backend/db/schema.sql` in the Supabase SQL editor
3. Enable Google OAuth in Authentication → Providers
4. Copy your project URL, anon key, and service role key

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm install
npm run dev
```

Open http://localhost:3000

### 5. GitHub Actions Setup (Daily Cron)

Add these secrets to your GitHub repo (Settings → Secrets → Actions):
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- GEMINI_API_KEY
- GROQ_API_KEY
- OPENROUTER_API_KEY
- COHERE_API_KEY
- RESEND_API_KEY

## Deployment (Zero Config, $0/month)

### Frontend → Vercel

1. Import repo at https://vercel.com/new
2. Set root directory: `frontend`
3. Add environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL)
4. Deploy

### Backend → Render

1. New Web Service at https://render.com
2. Connect GitHub repo
3. Root directory: `backend`
4. Runtime: Docker
5. Add all backend env vars
6. Deploy (free tier auto-sleeps after inactivity)

### DNS → Cloudflare

1. Add radarjobs.co to Cloudflare
2. A record → Vercel IP (76.76.21.21)
3. CNAME api.radarjobs.co → your Render service URL
4. Update NEXT_PUBLIC_API_URL to https://api.radarjobs.co

## API Reference

### `POST /scan` — Scan jobs and score against CV

```json
{
  "cv_text": "string",
  "job_title": "Senior React Developer",
  "location": "London, UK"
}
```

### `POST /alerts/preferences` — Save alert settings (requires auth)

### `GET /alerts/preferences` — Get current settings (requires auth)

### `GET /` — Health check

## Contributing

PRs welcome. See issues for planned features.

## License

MIT
