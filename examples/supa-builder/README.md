# SupaBuilder

**Enterprise Self-Service Supabase Project Provisioning Platform**

SupaBuilder is a secure, scalable platform that enables enterprise teams to self-provision Supabase Pico (free tier) projects through a web interface. Built for organizations that need controlled project creation with proper governance, audit trails, and role-based access control.

## Features

- **Self-Service Project Creation**: Non-technical builders (PMs, designers, engineers) can create Supabase projects via a simple web form
- **Role-Based Access Control**: Admin and builder roles with appropriate permissions
- **Rate Limiting**: Built-in protection (5 projects/hour per user)
- **Audit Logging**: Immutable audit trail for all project operations
- **Security First**: Encrypted credentials, RLS policies, secure PAT storage
- **Enterprise Ready**: Organization-based isolation, soft delete, extensible architecture

## Architecture

```
User (Builder/Admin)
    ↓
Next.js App (SSR + Client Components)
    ↓
Server Actions → Edge Function (create-project)
    ↓
Management API → Creates Pico Project
    ↓
Store in Admin DB (projects table)
```

### Key Components

1. **Database Layer**: PostgreSQL with RLS policies, encryption functions, audit logs
2. **Edge Functions**: Deno-based serverless functions that interact with Management API
3. **Next.js Frontend**: Server and client components for UI
4. **Management API**: Official Supabase API for programmatic project creation

## Prerequisites

Before setting up SupaBuilder, ensure you have:

1. **Supabase Account** with access to:
   - Management API (organization owner/admin)
   - Personal Access Token (PAT) generation capability

2. **Development Tools**:
   - Node.js 18+ and npm
   - Supabase CLI (`npm install -g supabase`)
   - Git

3. **Access Requirements**:
   - Organization ID from your Supabase organization
   - Ability to create a new Supabase project (for the admin dashboard)

## Setup Guide

### Step 1: Create Admin Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (this will host SupaBuilder itself)
3. Wait for provisioning to complete
4. Note your project URL and anon key from Settings > API

### Step 2: Generate Management API Token

1. Go to [Account Tokens](https://supabase.com/dashboard/account/tokens)
2. Click "Generate New Token"
3. Give it a descriptive name (e.g., "SupaBuilder Management API")
4. Select appropriate scopes (project creation, read)
5. **Save this token securely** - you'll need it for edge function secrets

### Step 3: Clone and Install

```bash
# Clone the repository
git clone https://github.com/supabase/examples.git
cd examples/supa-builder

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
```

### Step 4: Configure Environment Variables

Edit `.env.local`:

```bash
# Admin Supabase Project (where SupaBuilder runs)
NEXT_PUBLIC_SUPABASE_URL=https://your-admin-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# These will be set as edge function secrets (see Step 6)
MANAGEMENT_ACCESS_TOKEN=sbp_your_management_token
ENCRYPTION_KEY=$(openssl rand -base64 32)  # Generate a secure key
```

### Step 5: Link to Supabase Project

```bash
# Login to Supabase CLI
supabase login

# Link to your admin project
supabase link --project-ref your-project-ref
```

### Step 6: Run Database Migrations

```bash
# Push migrations to your database
supabase db push

# This will create:
# - projects table
# - user_roles table
# - project_audit_logs table
# - rate_limits table
# - RLS policies
# - Helper functions
# - Auto-admin assignment trigger (first user becomes admin)
```

### Step 7: Set Edge Function Secrets

```bash
# Set all secrets from .env.local file
supabase secrets set --env-file .env.local

# Verify secrets were set correctly
supabase secrets list
```

Note: The CLI will automatically filter and only set non-`NEXT_PUBLIC_*` variables as secrets.

### Step 8: Deploy Edge Functions

```bash
# Deploy the create-project function
supabase functions deploy create-project

# Verify deployment
supabase functions list
```

### Step 9: Configure SSO Authentication

SupaBuilder uses SSO (Single Sign-On) for authentication. The first user to sign in will automatically be assigned the admin role.

#### Configure an SSO Provider

**For Production:**

1. Go to your Supabase Dashboard: Authentication > Providers
2. Enable your preferred provider (Google, Azure AD, Okta, etc.)

**Example: Google OAuth (Production)**

```
1. Navigate to: Authentication > Providers > Google
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: [from Google Cloud Console]
   - Client Secret: [from Google Cloud Console]
4. Set authorized redirect URL:
   https://[your-project-ref].supabase.co/auth/v1/callback
```

**For Local Development:**

If you want to test Google OAuth locally with `supabase start`:

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
3. Add to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
4. The `supabase/config.toml` is already configured to use these variables
5. Start local Supabase: `supabase start`
6. Your Next.js app will use the local Supabase instance

Note: Local development will use `http://127.0.0.1:54321` for the Supabase URL instead of your production URL.

#### Organization ID Mapping

The system automatically extracts the organization ID from SSO claims. Configure your SSO provider to include one of these claims:

- `organization_id` (preferred)
- `org_id`
- Or set a default in the migration file

**For Google Workspace:**
- The `hd` (hosted domain) claim is automatically available
- You can map this to organization_id in your app

**For Azure AD / Okta:**
- Configure custom claims in your IdP to include `organization_id`

#### First User Setup

1. Deploy the application (Step 10)
2. Navigate to your app URL
3. Click "Sign in with [Provider]"
4. The first user will automatically receive admin role
5. Subsequent users will receive builder role by default

#### Promote Additional Admins

After signing in as an admin, you can promote other users via SQL:

```sql
SELECT public.promote_to_admin('user@example.com', 'your_org_id');
```

Or build an admin UI that calls this function via your Next.js app.

### Step 10: Deploy Next.js Application

#### Option A: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Option B: Self-Host

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Step 11: Test the Application

1. Navigate to your deployed URL
2. Sign up / Log in with your admin account
3. Go to `/projects` to see the dashboard
4. Click "Create Project" to test project creation
5. Verify the project appears in both:
   - SupaBuilder dashboard
   - Supabase Management Console

## Usage

### For Builders (Non-Admin Users)

1. **Create a Project**:
   - Navigate to `/projects/new`
   - Fill out the form:
     - Project name (3-63 characters)
     - Organization ID
     - Region
     - Optional: Purpose and description
   - Click "Create Project"
   - Wait for provisioning (1-2 minutes)

2. **View Your Projects**:
   - Go to `/projects` to see all your projects
   - Click on a project to view details and credentials

3. **Access Credentials**:
   - Project detail page shows:
     - Supabase URL
     - Anon key
     - Quick links to dashboard

### For Admins

Admins have all builder permissions plus:

1. **View All Organization Projects**: See projects created by all users in your org
2. **Pause Projects**: Temporarily disable a project
3. **Resume Projects**: Reactivate a paused project
4. **Delete Projects**: Soft delete (preserves audit trail)
5. **View Audit Logs**: See complete history of project operations
6. **Manage User Roles**: Assign admin/builder roles to users

### Rate Limits

- **5 projects per hour** per user
- Resets on a rolling 60-minute window
- Exceeded limit returns 429 error with clear message

## Security Checklist

Before going to production, verify:

- [ ] Management API PAT is stored only in edge function secrets (never in code)
- [ ] Encryption key is generated securely (32+ characters)
- [ ] Database RLS policies are enabled on all tables
- [ ] Admin users are properly assigned in `user_roles` table
- [ ] Edge function has `verify_jwt: true` in config
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Service role keys are encrypted in database
- [ ] CORS headers are configured appropriately
- [ ] Rate limiting is enabled and configured
- [ ] Audit logging is working for all operations

## Database Schema

### Core Tables

#### `projects`
Stores all child Supabase projects with encrypted credentials.

```sql
- id (uuid, PK)
- project_ref (text, unique) - Supabase project reference
- project_name (text)
- organization_id (text)
- anon_key (text)
- service_role_key_encrypted (text) - Encrypted with pgcrypto
- region (text)
- status (enum: provisioning, active, paused, failed, deleted)
- creator_id (uuid) - References auth.users
- creator_email (text)
- created_at, updated_at, deleted_at
```

#### `user_roles`
Manages admin vs builder role assignments.

```sql
- id (uuid, PK)
- user_id (uuid) - References auth.users
- organization_id (text)
- role (enum: admin, builder)
- assigned_by (uuid)
- assigned_at (timestamptz)
```

#### `project_audit_logs`
Immutable audit trail (no update/delete allowed).

```sql
- id (uuid, PK)
- project_id (uuid) - References projects
- action (enum: create, pause, resume, delete, update)
- actor_id (uuid)
- actor_email (text)
- organization_id (text)
- metadata (jsonb)
- created_at (timestamptz)
```

#### `rate_limits`
Simple DB-based rate limiting.

```sql
- id (uuid, PK)
- user_id (uuid)
- organization_id (text)
- action (text)
- created_at (timestamptz)
```

## API Reference

### Edge Function: `create-project`

**Endpoint**: `POST /functions/v1/create-project`

**Headers**:
```
Authorization: Bearer <user-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "project_name": "my-project",
  "organization_id": "org_abc123",
  "region": "us-east-1",
  "purpose": "Development",
  "description": "Optional description"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "project_id": "uuid",
  "project_ref": "abcdefgh",
  "anon_key": "eyJhbGc...",
  "message": "Project created successfully"
}
```

**Error Response** (400/429/500):
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Server Actions

All located in `app/actions/projects.ts`:

- `createProject(input)` - Create new project
- `getProjects()` - Get all user's projects (respects RLS)
- `getProject(id)` - Get single project details
- `pauseProject(id)` - Admin only: pause project
- `resumeProject(id)` - Admin only: resume project
- `deleteProject(id)` - Admin only: soft delete
- `getUserRole(orgId)` - Get user's role in organization

## Troubleshooting

### Edge Function Returns 401 Unauthorized

**Cause**: JWT verification failed or missing auth header

**Solution**:
- Verify user is logged in
- Check `Authorization` header is being sent
- Ensure edge function has `verify_jwt: true`

### Edge Function Returns 500 - Management API Error

**Cause**: Invalid PAT or insufficient permissions

**Solution**:
```bash
# Check secrets are set
supabase secrets list

# Verify PAT has correct scopes
# Regenerate if needed from dashboard
```

### Projects Not Showing in Dashboard

**Cause**: RLS policies blocking access

**Solution**:
```sql
-- Check user role
SELECT * FROM public.user_roles WHERE user_id = 'YOUR_UUID';

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Test RLS policy
SELECT * FROM public.projects; -- Run as authenticated user
```

### Rate Limit Not Working

**Cause**: Rate limit function not being called

**Solution**:
- Check edge function calls `check_rate_limit` before creating project
- Verify `rate_limits` table has entries
- Check time window calculation (60 minutes rolling)

### Encryption/Decryption Errors

**Cause**: Missing or incorrect encryption key

**Solution**:
```bash
# Generate new key
openssl rand -base64 32

# Set as secret
supabase secrets set ENCRYPTION_KEY=your_new_key

# Redeploy edge function
supabase functions deploy create-project
```

## Extension Points for v2

SupaBuilder is designed to be extended. Future enhancements could include:

### 1. PII Scanning Hook
Add a hook in edge function to scan project names/descriptions for PII before creation.

### 2. RLS Policy Enforcement
Automatically apply RLS policies to child projects based on templates.

### 3. Compliance Scanning
Create `compliance_scans` table to track and enforce security requirements.

### 4. Webhook Notifications
Integrate with ServiceNow or other ITSM tools via webhooks.

### 5. Project Templates
Pre-configured database schemas and auth settings for common use cases.

### 6. Usage Tracking
Monitor API usage, storage, and database size for child projects.

### 7. Backup Configuration
Automatically configure PITR and backups for child projects.

### 8. Bulk Operations
Admin interface for bulk project operations (pause all, delete old projects, etc.).

## Contributing

This is an example project demonstrating Supabase Management API integration. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues specific to SupaBuilder:
- Open an issue on GitHub
- Check existing issues and discussions

For Supabase platform issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase Support](https://supabase.com/support)

## Additional Resources

- [Supabase Management API Docs](https://supabase.com/docs/reference/api)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ using [Supabase](https://supabase.com)
