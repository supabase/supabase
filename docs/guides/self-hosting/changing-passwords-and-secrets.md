---
title: 'Changing Passwords and Secrets'
description: 'Learn how to safely update passwords and secrets in self-hosted Supabase deployments'
---

## Overview

When self-hosting Supabase, several sensitive credentials are used across multiple services. This guide explains how to safely update these secrets without disrupting your deployment.

The main secrets you'll need to manage include:

- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - Used to sign and verify JWT tokens
- `ANON_KEY` - Anonymous (public) API key
- `SERVICE_ROLE_KEY` - Service role (admin) API key
- `DASHBOARD_PASSWORD` - Studio dashboard password

<Admonition type="warning">

Changing these secrets will affect all services that depend on them. Plan your updates during maintenance windows to minimize disruption.

</Admonition>

## Where Secrets Are Stored

### Docker Compose Deployments

In Docker-based deployments, secrets are typically stored in:

- **`.env` file** - Environment variables loaded by Docker Compose
- **`docker-compose.yml`** - May reference environment variables directly
- **`volumes/api/kong.yml`** - Kong gateway configuration

Multiple services share these secrets:

- **Kong** - API gateway that validates JWT tokens
- **Auth (GoTrue)** - Authentication service
- **REST API (PostgREST)** - Database API layer
- **Realtime** - WebSocket server
- **Storage** - File storage service
- **Studio** - Web dashboard

<Admonition type="note">

All services must use identical JWT secrets for token validation to work correctly.

</Admonition>

## Changing the Postgres Password

The Postgres password is used by multiple services to connect to the database.

### Step 1: Update the Environment Variable

Edit your `.env` file:

```bash
# Before
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# After
POSTGRES_PASSWORD=new-strong-password-here-min-32-chars
```

### Step 2: Update Database Connection Strings

Several services use connection strings that include the password. Update these variables in your `.env`:

```bash
# Database URL format: postgres://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
DATABASE_URL=postgresql://postgres:new-strong-password-here-min-32-chars@db:5432/postgres
```

### Step 3: Update the Database Password

Connect to your Postgres container and change the password:

```bash
docker exec -it supabase-db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'new-strong-password-here-min-32-chars';"
```

### Step 4: Restart All Services

```bash
docker compose down
docker compose up -d
```

### Step 5: Verify the Change

Test the connection with the new password:

```bash
docker exec -it supabase-db psql -U postgres -c "SELECT version();"
```

If successful, the Postgres version will be displayed.

<Admonition type="warning">

Ensure you update the password in both the environment variables AND the actual database. Mismatched passwords will prevent services from starting.

</Admonition>

## Changing the JWT Secret

The JWT secret is critical for authentication. It's used to sign and verify all access tokens.

### Step 1: Generate a New JWT Secret

Generate a secure random string (minimum 32 characters):

```bash
openssl rand -base64 32
```

### Step 2: Update the Environment Variable

Edit your `.env` file:

```bash
# Before
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# After
JWT_SECRET=8xKzP9mN2qR5vY7wE3tU6iO1pA4sD8fG9hJ0kL2mN5qR
```

### Step 3: Restart All Services

```bash
docker compose down
docker compose up -d
```

### Step 4: Regenerate API Keys (Optional)

If you also want to regenerate your `ANON_KEY` and `SERVICE_ROLE_KEY` to match the new JWT secret, see the next section.

<Admonition type="danger">

**Critical Impact:** Changing the JWT secret will immediately invalidate all existing user sessions and tokens. All users will be logged out and must re-authenticate.

</Admonition>

### What Happens After Changing JWT Secret

- All active user sessions become invalid
- Existing access tokens and refresh tokens are rejected
- Users must log in again
- Client applications must obtain new tokens
- Server-side code using old tokens will receive 401 errors

## Changing Anonymous and Service Role Keys

The `ANON_KEY` and `SERVICE_ROLE_KEY` are JWT tokens signed with your `JWT_SECRET`. They provide different permission levels for accessing your API.

### Understanding the Keys

- **ANON_KEY** - Public key used by client applications, respects Row Level Security (RLS) policies
- **SERVICE_ROLE_KEY** - Admin key that bypasses RLS, used for server-side operations

### Step 1: Generate New Keys

You can generate new keys using Supabase's JWT generator or the following Node.js script:

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-new-jwt-secret-here';

// Generate anonymous key
const anonKey = jwt.sign(
  {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60), // 10 years
  },
  JWT_SECRET
);

// Generate service role key
const serviceKey = jwt.sign(
  {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60), // 10 years
  },
  JWT_SECRET
);

console.log('ANON_KEY:', anonKey);
console.log('SERVICE_ROLE_KEY:', serviceKey);
```

### Step 2: Update Environment Variables

Edit your `.env` file:

```bash
# Before
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...old-token
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...old-token

# After
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new-token
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new-token
```

### Step 3: Restart Services

```bash
docker compose down
docker compose up -d
```

### Step 4: Update Client Applications

Update all client applications that use these keys:

```javascript
// Before
const supabase = createClient(
  'https://your-project.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...old-anon-key'
);

// After
const supabase = createClient(
  'https://your-project.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new-anon-key'
);
```

<Admonition type="warning">

**Impact on Applications:**

- Client applications using the old `ANON_KEY` will receive 401 Unauthorized errors
- Server-side code using the old `SERVICE_ROLE_KEY` will fail to bypass RLS
- Edge Functions must be updated with new environment variables
- Mobile apps may need to be updated and redeployed

</Admonition>

### What Needs to Be Updated

When you change API keys, update them in:

1. **Client Applications**
   - Web apps (JavaScript/TypeScript)
   - Mobile apps (iOS, Android, Flutter)
   - Desktop applications

2. **Server-Side Code**
   - Backend APIs that call Supabase
   - Scheduled jobs and cron tasks
   - Webhooks and integrations

3. **Edge Functions**
   - Update `SUPABASE_ANON_KEY` in function environment variables
   - Redeploy affected functions

4. **CI/CD Pipelines**
   - Update environment variables in GitHub Actions, GitLab CI, etc.
   - Update secrets in deployment platforms (Vercel, Netlify, etc.)

## Changing the Dashboard Password

The Studio dashboard is protected by a basic password when self-hosting.

### Step 1: Update the Environment Variable

Edit your `.env` file:

```bash
# Before
DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated

# After
DASHBOARD_PASSWORD=your-new-secure-dashboard-password
```

### Step 2: Restart Studio

```bash
docker compose restart studio
```

### Step 3: Access the Dashboard

Navigate to `http://localhost:3000` (or your Studio URL) and use the new password.

## Changing Storage Secrets

Storage services may use additional secrets for file operations.

### S3-Compatible Storage

If using S3-compatible storage backends:

```bash
# Update in .env
STORAGE_S3_ACCESS_KEY_ID=new-access-key
STORAGE_S3_SECRET_ACCESS_KEY=new-secret-key
```

Restart the storage service:

```bash
docker compose restart storage
```

## Changing SMTP Credentials

If you've configured SMTP for sending emails:

```bash
# Update in .env
SMTP_USER=new-smtp-username
SMTP_PASS=new-smtp-password
```

Restart the auth service:

```bash
docker compose restart auth
```

## Complete Example: Rotating All Secrets

Here's a complete workflow for rotating all major secrets:

### Before (`.env` file)

```bash
POSTGRES_PASSWORD=old-postgres-password
JWT_SECRET=old-jwt-secret-min-32-characters
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.old-anon
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.old-service
DASHBOARD_PASSWORD=old-dashboard-pass
```

### After (`.env` file)

```bash
POSTGRES_PASSWORD=Zx9#mK2$pL8@qW5&nR7!tY4^uI3*oP6
JWT_SECRET=A7b9C2d4E6f8G1h3J5k7M9n2P4q6R8s0T
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-anon
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-service
DASHBOARD_PASSWORD=NewSecure#Dashboard$Password2024!
```

### Rotation Steps

```bash
# 1. Stop all services
docker compose down

# 2. Update Postgres password in the database
docker compose up -d db
sleep 10
docker exec -it supabase-db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'Zx9#mK2$pL8@qW5&nR7!tY4^uI3*oP6';"

# 3. Update .env with all new secrets (shown above)

# 4. Generate new ANON_KEY and SERVICE_ROLE_KEY with the new JWT_SECRET

# 5. Start all services
docker compose up -d

# 6. Verify services are healthy
docker compose ps
docker compose logs --tail=50
```

## Best Practices

### Password Requirements

- **Minimum length:** 32 characters for production environments
- **Complexity:** Use a mix of uppercase, lowercase, numbers, and special characters
- **Uniqueness:** Never reuse passwords across different secrets or environments
- **Generation:** Use cryptographically secure random generators

Generate secure passwords:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: /dev/urandom (Linux/Mac)
cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9!@#$%^&*' | fold -w 32 | head -n 1

# Option 3: pwgen (if installed)
pwgen -s 32 1
```

### Rotation Schedule

Consider rotating secrets periodically:

- **Critical production systems:** Every 90 days
- **Development/staging:** Every 180 days
- **After team member departure:** Immediately
- **After suspected compromise:** Immediately

### Security Checklist

Before changing secrets:

- [ ] Schedule a maintenance window
- [ ] Notify users of potential downtime
- [ ] Backup your `.env` file securely
- [ ] Document current configuration
- [ ] Test the process in a staging environment first

After changing secrets:

- [ ] Verify all services started successfully
- [ ] Test user authentication
- [ ] Test API access with new keys
- [ ] Update client applications
- [ ] Update documentation
- [ ] Store new secrets in a password manager
- [ ] Delete old secrets from any temporary locations

### Storing Secrets Securely

<Admonition type="caution">

Never commit `.env` files to version control. Add them to `.gitignore`.

</Admonition>

Use proper secret management:

- **Local development:** Use `.env` files (ensure `.gitignore` includes `.env`)
- **Production:** Use secret management tools (HashiCorp Vault, AWS Secrets Manager, etc.)
- **Team sharing:** Use password managers (1Password, Bitwarden, etc.)
- **CI/CD:** Use platform-specific secret storage (GitHub Secrets, GitLab CI/CD Variables)

## Troubleshooting

### Services Won't Start After Changing Secrets

**Symptom:** Containers exit immediately after `docker compose up`

**Solution:**

```bash
# Check logs for specific service
docker compose logs auth
docker compose logs kong
docker compose logs rest

# Common issues:
# - Mismatched JWT_SECRET between services
# - Incorrect Postgres password in connection strings
# - Typos in environment variables
```

### 401 Unauthorized Errors

**Symptom:** API requests return `401 Unauthorized`

**Causes:**

- Client using old `ANON_KEY` or `SERVICE_ROLE_KEY`
- JWT_SECRET mismatch between Kong and other services
- Cached tokens with old JWT_SECRET

**Solution:**

- Clear browser cache and local storage
- Update client applications with new keys
- Ensure all services restarted with new `.env` values

### Database Connection Refused

**Symptom:** Services log "connection refused" or "authentication failed"

**Solution:**

```bash
# Verify Postgres password was actually changed
docker exec -it supabase-db psql -U postgres

# Check DATABASE_URL matches POSTGRES_PASSWORD
grep POSTGRES_PASSWORD .env
grep DATABASE_URL .env

# Ensure connection string format is correct
# postgresql://postgres:[PASSWORD]@db:5432/postgres
```

### Users Can't Log In After JWT Secret Change

**Expected behavior:** This is normal. Changing `JWT_SECRET` invalidates all existing tokens.

**Solution:**

- Users must log in again
- Clear user sessions from the auth.sessions table if needed
- Communicate the change to users in advance

### Edge Functions Failing

**Symptom:** Edge Functions return errors after key rotation

**Solution:**

Update environment variables in your Edge Functions:

```bash
# Re-deploy functions with new keys
supabase functions deploy function-name --no-verify-jwt
```

Or update the function's environment variables:

```bash
supabase secrets set SUPABASE_ANON_KEY=new-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=new-service-key
```

## Additional Resources

- [Self-Hosting Supabase](/docs/guides/self-hosting)
- [Docker Setup Guide](/docs/guides/self-hosting/docker)
- [Managing Environment Variables](/docs/guides/self-hosting/environment-variables)
- [Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)

<Admonition type="note">

For production deployments on Supabase Cloud, secret rotation is handled automatically. This guide is specifically for self-hosted deployments.

</Admonition>
