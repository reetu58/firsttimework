# 🚀 FMG Daily Brief - Deployment Guide

Deploy your app in **15 minutes** using free tier services. Choose one of the deployment options below.

---

## ⚡ Quickest: Deploy Everything to Fly.io (Recommended)

This is the easiest and fastest way to deploy. Everything runs on Fly.io's free tier.

### Step 1: Get Your API Key
1. Go to https://console.anthropic.com
2. Create an account (if needed)
3. Copy your API key (starts with `sk-ant-`)

### Step 2: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

On Windows, download from: https://fly.io/docs/hands-on/install/

### Step 3: Sign Up for Fly.io
```bash
flyctl auth signup
```

This will open a browser. Create a free account (no credit card for free tier).

### Step 4: Deploy the App
```bash
cd /home/user/firsttimework

# Launch the app (creates fly.toml)
flyctl launch

# When asked:
# - App name: press Enter (or type a custom name)
# - Region: choose a region near you
# - Postgres database: say no
```

### Step 5: Set Your API Key
```bash
flyctl secrets set ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE
```

### Step 6: Deploy
```bash
flyctl deploy
```

### Step 7: Open Your App
```bash
flyctl open
```

**Your app is now live and shareable!** 🎉

Get the URL with:
```bash
flyctl info
```

---

## 🔀 Alternative: Frontend on Vercel + Backend on Fly.io

Use this if you prefer separate hosting for frontend and backend.

### Backend on Fly.io

Follow Steps 1-6 above from the Fly.io guide.

### Frontend on Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy the public folder
cd /home/user/firsttimework
vercel --cwd public

# When asked for project name, create a new one
```

**Option B: Using GitHub (Automatic)**

1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/fmg-daily-brief.git
   git branch -M main
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure:
   - Root Directory: `public`
   - No environment variables needed
5. Click "Deploy"

**Option C: Using Vercel Dashboard**

1. Go to https://vercel.com
2. Click "New Project"
3. Select "Create Git Repository" (if not connected)
4. Name it `fmg-daily-brief`
5. Select a Git provider and authorize
6. Deploy

### Connect Frontend to Backend

After both are deployed, update the API endpoint in `public/index.html`:

**Line 378**, change:
```javascript
const response = await fetch('/api/generate-brief', {
```

To:
```javascript
const response = await fetch('https://YOUR-FLY-APP-NAME.fly.dev/api/generate-brief', {
```

(Replace `YOUR-FLY-APP-NAME` with your actual Fly.io app name)

Then redeploy Vercel:
```bash
vercel --prod
```

---

## 🔒 Environment Variables

### For Fly.io
```bash
flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-key
```

### For Vercel (if using separate backend)
Create a `.env.production` file in the root:
```
REACT_APP_API_URL=https://your-fly-app-name.fly.dev
```

---

## ✅ Testing After Deployment

### Test with Fly.io URL
1. Open: `https://your-app-name.fly.dev`
2. Click "✨ Generate Brief"
3. You should see the brief generate in 5-10 seconds

### Troubleshooting Errors

**"API key not configured"**
```bash
flyctl secrets list
flyctl logs -n 50
```

**"Failed to generate brief"**
- Check API key is correct: `flyctl secrets list`
- Check backend is running: `flyctl status`
- View logs: `flyctl logs -n 100`

**CORS errors**
- Make sure frontend URL matches backend configuration
- Check both are using HTTPS

---

## 📊 Free Tier Limits

**Fly.io:**
- 3 shared-cpu-1x 256MB VMs
- Unlimited requests
- Perfect for this app! ✅

**Vercel:**
- 100 GB bandwidth/month
- Unlimited serverless functions
- Perfect for frontend! ✅

---

## 🎯 Next Steps

Once deployed:

1. **Share the link** with your friends
2. **Set as homepage** - Right-click the bookmark → Edit → Set as home page
3. **Create bookmarklet** - Ctrl+D to bookmark
4. **Customize** - Edit topics or CSS in `public/index.html`

---

## 📞 Need Help?

**Fly.io Support:** https://fly.io/docs/
**Vercel Support:** https://vercel.com/support
**Anthropic API:** https://support.anthropic.com

---

**Done!** Your FMG Daily Brief is now live and shareable. 🎉
