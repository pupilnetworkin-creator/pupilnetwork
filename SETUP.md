# PupilNetwork — Deployment & Setup Guide

Since you requested a full free-tier setup, follow these steps exactly to deploy your app at absolutely zero cost.

## 1. Database & Auth (Supabase - Free Tier)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the **SQL Editor** on the left menu, paste the complete SQL schema from your original prompt and click "Run".
3. Add the API keys to your `.env.local` file:
   - Go to Project Settings -> API.
   - Copy `Project URL` to `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy `anon` `public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy `service_role` `secret` key to `SUPABASE_SERVICE_ROLE_KEY`.
4. Enable Google Auth:
   - Go to Authentication -> Providers -> Google.
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/).
   - Add the Client ID and Secret to Supabase.
5. **CRITICAL:** Realtime Chat
   - Go to Database -> Replication.
   - Enable replication for the `messages` table so the websockets work!

## 2. AI Study Buddy (Google Gemini - Free Tier)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create an API key.
3. Paste it into `.env.local` as `GEMINI_API_KEY`.
   *(15 requests per minute free tier is enough for the prototype).*

## 3. Email (Resend - Free Tier)
1. Go to [resend.com](https://resend.com) and create an account.
2. Go to API Keys and create one. Paste it as `RESEND_API_KEY`.
3. Before your custom domain is verified, you can only send emails to yourself. Once you get `pupilnetwork.is-a.dev`, add the domain in Resend and verify the DNS records.
4. Set `RESEND_FROM_EMAIL=noreply@pupilnetwork.is-a.dev`.

## 4. Conversation Storage (MongoDB Atlas - Free Tier)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas).
2. Create an M0 Free Cluster.
3. Create a Database User and save the password.
4. Add `0.0.0.0/0` to Network Access (allow anywhere since Vercel IPs change).
5. Click Connect -> Choose Node.js -> Copy the connection string.
6. Paste it into `MONGODB_URI`, replacing `<password>` with your DB user's password.

## 5. Deployment (Vercel - Free Tier)
1. Push this entire codebase to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of PupilNetwork"
   git remote add origin https://github.com/[your-username]/pupilnetwork.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. **CRITICAL:** In the Environment Variables section of the Vercel deploy screen, add EVERY variable from your `.env.local` file.
4. Set an `ADMIN_SECRET` (just a strong password you make up, like "MySuperSecretAdmin2026").
5. Click Deploy.

## 6. Custom Domain (.is-a.dev - Free)
1. Go to [register.is-a.dev](https://register.is-a.dev).
2. Follow their instructions to submit a Pull Request to their GitHub repo registering `pupilnetwork.is-a.dev` as a CNAME pointing to `cname.vercel-dns.com`.
3. Once approved, go back to Vercel -> Project Settings -> Domains, and add `pupilnetwork.is-a.dev`.

---

### Accessing your Admin Panel
To use the admin panel to view users, revenue, and revoke premium codes, go to:
`https://pupilnetwork.is-a.dev/admin?secret=YOUR_ADMIN_SECRET`
