---
title: Supabase CLI
package: supabase
repo: https://github.com/supabase/cli
icon: reference-cli
description: Develop your project locally and deploy to the Supabase Platform.
hidden_labels:
 - optional
category_order:
 - General
 - Testing
 - Generate Types
 - Database
 - Migrations
 - Seed
 - Inspect
 - Organizations
 - Projects
 - Config
 - Branches
 - Edge Functions
 - Secrets
 - Storage
 - Authentication
 - Custom Domains
 - Vanity Subdomains
 - Network Bans
 - Network Restrictions
 - SSL Enforcement
 - Postgres Config
 - SQL Snippets
 - Notebooks
 - Services
 - Autocompletion Scripts
 - Telemetry
 - Encryption
 - Backups
 - Feedback and Support
---

The Supabase CLI provides tools to develop your project locally and deploy to the Supabase Platform. The CLI is still under development, but it contains all the functionality for working with your Supabase projects and the Supabase Platform.

- Run Supabase locally: [`supabase init`](/docs/reference-beta/cli/init) and [`supabase start`](/docs/reference-beta/cli/start)
- Manage database migrations: [`supabase migration`](/docs/reference-beta/cli/migration)
- CI/CD for releasing to production: [`supabase db push`](/docs/reference-beta/cli/db-push)
- Manage your Supabase projects: [`supabase projects`](/docs/reference-beta/cli/projects)
- Generate types directly from your database schema: [`supabase gen types`](/docs/reference-beta/cli/gen-types)
  - A [community-supported GitHub Action](https://github.com/lyqht/generate-supabase-db-types-github-action) to generate TypeScript types
- Shell autocomplete: [`supabase completion`](/docs/reference-beta/cli/completion)
  - A [community-supported Fig autocomplete spec](https://fig.io/manual/supabase) for macOS terminal

## Additional links

- [Install the Supabase CLI](/docs/guides/local-development/cli/getting-started)
- [Source code](https://github.com/supabase/cli)
- [Known bugs and issues](https://github.com/supabase/cli/issues)
- [Supabase CLI v1 and Management API Beta](https://supabase.com/blog/supabase-cli-v1-and-admin-api-beta)
- [Video: Announcing CLI V1 and Management API Beta](https://www.youtube.com/watch?v=OpPOaJI_Z28)
