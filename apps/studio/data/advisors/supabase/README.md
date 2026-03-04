# Advisors Backend

This directory contains the database migrations and edge functions for the Supabase Advisors alerting system. These are designed to be applied to a target Supabase project's database.

## Setup

### 1. Link to your target project

```bash
cd apps/studio/data/advisors/supabase
supabase link --project-ref <your-project-ref>
```

### 2. Apply migrations

**Option A: Via Supabase CLI**

```bash
supabase db push
```

**Option B: Via psql (direct SQL)**

```bash
psql "$DATABASE_URL" \
  -f supabase/migrations/20260304120000_create_advisors_schema.sql \
  -f supabase/migrations/20260304120001_seed_system_rules.sql \
  -f supabase/migrations/20260304120002_notification_dispatcher.sql \
  -f supabase/migrations/20260304120003_remediation_and_correlation.sql
```

**Option C: Via Dashboard SQL Editor**

Copy and paste each migration file's contents into the SQL Editor at:
`https://supabase.com/dashboard/project/<ref>/sql/new`

Run them in order (schema first, then seed, then dispatcher, then remediation).

### 3. Deploy edge functions

```bash
supabase functions deploy advisors-api
supabase functions deploy advisors-chat
supabase functions deploy advisors-mcp
```

### 4. Set environment variables

The chat function needs an OpenAI API key:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

For rules that call edge functions via `pg_net`, store the project URL and service role key in Vault:

```sql
select vault.create_secret('https://<ref>.supabase.co', 'supabase_url');
select vault.create_secret('<service-role-key>', 'service_role_key');
```

## Structure

```
supabase/
├── config.toml
├── migrations/
│   ├── 20260304120000_create_advisors_schema.sql    # Schema + tables + triggers + cron functions
│   ├── 20260304120001_seed_system_rules.sql         # 23 system rules from splinter + 3 default agents
│   ├── 20260304120002_notification_dispatcher.sql   # Notification trigger for Slack/webhook
│   └── 20260304120003_remediation_and_correlation.sql # Cross-signal correlation + remediation helpers
├── functions/
│   ├── advisors-shared/     # Shared db pool + CORS headers
│   ├── advisors-api/        # Hono CRUD API for all entities
│   ├── advisors-chat/       # AI chat with conversation persistence
│   └── advisors-mcp/        # MCP tool server (7 tools)
└── README.md
```

## What the migrations create

- Schema `_supabase_advisors` with 9 tables
- `pg_cron` integration for scheduled rule evaluation
- `pg_net` integration for edge function invocation
- Realtime publication on `issues` and `alerts` tables
- 23 system rules seeded from splinter lint SQL queries
- 3 default AI agents (Security, Performance, General)
- Notification dispatcher trigger on issues table
- Cross-signal correlation view and remediation helpers
