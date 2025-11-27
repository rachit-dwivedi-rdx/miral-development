# MIRAL Deployment Guide

## Quick Deploy Options

### Option 1: Deploy on Replit (Easiest - Already Set Up!)
1. Your app is already running on Replit
2. Click **"Publish"** button in Replit UI (top right)
3. Get instant live URL
4. **Share URL**: `https://[your-project-name].replit.dev`

✅ **Pros**: Already configured, automatic SSL, instant

---

### Option 2: Deploy on Vercel

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "MIRAL: Ready for deployment"
git branch -M main
git remote set-url origin https://github.com/YOUR-USERNAME/MIRAL.git
git push -u origin main
```

#### Step 2: Deploy on Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import GitHub repository
4. Select **Next.js** or **Other** preset
5. Configure environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `DATABASE_URL`: Your PostgreSQL URL
   - `SESSION_SECRET`: Random string
6. Click Deploy

✅ **Pros**: Easy integration, free tier, fast CDN

---

### Option 3: Deploy on Netlify

#### Step 1: Build the project
```bash
npm run build
```

#### Step 2: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 3: Deploy
```bash
netlify deploy --prod
```

Or connect GitHub for auto-deployment:
1. Go to https://netlify.com
2. Connect GitHub
3. Select MIRAL repository
4. Configure build command: `npm run build`
5. Deploy

✅ **Pros**: Generous free tier, great performance

---

### Option 4: Deploy on Railway

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "MIRAL deployment"
git push
```

#### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose MIRAL repository
5. Add PostgreSQL database
6. Set environment variables
7. Auto-deploys on push

✅ **Pros**: Free tier includes database, simple setup

---

## Environment Variables for Production

```
OPENAI_API_KEY=sk_...your_key...
DATABASE_URL=postgresql://...
SESSION_SECRET=some-random-secret-key
NODE_ENV=production
```

## Testing Live Deployment

1. **Check homepage loads**
   - Visit your live URL
   - Login page should appear

2. **Test signup/login**
   - Create test account
   - Login with credentials

3. **Test practice mode**
   - Start a practice session
   - Allow camera access
   - Record 10 seconds
   - Check results page loads

4. **Test learning resources**
   - Click "Learn" page
   - Click resource link
   - Should open in new tab

5. **Test dashboard**
   - Check past sessions display
   - Verify metrics show correctly

## Common Issues & Fixes

### Issue: "Camera not working"
**Solution**: Ensure HTTPS (all deployment platforms provide this)

### Issue: "Database connection error"
**Solution**: Verify DATABASE_URL is correct and accessible

### Issue: "OpenAI key invalid"
**Solution**: Check OPENAI_API_KEY is set and has credits

### Issue: "Page not loading"
**Solution**: Check build logs for errors

## Performance Optimization

- **Frontend**: Caching enabled, optimized images
- **Backend**: Connection pooling, query optimization
- **Database**: Indexed columns, efficient queries
- **ML Models**: Cached in browser, lazy loaded

## Monitoring

Most platforms provide:
- 📊 Real-time logs
- 📈 Performance metrics
- 🚨 Error alerts
- 📊 Uptime monitoring

## Next Steps After Deployment

1. **Share live URL** with team
2. **Test thoroughly** in production
3. **Monitor logs** for errors
4. **Get user feedback**
5. **Iterate and improve**

---

**Your MIRAL app is production-ready! 🚀**
