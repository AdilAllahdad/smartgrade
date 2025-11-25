# Backend Deployment to Render.com - Quick Guide

## ✅ Your Backend is Ready!

Your backend has been prepared for deployment with the following fixes:
- ✅ Dynamic PORT configuration (Render assigns its own port)
- ✅ Proper CORS configuration with environment variables
- ✅ All necessary scripts in package.json

## 📋 What You Need

Before deploying, gather:
1. **MongoDB Connection String** (from MongoDB Atlas)
2. **JWT Secret** (any random string, keep it secure)
3. **Frontend URL** (will be your Vercel URL after deployment)

---

## 🚀 Step-by-Step Deployment

### Step 1: Get MongoDB Atlas Ready (5 minutes)

If you're using local MongoDB, you need to migrate to MongoDB Atlas (free):

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create a **Free Cluster** (M0 Sandbox)
4. Click **"Connect"**
5. **Add Connection IP**: Click "Allow Access from Anywhere" → Add `0.0.0.0/0`
6. **Create Database User**: 
   - Username: `examadmin` (or your choice)
   - Password: Generate a strong password (save it!)
7. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Example: `mongodb+srv://examadmin:YourPassword@cluster0.xxxxx.mongodb.net/exam-system?retryWrites=true&w=majority`

### Step 2: Push Latest Changes to GitHub

```powershell
cd D:\FYPWORK\exam-system
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### Step 3: Deploy to Render

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with GitHub

3. **Create New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account (if not already)
   - Select your **smartgrade** repository
   - Click **"Connect"**

4. **Configure Service:**

   | Setting | Value |
   |---------|-------|
   | **Name** | `smartgrade-backend` (or your choice) |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

5. **Add Environment Variables** (Click "Advanced" → "Add Environment Variable"):

   | Key | Value | Notes |
   |-----|-------|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string | From Step 1 |
   | `JWT_SECRET` | Random string (e.g., `MySecretKey123!@#`) | Generate a strong one |
   | `NODE_ENV` | `production` | Important! |
   | `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Add Vercel URL later |

   **Example:**
   ```
   MONGODB_URI=mongodb+srv://examadmin:YourPass@cluster0.xxxxx.mongodb.net/exam-system
   JWT_SECRET=8dj3kD9sl2Kd93jS9dk3Js9
   NODE_ENV=production
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

6. **Click "Create Web Service"**

7. **Wait for Deployment** (5-10 minutes)
   - Watch the logs
   - Should see "MongoDB Connected" message
   - Should see "Server is running on port XXXXX"

### Step 4: Get Your Backend URL

Once deployed:
1. You'll see your service dashboard
2. At the top: `https://smartgrade-backend-xxxx.onrender.com`
3. **Copy this URL** - you'll need it for frontend!

### Step 5: Test Your Backend

Test if it's working:

```powershell
# Test health endpoint
curl https://your-backend-url.onrender.com/api/test

# Should return: {"message":"Server is working!"}
```

Or open in browser: `https://your-backend-url.onrender.com/api/test`

### Step 6: Update CORS for Frontend (After Frontend Deployment)

Once you deploy frontend to Vercel:

1. Go to Render dashboard → Your service
2. Click **"Environment"** (left sidebar)
3. Find `ALLOWED_ORIGINS`
4. Edit to add your Vercel URL:
   ```
   http://localhost:3000,http://localhost:5173,https://your-app.vercel.app
   ```
5. Save → Service will auto-redeploy

---

## ⚠️ Important Notes

### Free Tier Limitations:
- ⚠️ **Service spins down after 15 minutes of inactivity**
- ⚠️ **First request after spin-down takes 30-60 seconds**
- ✅ Good for development/testing
- ✅ Upgrade to paid plan for production

### MongoDB Atlas Free Tier:
- ✅ 512 MB storage
- ✅ Good for development
- ✅ Can upgrade later

---

## 🐛 Troubleshooting

### Build Failed?

**Check logs in Render dashboard:**
- Missing dependencies? → Check package.json
- Node version issues? → Add `engines` in package.json:
  ```json
  "engines": {
    "node": ">=16.0.0"
  }
  ```

### MongoDB Connection Failed?

1. **Check connection string**:
   - Password has special characters? → URL encode them
   - Database name included? → Add `/exam-system` before `?`

2. **Check IP whitelist**:
   - MongoDB Atlas → Network Access
   - Should have `0.0.0.0/0` (Allow from anywhere)

3. **Check database user**:
   - MongoDB Atlas → Database Access
   - User should exist with correct password

### CORS Errors?

1. Check `ALLOWED_ORIGINS` in Render environment variables
2. Make sure frontend URL is included
3. No trailing slashes in URLs

---

## ✅ Success Checklist

After deployment:
- [ ] Backend URL accessible: `https://your-backend.onrender.com/api/test`
- [ ] MongoDB connected (check logs)
- [ ] Environment variables set correctly
- [ ] Backend URL copied for frontend deployment
- [ ] Test login endpoint works

---

## 🎯 Next Step

Once backend is deployed and working:

**Deploy Frontend to Vercel** using:
- `VITE_API_BASE_URL=https://your-backend.onrender.com`

Then update backend `ALLOWED_ORIGINS` with Vercel URL.

---

## 📞 Need Help?

If you encounter issues:
1. Check Render logs (Logs tab in dashboard)
2. Check MongoDB Atlas connection
3. Test endpoints with Postman/curl
4. Check environment variables are set

**Your backend is ready to deploy!** 🚀
