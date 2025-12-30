# UR Life - Deployment Guide 🚀

This guide walks you through deploying UR Life to production.

---

## Prerequisites

- ✅ Supabase account with a project created
- ✅ Node.js 18+ and pnpm installed
- ✅ Git repository set up
- ✅ Vercel or Netlify account (free tier works)

---

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `ur-life-prod`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

### 1.2 Run Database Migration

1. Open Supabase SQL Editor
2. Copy content from `supabase/migrations/20250104000000_create_ur_life_schema.sql`
3. Paste and run the SQL

### 1.3 Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Go to Authentication > URL Configuration
4. Add your production URL to "Redirect URLs"

### 1.4 Get API Credentials

1. Go to Settings > API
2. Copy:
   - Project URL
   - `anon` public key

---

## Step 2: Create Demo Users

### Option A: Using Supabase Dashboard

1. Go to Authentication > Users
2. Click "Add user"
3. Create users:
   - Email: `fox123@ur-life.app`, Password: `rochester2025`
   - Email: `bear456@ur-life.app`, Password: `yellowjacket`
   - Email: `cat789@ur-life.app`, Password: `meowmeow123`

### Option B: Using SQL

```sql
-- Run this in SQL Editor
-- Note: You'll need to handle password hashing properly
INSERT INTO auth.users (email, raw_user_meta_data)
VALUES
  ('fox123@ur-life.app', '{"net_id": "fox123", "name": "Fox", "major": "Computer Science", "year": "Junior"}'),
  ('bear456@ur-life.app', '{"net_id": "bear456", "name": "Bear", "major": "Mathematics", "year": "Senior"}'),
  ('cat789@ur-life.app', '{"net_id": "cat789", "name": "Cat", "major": "Biology", "year": "Sophomore"}');
```

---

## Step 3: Deploy Frontend

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Build the project**

```bash
pnpm install
pnpm build
```

3. **Deploy**

```bash
vercel --prod
```

4. **Set Environment Variables**

In Vercel Dashboard:
- Go to Settings > Environment Variables
- Add:
  - `VITE_SUPABASE_URL` = your-project-url.supabase.co
  - `VITE_SUPABASE_ANON_KEY` = your-anon-key

5. **Redeploy**

```bash
vercel --prod
```

### Option B: Deploy to Netlify

1. **Build the project**

```bash
pnpm install
pnpm build
```

2. **Deploy**

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

3. **Set Environment Variables**

In Netlify Dashboard:
- Go to Site settings > Environment variables
- Add the same variables as above

4. **Redeploy**

```bash
netlify deploy --prod --dir=dist
```

### Option C: Deploy to GitHub Pages

1. **Update `vite.config.js`**

```javascript
export default defineConfig({
  base: '/ur-life/', // Your repo name
  // ... rest of config
});
```

2. **Build and deploy**

```bash
pnpm build
npx gh-pages -d dist
```

---

## Step 4: Configure Supabase for Production

### 4.1 Update Redirect URLs

1. Go to Authentication > URL Configuration
2. Add your production domain:
   - `https://your-domain.vercel.app`
   - `https://your-domain.vercel.app/**`

### 4.2 Set up Row Level Security

RLS policies are already created by the migration. Verify:

```sql
-- Check policies exist
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 4.3 Enable Realtime (Optional)

If you want real-time updates:

1. Go to Database > Replication
2. Enable replication for tables:
   - `tasks`
   - `courses`
   - `contacts`

---

## Step 5: Testing

### 5.1 Test Authentication

1. Visit your production URL
2. Try logging in with demo accounts
3. Verify session persistence

### 5.2 Test Data Operations

1. Add a task
2. Create a course
3. Add a contact
4. Check degree progress

### 5.3 Test Multi-device Sync

1. Log in on two different browsers
2. Make changes on one
3. Verify changes appear on the other

---

## Step 6: Monitoring

### 6.1 Supabase Dashboard

Monitor:
- Database size
- API requests
- Active users
- Realtime connections

### 6.2 Application Logs

Check browser console for:
- API errors
- Authentication issues
- Data sync problems

---

## Production Checklist

- [ ] Supabase project created
- [ ] Database migration run successfully
- [ ] Authentication configured
- [ ] Demo users created
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Redirect URLs configured
- [ ] RLS policies enabled
- [ ] Authentication tested
- [ ] Data operations tested
- [ ] Multi-device sync tested
- [ ] Performance monitored

---

## Rollback Plan

If something goes wrong:

1. **Revert Frontend**
```bash
vercel rollback  # or netlify rollback
```

2. **Restore Database**
```sql
-- Supabase auto-backups available in Dashboard
-- Database > Backups
```

3. **Check Logs**
- Vercel: `vercel logs`
- Netlify: Check Functions logs
- Supabase: Database > Logs

---

## Scaling Considerations

### Database

Supabase free tier includes:
- 500MB database
- 2GB bandwidth
- 50MB file storage
- 50,000 monthly active users

For larger deployments, upgrade to Pro ($25/month).

### Frontend

Both Vercel and Netlify free tiers are generous:
- Unlimited bandwidth
- Automatic SSL
- Global CDN

---

## Maintenance

### Regular Tasks

1. **Weekly**: Check error logs
2. **Monthly**: Review database size
3. **Quarterly**: Update dependencies

### Updates

```bash
# Update dependencies
pnpm update

# Test locally
pnpm dev

# Build and deploy
pnpm build
vercel --prod  # or netlify deploy --prod
```

---

## Security Best Practices

1. **Never commit** `.env.local` to git
2. **Rotate API keys** if exposed
3. **Monitor** authentication logs
4. **Review** RLS policies regularly
5. **Enable** 2FA on Supabase account
6. **Use** strong database password
7. **Limit** API key usage (if possible)

---

## Troubleshooting Deployment

### Build Fails

```bash
# Clear cache
rm -rf node_modules dist .vite
pnpm install
pnpm build
```

### Environment Variables Not Working

- Restart deployment after adding variables
- Check variable names have `VITE_` prefix
- Verify values don't have quotes

### CORS Errors in Production

- Check Supabase URL configuration
- Verify redirect URLs are correct
- Test with browser DevTools

### Database Connection Fails

- Check Supabase project is running
- Verify API keys are correct
- Test connection with curl:
```bash
curl https://your-project.supabase.co/rest/v1/
```

---

## Support

If you encounter issues:

1. Check [Supabase Status](https://status.supabase.com)
2. Review [Supabase Docs](https://supabase.com/docs)
3. Check [Vercel Docs](https://vercel.com/docs) or [Netlify Docs](https://docs.netlify.com)
4. Open an issue in the repository

---

## Cost Estimate

### Free Tier (Recommended for Class Project)

- Supabase: Free (with limits)
- Vercel/Netlify: Free
- **Total: $0/month**

### Production (If Scaling)

- Supabase Pro: $25/month
- Vercel Pro: $20/month (optional)
- **Total: $25-45/month**

---

<p align="center">
  <strong>Happy Deploying! 🚀</strong>
</p>
