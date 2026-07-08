# Umoja Skills - Account Migration Checklist

**Goal:** Move the project from your friend's account to your own account across all platforms.

---

## 📋 Accounts You Need to Create

### 1. **GitHub** (Code Repository)
- ✅ Create account: https://github.com/signup
- ✅ Your username: `[YOUR_GITHUB_USERNAME]`
- ✅ Your email: `[YOUR_EMAIL]`

### 2. **Render** (Backend API Server)
- ✅ Create account: https://render.com
- ✅ Sign up with GitHub for easier integration
- ✅ Account email: `[YOUR_EMAIL]`

### 3. **Supabase** (Database - PostgreSQL)
- ✅ Create account: https://supabase.com
- ✅ Sign up with GitHub
- ✅ Account email: `[YOUR_EMAIL]`

### 4. **Vercel** (Frontend Hosting)
- ✅ Create account: https://vercel.com
- ✅ Sign up with GitHub
- ✅ Account email: `[YOUR_EMAIL]`

---

## 🔄 Migration Steps

### **STEP 1: GitHub - Create Your Repository**

```bash
# Option A: Fork the existing repo
# Go to: https://github.com/Kimani145/umoja-skills
# Click "Fork" button (top right)
# This creates a copy under your account

# Option B: Create a new repo
# 1. Go to https://github.com/new
# 2. Name it: "umoja-skills"
# 3. Choose "Private" (keep code private)
# 4. Click "Create repository"

# Then push the code:
cd umoja-skills
git remote set-url origin https://github.com/[YOUR_GITHUB_USERNAME]/umoja-skills.git
git push -u origin master
```

**What you need:**
- GitHub username: `[YOUR_GITHUB_USERNAME]`
- GitHub email: `[YOUR_EMAIL]`

---

### **STEP 2: Supabase - Create Database**

#### 2a. Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Fill in:
   - **Name:** `umoja-skills`
   - **Database Password:** Generate strong password (save it!) → `[DB_PASSWORD]`
   - **Region:** Choose closest to Kenya (e.g., `eu-west-1`)
4. Click "Create new project"
5. Wait ~2 minutes for database to be ready

#### 2b. Get Connection Details
Once database is ready:
1. Go to **Settings** → **Database** (left sidebar)
2. Copy the connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
   ```
3. Save as: `[DATABASE_URL]`

**What you'll get:**
- `DATABASE_URL` = `postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres`
- `PROJECT_ID` = from the URL above
- `DB_PASSWORD` = your chosen password

---

### **STEP 3: Render - Deploy Backend**

#### 3a. Create Render Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub:
   - Click "Connect account" and authorize GitHub
   - Select your `umoja-skills` repo
4. Configure service:
   - **Name:** `umoja-skills` (or `umoja-backend`)
   - **Environment:** `Python 3.11`
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput`
   - **Start Command:** `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Instance Type:** Free (or paid if needed)
5. Click **"Create Web Service"**

#### 3b: Create Render Database
1. Go back to Render Dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `umoja-db`
   - **Database:** `umoja`
   - **User:** `umoja_user`
   - **Region:** Same as Supabase (or closest to Kenya)
4. Click **"Create Database"**
5. Once created, copy the **"Internal Database URL"** (not external)

**Note:** You can use Supabase database instead (recommended). Skip this if using Supabase.

#### 3c: Set Environment Variables on Render
In Render Dashboard → Service → **Environment**:

```
SECRET_KEY=generate-a-random-string-here
DEBUG=False
DATABASE_URL=[YOUR_SUPABASE_DATABASE_URL]
ALLOWED_HOSTS=*
VERCEL_FRONTEND_URL=https://umoja-skills-[YOUR_USERNAME].vercel.app
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**What you need to generate/provide:**
- `SECRET_KEY` = Generate random string (use: https://djecrety.ir/)
- `DATABASE_URL` = From Supabase step above
- `VERCEL_FRONTEND_URL` = Your Vercel frontend URL (see step 4)

---

### **STEP 4: Vercel - Deploy Frontend**

#### 4a: Import Project
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Select your GitHub `umoja-skills` repo
4. Click **"Import"**

#### 4b: Configure
1. **Root Directory:** `frontend`
2. **Framework:** React
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`

#### 4c: Set Environment Variables
In Vercel Project Settings → **Environment Variables**:

```
VITE_API_URL=https://umoja-skills-[YOUR_USERNAME].onrender.com/api
```

(Use the URL from Render deployment in Step 3)

#### 4d: Deploy
Click **"Deploy"**

Your frontend URL will be: `https://umoja-skills-[YOUR_USERNAME].vercel.app`

---

### **STEP 5: Connect Everything**

#### 5a: Update Render with Vercel URL
Go back to **Render Dashboard** → Your service → **Environment**:
Update `VERCEL_FRONTEND_URL` to your actual Vercel URL (from Step 4)

#### 5b: Update GitHub with All URLs
Update in `render.yaml` and commit to GitHub:
```yaml
VERCEL_FRONTEND_URL: "https://umoja-skills-[YOUR_USERNAME].vercel.app"
```

---

## 🔐 Credentials Checklist

Fill in your details:

```
GITHUB ACCOUNT
- Username: ________________________
- Email: ________________________
- Repo URL: https://github.com/[USERNAME]/umoja-skills

SUPABASE DATABASE
- Project ID: ________________________
- Database Password: ________________________ (SAVE THIS!)
- DATABASE_URL: postgresql://postgres:_______@db.________.supabase.co:5432/postgres

RENDER BACKEND
- Service Name: ________________________
- Service URL: https://umoja-skills-[USERNAME].onrender.com
- SECRET_KEY: ________________________ (from https://djecrety.ir/)

VERCEL FRONTEND
- Project Name: ________________________
- Project URL: https://umoja-skills-[USERNAME].vercel.app
```

---

## 📋 Quick Checklist

- [ ] Created GitHub account & forked/created repo
- [ ] Created Supabase account & database
- [ ] Created Render account & web service
- [ ] Created Vercel account & imported project
- [ ] Set all environment variables on Render
- [ ] Set all environment variables on Vercel
- [ ] Both Render and Vercel show "Deployed ✓"
- [ ] Frontend loads at https://umoja-skills-[YOUR_USERNAME].vercel.app
- [ ] Backend health check passes: https://umoja-skills-[YOUR_USERNAME].onrender.com/api/health/
- [ ] Can register new account at frontend

---

## 🚨 Important Notes

1. **Keep credentials safe:**
   - Never share `DATABASE_PASSWORD` or `SECRET_KEY`
   - Use environment variables, never hardcode

2. **Cold starts on free tier:**
   - Render free tier sleeps after 15 min of inactivity
   - First request may take 30 seconds
   - Upgrade to paid for always-on

3. **Email sending:**
   - Currently set to `console.EmailBackend` (prints to logs)
   - To enable real emails, add Gmail credentials:
     ```
     EMAIL_HOST_USER=your-email@gmail.com
     EMAIL_HOST_PASSWORD=your-app-password
     ```

4. **Database backups:**
   - Supabase auto-backups (free tier: 7 days)
   - Enable in Supabase Dashboard → Settings → Backups

---

## 🆘 Troubleshooting

### Render deployment failed
- Check Render logs: Dashboard → Service → Logs
- Common issues:
  - `psycopg2` error → Database URL wrong
  - `ModuleNotFoundError` → requirements.txt missing dependency
  - `SECRET_KEY not set` → Missing environment variable

### Vercel build failed
- Check Vercel logs: Dashboard → Project → Deployments
- Common issues:
  - `VITE_API_URL` not set
  - Node version mismatch
  - Missing `npm install`

### Database connection error
- Verify `DATABASE_URL` in both Render and local `.env`
- Check Supabase is running: Go to https://supabase.com/dashboard
- Try reset: `python manage.py migrate` from local

### Frontend can't reach backend
- Check CORS in backend settings
- Verify `VERCEL_FRONTEND_URL` matches actual frontend URL
- Check browser console for exact error

---

## 📞 Next Steps

1. **Create all 4 accounts** (GitHub, Render, Supabase, Vercel)
2. **Follow Steps 1-5** above
3. **Fill in the credentials checklist**
4. **Test:** Go to your Vercel URL and try registering
5. **If issues:** Check troubleshooting section

You now own the entire project! 🎉
