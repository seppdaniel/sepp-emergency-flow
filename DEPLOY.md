# Emergency Flow — Deploy Guide

## Stack
- Frontend: Vercel (free)
- Backend: Render (free)
- Database: Supabase PostgreSQL (free)
- CI/CD: GitHub Actions (free)

---

## Step 1 — Supabase (PostgreSQL)

1. Create account at supabase.com
2. New project → choose a name and password
3. Wait for provisioning (~2 min)
4. Go to: Settings → Database → Connection string → URI
5. Copy the connection string — looks like:
   `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
6. Save it — you'll need it for Render and local dev

---

## Step 2 — Update local `.env` for Supabase

In `backend/.env`, replace DATABASE_URL:
```
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

Run migration locally to create tables in Supabase:
```bash
cd backend && npx prisma migrate deploy
```

Verify health check:
```bash
npm run dev
curl http://localhost:3001/api/health
# Expected: {"status":"ok","db":"connected",...}
```

---

## Step 3 — Render (backend)

1. Create account at render.com
2. New → Web Service
3. Connect your GitHub repo
4. Configure:
   - Name: emergency-flow-backend
   - Runtime: Docker
   - Dockerfile path: ./backend/Dockerfile
   - Docker context: . (project root)
   - Plan: Free
5. Add environment variables:
```
   DATABASE_URL = <Supabase connection string>
   FRONTEND_URL = https://your-app.vercel.app (update after Vercel deploy)
   NODE_ENV     = production
   PORT         = 3001
```
6. Deploy → wait for build (~5 min first time)
7. Copy your Render URL: `https://emergency-flow-backend.onrender.com`
8. Go to: Dashboard → Settings → Deploy Hook → copy the URL
9. Add to GitHub secrets as `RENDER_DEPLOY_HOOK_URL`

---

## Step 4 — Vercel (frontend)

1. Create account at vercel.com
2. Import GitHub repo
3. Framework: Next.js (auto-detected)
4. Add environment variable:
```
   NEXT_PUBLIC_API_URL = https://emergency-flow-backend.onrender.com
```
5. Deploy
6. Copy your Vercel URL: `https://emergency-flow.vercel.app`
7. Go back to Render → update `FRONTEND_URL` with your Vercel URL
8. Redeploy Render service

---

## Step 5 — GitHub Actions secrets

Go to: GitHub repo → Settings → Secrets and variables → Actions

Add:
```
VERCEL_TOKEN          → vercel.com → Settings → Tokens → Create
VERCEL_ORG_ID         → vercel.com → Settings → General → Your ID
VERCEL_PROJECT_ID     → Vercel project → Settings → General → Project ID
RENDER_DEPLOY_HOOK_URL → Render dashboard → Service → Settings → Deploy Hook
```

---

## Step 6 — Trigger first full deploy
```bash
git add .
git commit -m "feat: switch deploy to Supabase + Render + Vercel"
git push origin main
```

GitHub Actions will:
1. ✅ Run 84 tests
2. ✅ TypeScript check frontend + backend
3. ✅ Deploy frontend to Vercel
4. ✅ Trigger Render backend redeploy

---

## Verify production
```bash
# Health check
curl https://emergency-flow-backend.onrender.com/api/health

# Test decision
curl -X POST https://emergency-flow-backend.onrender.com/api/decision \
  -H "Content-Type: application/json" \
  -d '{"emergencyType":"heart_attack"}'
```

---

## Important notes

- Render free tier has cold start (~30s) after 15min of inactivity
- Supabase free tier: 500MB storage, 2 projects max
- Both are sufficient for a prototype/portfolio project
