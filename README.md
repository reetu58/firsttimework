# FMG Daily Brief

A beautiful, AI-powered daily learning application for fraud model governance professionals. Generates personalized content covering regulatory compliance, fraud typologies, ML governance, and best practices.

## 🎯 Features

- **AI-Generated Content**: Daily briefs powered by Claude, covering 15 rotating topics
- **Professional Design**: YC-level frontend with dark/light mode
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Shareable**: Deploy once, share with your entire team
- **No API Key Required**: Users don't need their own API keys
- **Rich Content**: Concepts, regulatory guidance, fraud threats, practical tips, quizzes, glossaries, and resources

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- Anthropic API key (get it at https://console.anthropic.com)

### Setup

1. Clone or navigate to the repository:
```bash
cd /home/user/firsttimework
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:3000`

## 📦 Deployment

### Backend: Deploy to Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up for Fly.io** (free tier available):
   ```bash
   flyctl auth signup
   ```

3. **Create and deploy the app**:
   ```bash
   flyctl launch --no-deploy
   ```
   This will create a Fly.io account and generate app configuration.

4. **Set your API key as a secret**:
   ```bash
   flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

5. **Deploy**:
   ```bash
   flyctl deploy
   ```

6. **View your app**:
   ```bash
   flyctl open
   ```

Your backend will be live at: `https://fmg-daily-brief.fly.dev`

### Frontend: Deploy to Vercel

**Option 1: Using Vercel CLI (Recommended)**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy the frontend**:
   ```bash
   cd public
   vercel
   ```

3. **Connect your backend**: During deployment, Vercel will ask for a project name. Create a new project.

4. **Update API calls**: In `public/index.html`, update the API endpoint:
   ```javascript
   const response = await fetch('https://your-fly-app-name.fly.dev/api/generate-brief', {
   ```

**Option 2: Using GitHub (Automatic)**

1. Push your repository to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Select `public` folder as the root directory
5. Add environment variables (if needed)
6. Deploy

### Production Architecture

```
┌─────────────────────────────┐
│   Your Friends / Users      │
└──────────────┬──────────────┘
               │
        ┌──────▼──────┐
        │   Vercel    │ (Frontend)
        │  (public/)  │
        └──────┬──────┘
               │
        ┌──────▼──────────────┐
        │   Fly.io Backend    │
        │  (Node.js/Express)  │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────┐
        │  Anthropic API      │
        │  (Claude)           │
        └─────────────────────┘
```

## 🔒 Security

- **API Keys**: Your Anthropic API key is stored only on the Fly.io backend server
- **Client-Side**: Frontend sends requests to your backend, never directly to Anthropic
- **Environment Variables**: Use Fly.io secrets for sensitive data, never commit to git

## 📊 Topics Covered (Rotating Daily)

1. SR 11-7 / OCC Bulletin 2011-12 model risk management
2. AI/ML model governance in fraud detection
3. Model validation best practices
4. Fraud typologies (ATO, synthetic identity, check fraud, APP scams, etc.)
5. Real-time payment fraud governance
6. BSA/AML and FinCEN intersection
7. Explainability and fairness in fraud ML
8. Model lifecycle management
9. Regulatory updates (Fed, OCC, FDIC, CFPB)
10. Industry frameworks (NIST AI RMF, Basel, FFIEC)
11. GenAI risks and governance
12. Model performance monitoring (PSI, CSI, KS, Gini)
13. Three lines of defense
14. Vendor/third-party governance
15. Data quality and lineage

## 🎨 Customization

### Change Branding
Edit `public/index.html`:
- Line 9: Change the title
- Line 16-24: Modify CSS variables (colors, fonts)
- Line 263: Update the header text

### Add More Topics
Edit `server.js` line 48-62 to add topics to the TOPICS array.

### Modify Content Structure
Update the Claude prompt in `server.js` (lines 96-150) to change what gets generated.

## 🐛 Troubleshooting

### "API key not configured"
Make sure you've set the `ANTHROPIC_API_KEY` secret on Fly.io:
```bash
flyctl secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend not connecting to backend
1. Verify the backend URL in `public/index.html` matches your Fly.io app
2. Check that Fly.io deployment succeeded: `flyctl status`
3. Check backend logs: `flyctl logs`

### Deployment fails
1. Make sure Node.js version is 18+
2. Check that `package.json` and `server.js` are in the root directory
3. View deployment logs: `flyctl logs -n 100`

## 📞 Support

- **Anthropic API Issues**: https://support.anthropic.com
- **Fly.io Issues**: https://fly.io/docs/
- **Vercel Issues**: https://vercel.com/support

## 📄 License

MIT

---

**Built with ❤️ for fraud model governance professionals**
