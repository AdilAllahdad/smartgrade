# API Configuration Guide

This document explains the API configuration system for the Exam Evaluation System frontend.

## Overview

The application uses a centralized API configuration system that supports different environments (development, staging, production) through environment variables.

## Files Structure

```
exam-system/
├── .env                          # Local development (gitignored)
├── .env.example                  # Template for environment variables
├── .env.production               # Production settings (gitignored)
├── src/
│   ├── config/
│   │   └── api.config.js        # Centralized API configuration
│   └── services/
│       └── api.js               # Axios instance with interceptors
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend server URL (without /api) | `http://localhost:5000` |
| `VITE_ENV` | Environment name | `development` or `production` |

### Important Notes

1. **All environment variables must be prefixed with `VITE_`** - This is a Vite requirement for client-side access
2. **Do not include `/api` in `VITE_API_BASE_URL`** - It's automatically appended by the configuration
3. **No trailing slashes** - URLs should not end with `/`

## Configuration Files

### .env (Development)

```bash
# Local development
VITE_API_BASE_URL=http://localhost:5000
VITE_ENV=development
```

### .env.production (Production)

```bash
# Production deployment
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_ENV=production
```

### .env.example (Template)

This file serves as documentation and a template for other developers. It should be committed to Git.

## API Configuration (api.config.js)

The `src/config/api.config.js` file provides:

### 1. Base URLs

```javascript
import { API_BASE_URL, API_URL } from '../config/api.config';

// API_BASE_URL: http://localhost:5000
// API_URL: http://localhost:5000/api
```

### 2. Endpoint Constants

Predefined endpoint paths for consistency:

```javascript
import { API_ENDPOINTS } from '../config/api.config';

// Example usage:
const loginUrl = API_ENDPOINTS.AUTH.LOGIN;  // '/auth/login'
const examUrl = API_ENDPOINTS.EXAM_PAPERS.BY_ID('123');  // '/exam-papers/123'
```

### 3. Helper Functions

```javascript
import { getFullUrl, getApiUrl } from '../config/api.config';

// Get full URL for a path
const url1 = getFullUrl('/api/auth/login');
// Result: 'http://localhost:5000/api/auth/login'

// Get API URL (automatically adds /api)
const url2 = getApiUrl('/auth/login');
// Result: 'http://localhost:5000/api/auth/login'
```

## Usage Examples

### 1. Using Axios Instance (Recommended)

The `api.js` service automatically handles authentication and base URL:

```javascript
import api from '../services/api';

// Simple GET request
const response = await api.get('/exam-papers');

// POST request
const response = await api.post('/auth/login', { email, password });

// File upload
const formData = new FormData();
formData.append('file', file);
const response = await api.post('/exam-papers/upload', formData);
```

### 2. Using Fetch API

For cases where you need to use fetch directly:

```javascript
// Option 1: Using environment variable
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exam-papers`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Option 2: Using config helper
import { getApiUrl } from '../config/api.config';

const response = await fetch(getApiUrl('/exam-papers'), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Constructing File URLs

For downloading or displaying files:

```javascript
import { getFullUrl } from '../config/api.config';

// If you have a relative path
const downloadUrl = '/api/answer-sheets/download/123';
const fullUrl = getFullUrl(downloadUrl);
// Result: 'http://localhost:5000/api/answer-sheets/download/123'

// Or using environment variable
const fileUrl = `${import.meta.env.VITE_API_BASE_URL}${downloadUrl}`;
```

## Migration from Hardcoded URLs

### Before (❌ Bad)

```javascript
const response = await fetch('http://localhost:5000/api/exam-papers');
```

### After (✅ Good)

```javascript
// Option 1: Using axios instance
const response = await api.get('/exam-papers');

// Option 2: Using environment variable
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exam-papers`);

// Option 3: Using config helper
import { getApiUrl } from '../config/api.config';
const response = await fetch(getApiUrl('/exam-papers'));
```

## Environment Detection

Check the current environment:

```javascript
import { isDevelopment, isProduction } from '../config/api.config';

if (isDevelopment) {
  console.log('Running in development mode');
}

if (isProduction) {
  // Disable debug logging
  console.log = () => {};
}
```

## Best Practices

### 1. Always Use Environment Variables

❌ **Don't do this:**
```javascript
const API_URL = 'http://localhost:5000/api';
```

✅ **Do this:**
```javascript
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
```

### 2. Use the Axios Instance for API Calls

❌ **Don't do this:**
```javascript
const response = await fetch(`${API_URL}/exam-papers`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

✅ **Do this:**
```javascript
import api from '../services/api';
const response = await api.get('/exam-papers');
```

The axios instance automatically:
- Adds the base URL
- Includes authentication headers
- Handles token refresh
- Provides better error handling

### 3. Use Endpoint Constants

❌ **Don't do this:**
```javascript
const response = await api.get('/exam-papers/' + examId);
```

✅ **Do this:**
```javascript
import { API_ENDPOINTS } from '../config/api.config';
const response = await api.get(API_ENDPOINTS.EXAM_PAPERS.BY_ID(examId));
```

### 4. Never Commit Sensitive .env Files

Files to commit:
- ✅ `.env.example`
- ✅ `src/config/api.config.js`

Files to never commit:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`

Make sure these are in `.gitignore`:
```
.env
.env.local
.env.production
.env.*.local
```

## Troubleshooting

### Issue: API calls return 404

**Check:**
1. Is `VITE_API_BASE_URL` set correctly?
2. Does it include `/api`? (It shouldn't)
3. Does it have a trailing slash? (It shouldn't)
4. Is the backend server running?

**Debug:**
```javascript
console.log('Backend URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Full API URL:', `${import.meta.env.VITE_API_BASE_URL}/api`);
```

### Issue: Environment variables not loading

**Check:**
1. Are variables prefixed with `VITE_`?
2. Did you restart the dev server after changing .env?
3. Is the .env file in the project root?

**Solution:**
```powershell
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

### Issue: CORS errors

**Check:**
1. Is backend CORS configured to allow your frontend URL?
2. Is `VITE_API_BASE_URL` pointing to the correct backend?

**Backend CORS setup:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',      // Development
    'https://your-app.vercel.app' // Production
  ]
}));
```

### Issue: Different behavior in development vs production

**Check:**
1. Are environment variables set in both `.env` and Vercel?
2. Are the URLs correct for each environment?

**Debug:**
```javascript
console.log('Environment:', import.meta.env.VITE_ENV);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Is Development:', import.meta.env.DEV);
console.log('Is Production:', import.meta.env.PROD);
```

## Testing API Configuration

### Test Script

Create `src/test-api-config.js`:

```javascript
import { 
  API_BASE_URL, 
  API_URL, 
  API_ENDPOINTS,
  getFullUrl,
  getApiUrl,
  isDevelopment,
  isProduction
} from './config/api.config';

console.log('=== API Configuration Test ===');
console.log('Environment:', import.meta.env.VITE_ENV);
console.log('Is Development:', isDevelopment);
console.log('Is Production:', isProduction);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('API_URL:', API_URL);
console.log('\n=== Sample Endpoints ===');
console.log('Login:', getApiUrl(API_ENDPOINTS.AUTH.LOGIN));
console.log('Exam by ID:', getApiUrl(API_ENDPOINTS.EXAM_PAPERS.BY_ID('123')));
console.log('Download:', getFullUrl(API_ENDPOINTS.ANSWER_SHEETS.DOWNLOAD('456')));
```

Run in browser console:
```javascript
import('./test-api-config.js');
```

## Security Considerations

1. **Never expose sensitive data** in environment variables that are prefixed with `VITE_`
   - These are embedded in the client-side bundle
   - Anyone can see them in the browser

2. **API keys and secrets** should NEVER be in frontend code
   - Use backend environment variables for sensitive data
   - Frontend should only have the backend URL

3. **Use HTTPS in production**
   - Always use `https://` for production backend URLs
   - Never use `http://` for production

4. **Rate limiting**
   - Implement on the backend
   - Frontend can't reliably enforce rate limits

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

---

Last Updated: 2025-11-25
