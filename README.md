# PupilNetwork 🎓 — Study Smarter, Together

PupilNetwork is a high-performance study collaboration platform designed for students in India. It features live study rooms, Q&A boards, and AI-powered study assistance.

## 🚀 Deployment & Production Setup

To ensure the production environment works correctly (especially Authentication and Redirects), follow these steps:

### 1. Vercel Configuration
Add the following environment variable to your Vercel Project Settings:
- `NEXT_PUBLIC_SITE_URL`: `https://pupilnetwork-seven.vercel.app`

### 2. Supabase Configuration
Authentication will fail or redirect to `localhost:3000` if these are not set:
1. Go to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to `https://pupilnetwork-seven.vercel.app`.
3. Add `https://pupilnetwork-seven.vercel.app/**` to the **Redirect URLs** list.

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest stable version)
- Supabase Account
- Google Gemini API Key (for AI Buddy)

### Installation
1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your keys.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## 🏗️ Tech Stack
- **Framework**: Next.js 16 (Turbopack)
- **Styling**: Tailwind CSS v4
- **Auth/DB**: Supabase
- **AI**: Google Gemini Pro
- **Communications**: Jitsi Meet SDK
