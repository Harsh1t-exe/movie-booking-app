# CineBook Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended)

Railway provides free hosting with PostgreSQL database included.

#### Steps:
1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub account
   - Select your repository
   - Railway will auto-detect Node.js and deploy

3. **Add PostgreSQL:**
   - In Railway dashboard, click "New Service"
   - Select "PostgreSQL"
   - Railway will provide database URL automatically

4. **Environment Variables:**
   Railway will auto-set `DATABASE_URL`. Add these in Railway dashboard:
   ```
   PORT=5000
   ADMIN_PASSWORD=your_secure_password
   ```

5. **Database Setup:**
   After deployment, run setup command in Railway console:
   ```bash
   npm run setup-db
   ```

**Result:** Your app will be live at `https://your-app-name.railway.app`

---

### Option 2: Vercel + Supabase

Perfect for React frontend with managed PostgreSQL.

#### Frontend (Vercel):
1. **Deploy Frontend:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set build command: `cd frontend && npm run build`
   - Set output directory: `frontend/build`

#### Backend (Vercel Functions):
1. **Create API folder structure:**
   ```
   api/
   ├── movies.js
   ├── showtimes.js
   └── bookings.js
   ```

2. **Database (Supabase):**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy connection URL
   - Run your schema in Supabase SQL editor

---

### Option 3: Netlify + Heroku

Traditional approach with separate hosting.

#### Frontend (Netlify):
1. **Build Settings:**
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`

#### Backend (Heroku):
1. **Create Procfile:**
   ```
   web: cd backend && npm start
   ```

2. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

---

## 🔧 Pre-Deployment Checklist

### 1. Update API URLs
In `frontend/src/services/api.js`, change:
```javascript
// From:
const API_BASE_URL = 'http://localhost:5000';

// To:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 2. Environment Variables
Create production `.env` files:

**Backend `.env`:**
```
DATABASE_URL=your_production_database_url
PORT=5000
ADMIN_PASSWORD=secure_production_password
NODE_ENV=production
```

**Frontend `.env`:**
```
REACT_APP_API_URL=https://your-backend-url.com
```

### 3. Database Migration
Ensure your `setup-db.js` works with production database URL.

### 4. CORS Configuration
Update CORS in `server.js` for production:
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com']
    : ['http://localhost:3000'],
  credentials: true
};
```

---

## 📱 Testing Deployment

1. **Database Connection:** Verify all tables are created
2. **API Endpoints:** Test all CRUD operations
3. **Admin Panel:** Confirm password protection works
4. **Email Service:** Test booking confirmations
5. **Responsive Design:** Check mobile compatibility

---

## 🎯 Domain Setup (Optional)

### Custom Domain:
1. **Buy domain** from Namecheap/GoDaddy
2. **Configure DNS** in your hosting provider
3. **SSL Certificate** (usually automatic)

### Subdomain Setup:
- `cinebook.yourdomain.com` - Main app
- `admin.yourdomain.com` - Admin panel

---

## 💡 Production Tips

### Security:
- Use environment variables for all secrets
- Enable HTTPS
- Set up monitoring
- Regular database backups

### Performance:
- Enable gzip compression
- Add CDN for static assets
- Database connection pooling
- Implement caching

### Monitoring:
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring
- Database metrics

---

**Estimated Deployment Time:** 30-60 minutes  
**Cost:** Free tier available on all platforms  
**Recommended:** Railway for simplicity, Vercel for React optimization
