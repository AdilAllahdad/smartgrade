# Vercel Deployment Guide for Exam Evaluation System (Frontend)

This guide will walk you through deploying the frontend of your Exam Evaluation System to Vercel.

## Prerequisites

1. **Backend Deployed**: Your backend should already be deployed (e.g., on Render, Railway, or another service)
2. **Backend URL**: Have your deployed backend URL ready (e.g., `https://your-backend.onrender.com`)
3. **GitHub Account**: Your project should be pushed to a GitHub repository
4. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you haven't already

## Step 1: Prepare Your Project

### 1.1 Update Environment Variables

Before deploying, update your `.env.production` file with your actual backend URL:

```bash
# .env.production
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_ENV=production
```

**Important**: Do NOT commit `.env.production` with real credentials to GitHub. This file is for local testing only.

### 1.2 Verify .gitignore

Make sure your `.gitignore` includes:

```
# Environment files
.env
.env.local
.env.production
.env.*.local

# Build output
dist
dist-ssr
*.local

# Dependencies
node_modules
```

### 1.3 Test Local Build

Test your production build locally:

```powershell
# Build the project
npm run build

# Preview the production build
npm run preview
```

Visit `http://localhost:4173` and verify everything works correctly.

## Step 2: Push to GitHub

If you haven't already, push your code to GitHub:

```powershell
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select your exam-system repository

### 3.2 Configure Project Settings

Vercel should auto-detect your Vite configuration. Verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables

In the Vercel project settings, add your environment variables:

1. Click on **"Environment Variables"** section
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend-url.onrender.com` | Production |
| `VITE_ENV` | `production` | Production |

**Important Notes:**
- Replace `https://your-backend-url.onrender.com` with your actual backend URL
- Do NOT include `/api` at the end of the backend URL
- Make sure there's no trailing slash

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for the deployment to complete (usually 1-3 minutes)
3. Vercel will provide you with a deployment URL (e.g., `https://your-app.vercel.app`)

## Step 4: Configure Backend CORS

Your backend needs to allow requests from your Vercel domain. Update your backend CORS configuration:

```javascript
// server/server.js or similar
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-app.vercel.app',  // Add your Vercel URL
  'https://your-custom-domain.com' // If you have a custom domain
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

Redeploy your backend after making this change.

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Test the following functionality:
   - **Login**: Try logging in as different user types
   - **File Upload**: Upload exam papers and answer sheets
   - **Student Submission**: Submit completed exams
   - **Evaluation**: Evaluate student submissions
   - **Results**: Check if results are displayed correctly

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to your project settings in Vercel
2. Navigate to **"Domains"**
3. Click **"Add"**
4. Enter your custom domain (e.g., `examportal.yourdomain.com`)

### 6.2 Configure DNS

Add these DNS records to your domain provider:

**For subdomain (e.g., examportal.yourdomain.com):**
```
Type: CNAME
Name: examportal
Value: cname.vercel-dns.com
```

**For root domain (e.g., yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 6.3 Update Backend CORS

Add your custom domain to the backend's allowed origins list.

## Continuous Deployment

Vercel automatically redeploys your app when you push changes to GitHub:

```powershell
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your project
3. Deploy the new version
4. Provide a unique URL for each deployment

## Environment Variables Management

### Development
```bash
# .env (local development)
VITE_API_BASE_URL=http://localhost:5000
VITE_ENV=development
```

### Production (Vercel)
Set via Vercel Dashboard:
- `VITE_API_BASE_URL`: Your production backend URL
- `VITE_ENV`: `production`

### Testing Production Locally
```bash
# .env.production (local testing only)
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_ENV=production
```

Then run:
```powershell
npm run build
npm run preview
```

## Troubleshooting

### Issue: White screen or blank page

**Solution:**
1. Check browser console for errors
2. Verify `VITE_API_BASE_URL` is set correctly in Vercel
3. Check that backend is running and accessible
4. Verify CORS is configured correctly on backend

### Issue: API calls failing

**Solution:**
1. Open browser DevTools → Network tab
2. Check if API calls are going to the correct URL
3. Verify environment variable: `console.log(import.meta.env.VITE_API_BASE_URL)`
4. Check backend logs for CORS errors
5. Ensure backend URL doesn't have trailing slash

### Issue: 404 on page refresh

**Solution:**
Add a `vercel.json` file to your project root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes are handled by your React app.

### Issue: Environment variables not updating

**Solution:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Update the variable
4. Go to Deployments
5. Click "..." on the latest deployment → "Redeploy"

### Issue: Build fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing dependencies: Run `npm install` locally
   - Build warnings treated as errors: Check for unused imports
   - Environment variable errors: Verify all required env vars are set

## Performance Optimization

### 1. Enable Compression
Vercel automatically enables Brotli compression for your assets.

### 2. Image Optimization
For images, use Vercel's Image Optimization:

```jsx
import Image from 'next/image' // If using Next.js
// For Vite, optimize images before upload
```

### 3. Code Splitting
Vite automatically handles code splitting. To improve:

```jsx
// Use lazy loading for routes
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
```

### 4. Caching Headers
Vercel automatically sets optimal caching headers for static assets.

## Monitoring and Analytics

### Vercel Analytics

1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. Enable Vercel Analytics to track:
   - Page views
   - Performance metrics
   - Core Web Vitals

### Error Tracking

Consider integrating error tracking:

```bash
npm install @sentry/react
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.VITE_ENV
});
```

## Security Best Practices

1. **Never commit `.env` files** with real credentials
2. **Use HTTPS only** for production backend
3. **Implement rate limiting** on your backend
4. **Validate all inputs** on both frontend and backend
5. **Keep dependencies updated**: Run `npm audit` regularly
6. **Use environment-specific configs**: Different settings for dev/prod

## Backup and Rollback

### Rollback to Previous Deployment

1. Go to **Deployments** in Vercel Dashboard
2. Find a previous successful deployment
3. Click **"..."** → **"Promote to Production"**

### Backup Considerations

- **Code**: Backed up in GitHub
- **Environment Variables**: Document separately (use password manager)
- **Build Configuration**: Stored in `vercel.json` and committed to Git

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Router on Vercel](https://vercel.com/guides/deploying-react-with-vercel)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review browser console errors
3. Verify backend is running and accessible
4. Check CORS configuration
5. Verify environment variables are set correctly

## Architecture Overview

```
Frontend (Vercel)                Backend (Render/Railway)
├── React App                    ├── Express Server
├── Vite Build                   ├── MongoDB Database
├── Environment Variables        ├── API Routes
└── Static Assets                └── File Storage

     ↓ API Calls via ↓
   VITE_API_BASE_URL
```

## Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Backend CORS updated with Vercel URL
- [ ] All features tested (login, upload, submission, evaluation)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Error tracking setup
- [ ] Analytics enabled
- [ ] Team members have access
- [ ] Documentation updated

---

**Congratulations!** Your Exam Evaluation System frontend is now deployed on Vercel. 🎉

For questions or issues, refer to the troubleshooting section above or check the Vercel documentation.