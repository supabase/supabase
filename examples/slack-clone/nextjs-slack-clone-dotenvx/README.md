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

1. `supabase/.env.development` - For local development using `npx supabase start`.
2. `supabase/.env.production` - For your main production environment on Supabase.
3. `supabase/.env.preview` - For the preview branches

### Example: Environment-Driven Configuration

> **Important:** The `encrypted:` syntax only works for designated "secret" fields in the configuration (like `secret` in auth providers). Using encrypted values in other fields will not be automatically decrypted and may cause issues. If you need to protect sensitive information in non-secret fields, use environment variables with the `env()` syntax instead.
>
> Example of correct usage in secret fields:
>
> ```toml
> [auth.external.github]
> enabled = true
> client_id = "encrypted:<value>" # Won't decrypt the value since client_id isn't a secret value
> secret = "encrypted:<encrypted-value>"  # Works: 'secret' is a designated secret field
> ```

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

> **Note:** Alternatively, you can directly store encrypted values in your `config.toml` file:
>
> ```toml
> [auth.external.github]
> enabled = true
> secret = "encrypted:<encrypted-value>"
> ```
>
> This approach eliminates the need for environment variables but still maintains security through encryption.

---

## Local Development

Set local environment values in `supabase/.env.development`. Sensitive values like GitHub credentials should be encrypted.

Example `.env.development` file:

```dotenv
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=<client-id>
# GitHub Credentials (encrypted)
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=encrypted:<client-secret>
```

Replace placeholders with your own [GitHub OAuth App credentials](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app):

```bash
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET "<your-secret>" -f supabase/.env.development
```

Run the local stack:

```bash
npx dotenvx run -f supabase/.env.development -- npx supabase start
npx dotenvx run -f supabase/.env.development -- npm run dev
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
npx dotenvx set SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET "<your-secret>" -f supabase/.env.production
```

3. **Deploy to Supabase Remote:**

```bash
npx dotenvx run -f supabase/.env.production -- npx supabase link --project-ref <project-ref>
npx dotenvx run -f supabase/.env.production -- npx supabase db push
npx dotenvx run -f supabase/.env.production -- npx supabase config push
```

### How to Use with Preview Branches

Dotenvx now supports encrypted secrets with Supabase's branching system. This allows you to securely manage environment-specific configurations across different branches.

Here's how to set up encrypted secrets for your preview branches:

1. **Link to Your Production Project:**

```bash
npx supabase link
```

2. **Generate Key Pair and Encrypt Your Secrets:**

```bash
npx dotenvx set SOME_KEY "your-secret-value" -f .env.preview
```

This creates both the encrypted value in `.env.preview` and the decryption key in `.env.keys`.

3. **Update Project Secrets:**

We store the decryption keys in the project's secret handler, allowing the branching executor to access and decrypt your values when configuring services:

```bash
npx supabase secrets set --env-file .env.keys
# or
npx supabase secrets set DOTENV_PRIVATE_KEY <your-private-key>
```

4. **Choose Your Configuration Approach:**
   - Option A: Copy the encrypted value directly into `config.toml`:
     ```toml
     secret_value = "encrypted:<encrypted-value>"
     ```
   - Option B: Reference the environment variable that contain the secret in `config.toml`:
     ```toml
     secret_value = "env(SOME_KEY)"
     ```
     Then commit your `.env.preview` file with the encrypted values. The branching executor will automatically retrieve and use these values from `.env.preview` when deploying your branch.

Now your preview branches will have access to the encrypted secrets while maintaining security. The branching executor will handle both database migrations and configuration updates automatically.
