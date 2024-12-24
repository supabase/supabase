# Integrating Dotenvx with a Supabase Project

This project is a full-stack Slack clone built using:

### Frontend:

- **[Next.js](https://github.com/vercel/next.js):** A React framework optimized for production.
- **[Supabase.js](https://supabase.com/docs/library/getting-started):** For user management and real-time data syncing.

### Backend:

- **[Supabase](https://supabase.com/dashboard):** A hosted Postgres database with a RESTful API, used alongside Supabase.js.
- **GitHub Authentication:** For user login.

---

## Introduction

This example demonstrates how to use [dotenvx](https://dotenvx.com/) and `config.toml` to manage multiple environments seamlessly. You'll learn how to set up local and production environments with shared, secure configurations.

---

## Core Concept

`config.toml` supports environment variables through the `env()` syntax. Using `dotenvx`, you can securely manage sensitive values like GitHub credentials for third-party authentication.

### Key Features of Dotenvx:

- Secrets are encrypted and stored securely, while private decryption keys are saved in `.env.keys` (excluded from version control).
- Teams can share private keys to decrypt environment values securely.
- Learn more: [Dotenvx secrets and encryption](https://dotenvx.com/encryption).

This example guides you through deploying and managing app environments with dotenvx.

---

## Structuring Environment Files

Follow the conventions used in this project, where environments are split into three files:

1. `supabase/.env.local` - For local development using `npx supabase start`.
2. `supabase/.env.production` - For your main production environment on Supabase.

### Example: Environment-Driven Configuration

Using `env()` in `config.toml` simplifies environment-specific values:

```toml
site_url = "env(SUPABASE_AUTH_SITE_URL)"
additional_redirect_urls = [
    "env(SUPABASE_AUTH_ADDITIONAL_REDIRECT_URLS)"
]

[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
```

---

## Local Development

Set local environment values in `supabase/.env.local`. Sensitive values like GitHub credentials should be encrypted.

Example `.env.local` file:

```dotenv
# GitHub Credentials (encrypted)
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=encrypted:<client-id>
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=encrypted:<client-secret>
```

Replace placeholders with your own [GitHub OAuth App credentials](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app):

```bash
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID "<your-client-id>" -f supabase/.env.local
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET "<your-secret>" -f supabase/.env.local
```

Run the local stack:

```bash
npx dotenvx run -f supabase/.env.local -- npx supabase start
npx dotenvx run -f supabase/.env.local -- npm run dev
```

Visit `localhost:3000` to test the app with GitHub OAuth integration.

---

## Remote Deployment

### Prerequisites

- **Vercel Account**
- **Supabase Account**

1. **Create a Supabase Project:**
   Sign up at [Supabase Dashboard](https://supabase.com/dashboard) and create a new project. After the database initializes, configure `.env.production`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-api-key>
```

2. **Configure Production Variables:**

Set the site URL for authentication services:

```dotenv
SUPABASE_AUTH_SITE_URL=https://<your-app-url>.vercel.app/
SUPABASE_AUTH_ADDITIONAL_REDIRECT_URLS=https://<your-app-url>.vercel.app/**
```

Add GitHub credentials:

```bash
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID "<your-client-id>" -f supabase/.env.production
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET "<your-secret>" -f supabase/.env.production
```

3. **Deploy to Supabase Remote:**

```bash
npx dotenvx run -f supabase/.env.production -- npx supabase link --project-ref <project-ref>
npx dotenvx run -f supabase/.env.production -- npx supabase db push
npx dotenvx run -f supabase/.env.production -- npx supabase config push
```

### How to Use with Preview Branches

We are currently developing a workflow to integrate dotenv secrets with the Supabase branching system. This will allow each new deployed branch to be fully configured, including secrets.

However, this feature is not ready yet. While we work on a secure way to share dotenv secrets, you can still use a similar approach to manually configure an existing deployed branch on Supabase.

To do this, create a `.env.preview` file containing your secrets. Then, sync the branch configuration with your local values. Note that the branching executor already handles database migrations, so you'll only need to push the configuration:

```bash
npx dotenvx run -f supabase/.env.preview -- npx supabase link --project-ref <branch-ref>
# Sync branch configuration
npx dotenvx run -f supabase/.env.preview -- npx supabase config push
```
