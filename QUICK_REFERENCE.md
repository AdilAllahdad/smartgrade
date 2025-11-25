# Quick Reference - Environment Variables & Deployment

## 🚀 Quick Deploy Commands

```powershell
# 1. Build production version
npm run build

# 2. Test production locally
npm run preview

# 3. Commit and push to GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## 🔑 Environment Variables

### Development (.env)
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_ENV=development
```

### Production (Set in Vercel Dashboard)
```bash
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ENV=production
```

## 📦 Import Patterns

### Option 1: Axios Instance (Recommended)
```javascript
import api from '../services/api';

// GET request
const response = await api.get('/exam-papers');

// POST request  
const response = await api.post('/auth/login', { email, password });
```

### Option 2: Environment Variable
```javascript
const url = `${import.meta.env.VITE_API_BASE_URL}/api/exam-papers`;
const response = await fetch(url);
```

### Option 3: Config Helpers
```javascript
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';

const url = getApiUrl(API_ENDPOINTS.EXAM_PAPERS.BASE);
```

## ⚡ Common Operations

### Check Environment
```javascript
console.log('Backend:', import.meta.env.VITE_API_BASE_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('Is Dev:', import.meta.env.DEV);
```

### Construct File URLs
```javascript
// For downloads
const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/api/files/${fileId}`;

// For preview
const previewUrl = `${import.meta.env.VITE_API_BASE_URL}${file.downloadUrl}`;
```

## 🔧 Troubleshooting Commands

```powershell
# Restart dev server (after .env changes)
# Press Ctrl+C, then:
npm run dev

# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build

# Check for errors
npm run build

# Test API connection
curl http://localhost:5000/api/health
```

## ✅ Pre-Deployment Checklist

- [ ] `.env` has localhost URL
- [ ] `.env.production` NOT committed to Git
- [ ] Backend is deployed and accessible
- [ ] `npm run build` succeeds without errors
- [ ] `npm run preview` works correctly
- [ ] All features tested locally

## 🌐 Vercel Setup

1. **Import from GitHub**
2. **Framework**: Vite
3. **Build**: `npm run build`
4. **Output**: `dist`
5. **Add Environment Variables**:
   - `VITE_API_BASE_URL` → Backend URL
   - `VITE_ENV` → `production`

## 🛡️ Backend CORS Setup

```javascript
// server/server.js
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-app.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

## 📚 Documentation Files

- `VERCEL_DEPLOYMENT.md` - Full deployment guide
- `API_CONFIGURATION.md` - API setup documentation
- `DEPLOYMENT_SUMMARY.md` - Changes summary
- `.env.example` - Environment template

## ⚠️ Important Rules

1. ✅ Always prefix with `VITE_`
2. ❌ Never include `/api` in `VITE_API_BASE_URL`
3. ❌ No trailing slashes in URLs
4. ❌ Never commit `.env` or `.env.production`
5. ✅ Restart dev server after .env changes

## 🎯 Key Files Modified

- ✅ `src/config/api.config.js` - Created
- ✅ `src/services/api.js` - Updated
- ✅ All components - URLs replaced
- ✅ `vite.config.js` - Updated
- ✅ `vercel.json` - Created

---

**Need Help?** Check the full guides:
- Deployment: `VERCEL_DEPLOYMENT.md`
- API Config: `API_CONFIGURATION.md`
