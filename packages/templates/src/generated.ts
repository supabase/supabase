import type { CategoriesManifest } from './categories'
import { createTemplateIndex, type Template } from './schema'

export const templates: Template[] = [
  {
    "id": "database",
    "name": "Database",
    "description": "PostgreSQL database with schemas and seed support",
    "category": "Core",
    "version": "1.0.0",
    "tags": [
      "database",
      "postgres"
    ],
    "defaultEnabled": true,
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[db]\nenabled = true\nport = 54322\nmajor_version = 15\n\n[db.seed]\nenabled = true\nsql_paths = [\"./seed.sql\"]\n"
      }
    ]
  },
  {
    "id": "functions",
    "name": "Edge Functions",
    "description": "Deno-based serverless functions at the edge",
    "category": "Core",
    "version": "1.0.0",
    "tags": [
      "functions",
      "edge",
      "serverless",
      "deno"
    ],
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[edge_runtime]\nenabled = true\npolicy = \"oneshot\"\ninspector_port = 8083\n"
      }
    ]
  },
  {
    "id": "storage",
    "name": "Storage",
    "description": "S3-compatible object storage for files",
    "category": "Core",
    "version": "1.0.0",
    "tags": [
      "storage",
      "files",
      "s3"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[storage]\nenabled = true\nfile_size_limit = \"50MB\"\n"
      }
    ]
  },
  {
    "id": "auth",
    "name": "Auth",
    "description": "User authentication and authorization service",
    "category": "Auth",
    "version": "1.0.0",
    "tags": [
      "auth",
      "users",
      "sessions"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[auth]\nenabled = true\nsite_url = \"http://localhost:3000\"\nadditional_redirect_urls = [\"https://localhost:3000\"]\njwt_expiry = 3600\nenable_signup = true\n"
      }
    ]
  },
  {
    "id": "api",
    "name": "Data API",
    "description": "PostgREST API for database access over HTTP",
    "category": "API",
    "version": "1.0.0",
    "tags": [
      "api",
      "rest",
      "postgrest"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[api]\nenabled = true\nport = 54321\nschemas = [\"public\"]\nmax_rows = 1000\nextra_search_path = [\"public\", \"extensions\"]\n"
      }
    ]
  },
  {
    "id": "graphql",
    "name": "GraphQL",
    "description": "Auto-generated GraphQL API via pg_graphql over Postgres",
    "category": "API",
    "version": "1.0.0",
    "tags": [
      "api",
      "graphql",
      "pg_graphql"
    ],
    "dependencies": {
      "required": [
        "api"
      ]
    },
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[api]\nschemas = [\"public\", \"graphql_public\"]\nextra_search_path = [\"public\", \"extensions\"]\n"
      },
      {
        "path": "supabase/schemas/graphql.sql",
        "content": "create extension if not exists pg_graphql with schema graphql;\n"
      }
    ]
  },
  {
    "id": "security-rls",
    "name": "Auto-enable RLS",
    "description": "Event trigger that automatically enables Row Level Security on new public tables",
    "category": "Security",
    "version": "1.0.0",
    "tags": [
      "security",
      "rls",
      "event-trigger"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/security.sql",
        "content": "-- Automatically enable RLS on new tables in the public schema.\n-- See: https://supabase.com/docs/guides/database/postgres/event-triggers\n\ncreate or replace function public.rls_auto_enable()\nreturns event_trigger\nlanguage plpgsql\nsecurity definer\nset search_path = pg_catalog\nas $$\ndeclare\n  cmd record;\nbegin\n  for cmd in\n    select *\n    from pg_event_trigger_ddl_commands()\n    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')\n      and object_type in ('table', 'partitioned table')\n  loop\n    if cmd.schema_name is not null\n      and cmd.schema_name in ('public')\n      and cmd.schema_name not in ('pg_catalog', 'information_schema')\n      and cmd.schema_name not like 'pg_toast%'\n      and cmd.schema_name not like 'pg_temp%'\n    then\n      begin\n        execute format('alter table if exists %s enable row level security', cmd.object_identity);\n        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;\n      exception\n        when others then\n          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;\n      end;\n    else\n      raise log 'rls_auto_enable: skip % (schema: %)', cmd.object_identity, cmd.schema_name;\n    end if;\n  end loop;\nend;\n$$;\n\ndrop event trigger if exists ensure_rls;\ncreate event trigger ensure_rls\non ddl_command_end\nwhen tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')\nexecute function public.rls_auto_enable();\n"
      }
    ],
    "readme": "# Security RLS template\n\nBaseline row level security patterns for common Supabase tables and auth-aware policies.\n\n## Includes\n\n- Example secured tables\n- Reusable RLS policy templates\n\n## Dependencies\n\nRequires **database** and **auth**."
  },
  {
    "id": "authz-rbac",
    "name": "RBAC & Custom Claims",
    "description": "Role and permission tables with authorize() helper and custom access token auth hook",
    "category": "Auth",
    "version": "1.0.0",
    "tags": [
      "rbac",
      "auth",
      "permissions",
      "custom-claims"
    ],
    "dependencies": {
      "required": [
        "auth",
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/config.toml",
        "content": "[auth.hook.custom_access_token]\nenabled = true\nuri = \"pg-functions://postgres/public/custom_access_token_hook\"\n"
      },
      {
        "path": "supabase/schemas/rbac.sql",
        "content": "-- Role-based access control with JWT custom claims.\n-- See: https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac\n\ncreate type public.app_permission as enum (\n  'items.read',\n  'items.write',\n  'items.delete',\n  'admin.access'\n);\n\ncreate type public.app_role as enum ('admin', 'moderator', 'member');\n\ncreate table public.user_roles (\n  id bigint generated by default as identity primary key,\n  user_id uuid references auth.users on delete cascade not null,\n  role public.app_role not null,\n  unique (user_id, role)\n);\n\ncomment on table public.user_roles is 'Application roles assigned to each user.';\n\ncreate table public.role_permissions (\n  id bigint generated by default as identity primary key,\n  role public.app_role not null,\n  permission public.app_permission not null,\n  unique (role, permission)\n);\n\ncomment on table public.role_permissions is 'Permissions granted to each application role.';\n\ncreate or replace function public.authorize(requested_permission public.app_permission)\nreturns boolean\nlanguage plpgsql\nstable\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  bind_permissions int;\n  user_role public.app_role;\nbegin\n  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;\n\n  select count(*)\n  into bind_permissions\n  from public.role_permissions\n  where role_permissions.permission = requested_permission\n    and role_permissions.role = user_role;\n\n  return bind_permissions > 0;\nend;\n$$;\n\ncreate or replace function public.custom_access_token_hook(event jsonb)\nreturns jsonb\nlanguage plpgsql\nstable\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  claims jsonb;\n  user_role public.app_role;\nbegin\n  select role\n  into user_role\n  from public.user_roles\n  where user_id = (event ->> 'user_id')::uuid\n  order by\n    case role\n      when 'admin' then 1\n      when 'moderator' then 2\n      else 3\n    end\n  limit 1;\n\n  claims := event -> 'claims';\n\n  if user_role is not null then\n    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));\n  else\n    claims := jsonb_set(claims, '{user_role}', 'null');\n  end if;\n\n  return jsonb_set(event, '{claims}', claims);\nend;\n$$;\n\ngrant usage on schema public to supabase_auth_admin;\n\ngrant execute on function public.custom_access_token_hook to supabase_auth_admin;\n\nrevoke execute on function public.custom_access_token_hook\nfrom authenticated, anon, public;\n\ngrant all on table public.user_roles to supabase_auth_admin;\n\nrevoke all on table public.user_roles from authenticated, anon, public;\n\nalter table public.user_roles enable row level security;\nalter table public.role_permissions enable row level security;\n\ncreate policy \"Allow auth admin to read user roles\"\non public.user_roles\nas permissive\nfor select\nto supabase_auth_admin\nusing (true);\n\ncreate policy \"Allow authenticated read access to role permissions\"\non public.role_permissions\nfor select\nto authenticated\nusing (true);\n\n-- Example protected table using authorize()\ncreate table public.items (\n  id bigint generated by default as identity primary key,\n  owner_id uuid references auth.users on delete cascade not null,\n  title text not null,\n  created_at timestamptz default now()\n);\n\nalter table public.items enable row level security;\n\ncreate policy \"Allow authenticated read access\"\non public.items\nfor select\nto authenticated\nusing (true);\n\ncreate policy \"Allow owners to insert items\"\non public.items\nfor insert\nto authenticated\nwith check (auth.uid() = owner_id);\n\ncreate policy \"Allow owners to update items\"\non public.items\nfor update\nto authenticated\nusing (auth.uid() = owner_id);\n\ncreate policy \"Allow authorized delete access\"\non public.items\nfor delete\nto authenticated\nusing ((select public.authorize('items.delete')));\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "insert into public.role_permissions (role, permission)\nvalues\n  ('admin', 'items.read'),\n  ('admin', 'items.write'),\n  ('admin', 'items.delete'),\n  ('admin', 'admin.access'),\n  ('moderator', 'items.read'),\n  ('moderator', 'items.write'),\n  ('moderator', 'items.delete'),\n  ('member', 'items.read'),\n  ('member', 'items.write')\non conflict do nothing;\n"
      }
    ],
    "readme": "# RBAC authorization template\n\nRole-based access control with roles, permissions, and RLS policies wired to JWT claims.\n\n## Includes\n\n- RBAC schema (roles, permissions, memberships)\n- Seed roles for local testing\n- Policies that map auth roles to row access\n\n## Dependencies\n\nRequires **database** and **auth**."
  },
  {
    "id": "multi-tenant",
    "name": "Multi-tenant",
    "description": "Organizations, memberships, and tenant-scoped RLS policies",
    "category": "Auth",
    "version": "1.0.0",
    "tags": [
      "multi-tenant",
      "organizations",
      "rls",
      "saas"
    ],
    "dependencies": {
      "required": [
        "auth",
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/tenant.sql",
        "content": "-- Multi-tenant schema with organization-scoped RLS.\n-- Add tenant_id to your tables and reuse the membership checks below.\n\ncreate table public.organizations (\n  id uuid primary key default gen_random_uuid(),\n  name text not null,\n  slug text not null unique,\n  created_at timestamptz default now()\n);\n\ncreate table public.organization_members (\n  id bigint generated by default as identity primary key,\n  organization_id uuid references public.organizations on delete cascade not null,\n  user_id uuid references auth.users on delete cascade not null,\n  role text not null default 'member' check (role in ('owner', 'admin', 'member')),\n  created_at timestamptz default now(),\n  unique (organization_id, user_id)\n);\n\ncreate or replace function public.current_organization_ids()\nreturns setof uuid\nlanguage sql\nstable\nsecurity definer\nset search_path = ''\nas $$\n  select organization_id\n  from public.organization_members\n  where user_id = auth.uid();\n$$;\n\nalter table public.organizations enable row level security;\nalter table public.organization_members enable row level security;\n\ncreate policy \"Members can read their organizations\"\non public.organizations\nfor select\nto authenticated\nusing (id in (select public.current_organization_ids()));\n\ncreate policy \"Members can read organization memberships\"\non public.organization_members\nfor select\nto authenticated\nusing (organization_id in (select public.current_organization_ids()));\n\ncreate policy \"Users can read their own memberships\"\non public.organization_members\nfor select\nto authenticated\nusing (user_id = auth.uid());\n\n-- Example tenant-scoped table\ncreate table public.projects (\n  id uuid primary key default gen_random_uuid(),\n  organization_id uuid references public.organizations on delete cascade not null,\n  name text not null,\n  created_at timestamptz default now()\n);\n\nalter table public.projects enable row level security;\n\ncreate policy \"Members can read projects in their organizations\"\non public.projects\nfor select\nto authenticated\nusing (organization_id in (select public.current_organization_ids()));\n\ncreate policy \"Members can insert projects in their organizations\"\non public.projects\nfor insert\nto authenticated\nwith check (organization_id in (select public.current_organization_ids()));\n\ncreate policy \"Members can update projects in their organizations\"\non public.projects\nfor update\nto authenticated\nusing (organization_id in (select public.current_organization_ids()));\n\ncreate policy \"Members can delete projects in their organizations\"\non public.projects\nfor delete\nto authenticated\nusing (organization_id in (select public.current_organization_ids()));\n"
      }
    ],
    "readme": "# Multi-tenant template\n\nTenant-scoped data model with organization membership and RLS isolation per tenant.\n\n## Includes\n\n- Tenant and membership tables\n- RLS policies keyed on tenant identifiers\n\n## Dependencies\n\nRequires **database** and **auth**."
  },
  {
    "id": "auth-email",
    "name": "Email Authentication",
    "description": "Email/password authentication with user profiles and RLS",
    "category": "Auth",
    "version": "1.0.0",
    "tags": [
      "auth",
      "profiles",
      "rls",
      "email"
    ],
    "dependencies": {
      "required": [
        "auth",
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/auth.sql",
        "content": "create table if not exists public.profiles (\n  id uuid primary key references auth.users(id) on delete cascade,\n  email text,\n  full_name text,\n  created_at timestamptz default now()\n);\n\nalter table public.profiles enable row level security;\n\ncreate policy \"Users can read their own profile\"\non public.profiles for select\nusing (auth.uid() = id);\n\ncreate policy \"Users can update their own profile\"\non public.profiles for update\nusing (auth.uid() = id);\n"
      }
    ]
  },
  {
    "id": "storage-avatars",
    "name": "Avatar Uploads",
    "description": "Public avatar bucket with user-owned upload policies",
    "category": "Storage",
    "version": "1.0.0",
    "tags": [
      "storage",
      "avatars",
      "images"
    ],
    "dependencies": {
      "required": [
        "storage",
        "auth"
      ],
      "optional": [
        "auth-email"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/storage.sql",
        "content": "insert into storage.buckets (id, name, public)\nvalues ('avatars', 'avatars', true)\non conflict (id) do nothing;\n\ncreate policy \"Avatar images are publicly accessible\"\non storage.objects for select\nusing (bucket_id = 'avatars');\n\ncreate policy \"Users can upload their own avatar\"\non storage.objects for insert\nwith check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);\n"
      }
    ]
  },
  {
    "id": "realtime-comments",
    "name": "Realtime Comments",
    "description": "Comments table configured for realtime collaborative feeds",
    "category": "Realtime",
    "version": "1.0.0",
    "tags": [
      "realtime",
      "comments",
      "collaboration"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/realtime.sql",
        "content": "create table if not exists public.comments (\n  id bigint generated by default as identity primary key,\n  body text not null,\n  author_id uuid references auth.users(id),\n  created_at timestamptz default now()\n);\n\nalter publication supabase_realtime add table public.comments;\n"
      }
    ]
  },
  {
    "id": "functions-stripe-webhook",
    "name": "Stripe Webhook",
    "description": "Edge Function scaffold for receiving Stripe webhooks",
    "category": "Ecommerce",
    "version": "1.0.0",
    "tags": [
      "stripe",
      "webhook",
      "functions"
    ],
    "dependencies": {
      "required": [
        "functions",
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/stripe-webhook/index.ts",
        "content": "Deno.serve(async (req) => {\n  const signature = req.headers.get('stripe-signature')\n\n  if (!signature) {\n    return new Response('Missing signature', { status: 400 })\n  }\n\n  return Response.json({ received: true })\n})\n"
      },
      {
        "path": "supabase/schemas/billing.sql",
        "content": "create table if not exists public.billing_events (\n  id text primary key,\n  event_type text not null,\n  payload jsonb not null,\n  created_at timestamptz default now()\n);\n"
      }
    ]
  },
  {
    "id": "analytics-events",
    "name": "Product Analytics",
    "description": "Event table and indexes for lightweight product analytics",
    "category": "Analytics",
    "version": "1.0.0",
    "tags": [
      "analytics",
      "events",
      "database"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/analytics.sql",
        "content": "create table if not exists public.analytics_events (\n  id bigint generated by default as identity primary key,\n  user_id uuid references auth.users(id),\n  event_name text not null,\n  properties jsonb not null default '{}',\n  created_at timestamptz default now()\n);\n\ncreate index if not exists analytics_events_event_name_idx\non public.analytics_events (event_name);\n"
      }
    ]
  },
  {
    "id": "observability-logs",
    "name": "App Logs",
    "description": "Structured application logs table for debugging and audits",
    "category": "Observability",
    "version": "1.0.0",
    "tags": [
      "logs",
      "observability",
      "debugging"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/observability.sql",
        "content": "create table if not exists public.app_logs (\n  id bigint generated by default as identity primary key,\n  level text not null,\n  message text not null,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now()\n);\n"
      }
    ]
  },
  {
    "id": "queues",
    "name": "Queues (pgmq)",
    "description": "pgmq extension with a default job queue for background processing",
    "category": "Database",
    "version": "1.0.0",
    "tags": [
      "queues",
      "pgmq",
      "background-jobs"
    ],
    "dependencies": {
      "required": [
        "database"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/queues.sql",
        "content": "-- Background job queue with pgmq.\n-- See: https://supabase.com/docs/guides/queues\n\ncreate extension if not exists pgmq;\n\nselect pgmq.create('default_jobs');\n"
      }
    ],
    "readme": "# Queues template\n\nBackground job queues using Supabase Queues with worker-friendly schema and policies.\n\n## Includes\n\n- Queue tables and enqueue helpers\n- RLS for secure job submission\n\n## Dependencies\n\nRequires **database** and **functions**."
  },
  {
    "id": "ai-vector-search",
    "name": "Vector Search",
    "description": "pgvector extension with documents table and HNSW index for semantic search",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "ai",
      "pgvector",
      "embeddings",
      "semantic-search"
    ],
    "dependencies": {
      "required": [
        "database",
        "api"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/vector.sql",
        "content": "-- Semantic search with pgvector.\n-- See: https://supabase.com/docs/guides/ai/semantic-search\n\ncreate extension if not exists vector with schema extensions;\n\ncreate table public.documents (\n  id bigint generated always as identity primary key,\n  title text not null,\n  content text not null,\n  embedding extensions.halfvec(1536),\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.documents is 'Content with vector embeddings for semantic search.';\n\ncreate index documents_embedding_idx\non public.documents\nusing hnsw (embedding extensions.halfvec_cosine_ops);\n\nalter table public.documents enable row level security;\n\ncreate policy \"Allow authenticated read access\"\non public.documents\nfor select\nto authenticated\nusing (true);\n\ncreate policy \"Allow authenticated insert access\"\non public.documents\nfor insert\nto authenticated\nwith check (true);\n\ncreate policy \"Allow authenticated update access\"\non public.documents\nfor update\nto authenticated\nusing (true);\n\ncreate or replace function public.match_documents(\n  query_embedding extensions.halfvec(1536),\n  match_count int default 10\n)\nreturns table (\n  id bigint,\n  title text,\n  content text,\n  similarity float\n)\nlanguage sql\nstable\nsecurity invoker\nset search_path = ''\nas $$\n  select\n    documents.id,\n    documents.title,\n    documents.content,\n    1 - (documents.embedding <=> query_embedding) as similarity\n  from public.documents\n  where documents.embedding is not null\n  order by documents.embedding <=> query_embedding\n  limit least(match_count, 100);\n$$;\n"
      }
    ],
    "readme": "# Vector search template\n\nAdds pgvector-backed storage and SQL helpers for similarity search over embeddings.\n\n## Includes\n\n- Vector extension setup and document embedding tables\n- Search functions for nearest-neighbor queries\n\n## Dependencies\n\nRequires **database**. Often combined with **ai-automatic-embeddings** for kept-in-sync vectors."
  },
  {
    "id": "agent",
    "name": "Agent",
    "description": "Agent sessions and memory with vector recall, plus an Edge Function tool endpoint for structured tool calls",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "ai",
      "agents",
      "memory",
      "sessions",
      "pgvector",
      "tools",
      "functions"
    ],
    "dependencies": {
      "required": [
        "database",
        "api",
        "auth",
        "functions"
      ],
      "optional": [
        "ai-vector-search",
        "ai-automatic-embeddings"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/agent-tools/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\n\ntype ToolRequest = {\n  tool: string\n  arguments: Record<string, unknown>\n}\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  let body: ToolRequest\n\n  try {\n    body = await req.json()\n  } catch {\n    return new Response('invalid JSON body', { status: 400 })\n  }\n\n  if (!body.tool || typeof body.tool !== 'string') {\n    return new Response('tool name is required', { status: 400 })\n  }\n\n  const supabase = createClient(\n    Deno.env.get('SUPABASE_URL')!,\n    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n  )\n\n  switch (body.tool) {\n    case 'list_sessions': {\n      const { data, error } = await supabase\n        .from('agent_sessions')\n        .select('id, title, metadata, created_at')\n        .order('created_at', { ascending: false })\n        .limit(20)\n\n      if (error) {\n        return Response.json({ error: error.message }, { status: 500 })\n      }\n\n      return Response.json({ tool: body.tool, result: data })\n    }\n\n    case 'search_memories': {\n      const query = String(body.arguments?.query ?? '')\n\n      const { data, error } = await supabase\n        .from('agent_memories')\n        .select('id, role, content, state, created_at')\n        .ilike('content', `%${query}%`)\n        .limit(10)\n\n      if (error) {\n        return Response.json({ error: error.message }, { status: 500 })\n      }\n\n      return Response.json({ tool: body.tool, result: data })\n    }\n\n    default:\n      return Response.json(\n        {\n          error: `unknown tool: ${body.tool}`,\n          availableTools: ['list_sessions', 'search_memories'],\n        },\n        { status: 400 }\n      )\n  }\n})\n"
      },
      {
        "path": "supabase/schemas/agent.sql",
        "content": "-- Persistent memory store for AI agents.\n-- Pair with ai-vector-search or ai-automatic-embeddings for embedding generation.\n\ncreate extension if not exists vector with schema extensions;\n\ncreate table public.agent_sessions (\n  id uuid primary key default gen_random_uuid(),\n  user_id uuid references auth.users on delete cascade,\n  title text,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.agent_sessions is 'Conversation sessions for an agent or user.';\n\ncreate table public.agent_memories (\n  id uuid primary key default gen_random_uuid(),\n  session_id uuid references public.agent_sessions on delete cascade not null,\n  role text not null check (role in ('user', 'assistant', 'system', 'tool')),\n  content text,\n  state jsonb not null default '{}',\n  embedding extensions.halfvec(1536),\n  created_at timestamptz default now()\n);\n\ncomment on table public.agent_memories is 'Individual messages and tool results within a session.';\n\ncreate index agent_memories_session_id_idx on public.agent_memories (session_id);\n\ncreate index agent_memories_embedding_idx\non public.agent_memories\nusing hnsw (embedding extensions.halfvec_cosine_ops);\n\nalter table public.agent_sessions enable row level security;\nalter table public.agent_memories enable row level security;\n\ncreate policy \"Users can read their own sessions\"\non public.agent_sessions\nfor select\nto authenticated\nusing (auth.uid() = user_id);\n\ncreate policy \"Users can insert their own sessions\"\non public.agent_sessions\nfor insert\nto authenticated\nwith check (auth.uid() = user_id);\n\ncreate policy \"Users can update their own sessions\"\non public.agent_sessions\nfor update\nto authenticated\nusing (auth.uid() = user_id);\n\ncreate policy \"Users can delete their own sessions\"\non public.agent_sessions\nfor delete\nto authenticated\nusing (auth.uid() = user_id);\n\ncreate policy \"Users can read memories in their sessions\"\non public.agent_memories\nfor select\nto authenticated\nusing (\n  exists (\n    select 1\n    from public.agent_sessions\n    where agent_sessions.id = agent_memories.session_id\n      and agent_sessions.user_id = auth.uid()\n  )\n);\n\ncreate policy \"Users can insert memories in their sessions\"\non public.agent_memories\nfor insert\nto authenticated\nwith check (\n  exists (\n    select 1\n    from public.agent_sessions\n    where agent_sessions.id = agent_memories.session_id\n      and agent_sessions.user_id = auth.uid()\n  )\n);\n\ncreate or replace function public.match_agent_memories(\n  session_id uuid,\n  query_embedding extensions.halfvec(1536),\n  match_count int default 8\n)\nreturns table (\n  id uuid,\n  role text,\n  content text,\n  state jsonb,\n  similarity float\n)\nlanguage sql\nstable\nsecurity invoker\nset search_path = ''\nas $$\n  select\n    agent_memories.id,\n    agent_memories.role,\n    agent_memories.content,\n    agent_memories.state,\n    1 - (agent_memories.embedding <=> query_embedding) as similarity\n  from public.agent_memories\n  where agent_memories.session_id = match_agent_memories.session_id\n    and agent_memories.embedding is not null\n    and exists (\n      select 1\n      from public.agent_sessions\n      where agent_sessions.id = agent_memories.session_id\n        and agent_sessions.user_id = auth.uid()\n    )\n  order by agent_memories.embedding <=> query_embedding\n  limit least(match_count, 50);\n$$;\n"
      }
    ],
    "readme": "## Overview\n\nBuild persistent AI agents on Supabase with session history, long-term memory, and a typed tool-calling endpoint. This template adds the schema and Edge Function plumbing for multi-turn sessions, vector-backed memory, and an `agent-tools` handler you can call from chat UIs, background workers, or MCP-style orchestrators.\n\n## What's included\n\n| Asset         | Path                                      | Purpose                                    |\n| ------------- | ----------------------------------------- | ------------------------------------------ |\n| Schema        | `supabase/schemas/agent.sql`              | Sessions, messages, memory tables, and RLS |\n| Edge Function | `supabase/functions/agent-tools/index.ts` | HTTP handler for tool invocation           |\n\n### Sessions and messages\n\nEach session belongs to a user (via `auth.uid()`). Messages are appended in order so you can replay conversation history or stream partial updates from the client.\n\n### Memory and recall\n\nMemory rows can store arbitrary JSON payloads. When combined with **ai-vector-search** or **ai-automatic-embeddings**, embeddings enable similarity search over past context before the model runs.\n\n### Tool endpoint\n\nThe `agent-tools` function validates requests, runs registered tools, and returns structured results your agent loop can feed back into the model.\n\n```ts\n// Example: call the tool endpoint from your app\nconst { data, error } = await supabase.functions.invoke('agent-tools', {\n  body: { sessionId, tool: 'search_docs', input: { query: 'RLS policies' } },\n})\n```\n\n## Dependencies\n\n**Required**\n\n- `database` — base Supabase project config\n- `api` — REST/GraphQL surface for client access\n- `auth` — user-scoped sessions and RLS\n- `functions` — Edge Functions runtime\n\n**Optional**\n\n- `ai-vector-search` — pgvector similarity over memory embeddings\n- `ai-automatic-embeddings` — keep embeddings in sync via triggers\n\n## Getting started\n\n1. Add this template (and its required dependencies) to your composition.\n2. Run `supabase db reset` or apply migrations locally to create agent tables.\n3. Deploy Edge Functions: `supabase functions deploy agent-tools`.\n4. From your app, create a session row, append messages, and invoke `agent-tools` as tools are selected by your model.\n\nFor production, review RLS policies in `agent.sql` and restrict the service role to server-side agent loops only."
  },
  {
    "id": "ai-automatic-embeddings",
    "name": "Automatic Embeddings",
    "description": "Queue, triggers, and Edge Function scaffold to generate and sync embeddings automatically",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "ai",
      "embeddings",
      "pgmq",
      "pg_cron",
      "openai"
    ],
    "dependencies": {
      "required": [
        "database",
        "functions",
        "ai-vector-search"
      ],
      "optional": [
        "queues"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/embed/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'\nimport OpenAI from 'jsr:@openai/openai@4'\nimport { z } from 'npm:zod@3'\n\nconst openai = new OpenAI({\n  apiKey: Deno.env.get('OPENAI_API_KEY'),\n})\n\nconst sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)\n\nconst jobSchema = z.object({\n  jobId: z.number(),\n  id: z.union([z.number(), z.string()]),\n  schema: z.string(),\n  table: z.string(),\n  contentFunction: z.string(),\n  embeddingColumn: z.string(),\n})\n\ntype Job = z.infer<typeof jobSchema>\n\nconst QUEUE_NAME = 'embedding_jobs'\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = z.array(jobSchema).safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, {\n      status: 400,\n    })\n  }\n\n  const completedJobs: Job[] = []\n  const failedJobs: Array<Job & { error: string }> = []\n\n  for (const job of parseResult.data) {\n    try {\n      await processJob(job)\n      completedJobs.push(job)\n    } catch (error) {\n      failedJobs.push({\n        ...job,\n        error: error instanceof Error ? error.message : JSON.stringify(error),\n      })\n    }\n  }\n\n  return Response.json({ completedJobs, failedJobs })\n})\n\nasync function processJob(job: Job) {\n  const { jobId, id, schema, table, contentFunction, embeddingColumn } = job\n\n  const [row] = await sql`\n    select id, ${sql(contentFunction)}(t) as content\n    from ${sql(schema)}.${sql(table)} t\n    where id = ${id}\n  `\n\n  if (!row || typeof row.content !== 'string') {\n    throw new Error(`row not found or invalid content: ${schema}.${table}/${id}`)\n  }\n\n  const response = await openai.embeddings.create({\n    model: 'text-embedding-3-small',\n    input: row.content,\n  })\n\n  const embedding = response.data[0]?.embedding\n\n  if (!embedding) {\n    throw new Error('failed to generate embedding')\n  }\n\n  await sql`\n    update ${sql(schema)}.${sql(table)}\n    set ${sql(embeddingColumn)} = ${JSON.stringify(embedding)}\n    where id = ${id}\n  `\n\n  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n}\n"
      },
      {
        "path": "supabase/schemas/embeddings.sql",
        "content": "-- Automatic embedding generation pipeline.\n-- See: https://supabase.com/docs/guides/ai/automatic-embeddings\n\ncreate extension if not exists vector with schema extensions;\ncreate extension if not exists pgmq;\ncreate extension if not exists pg_net with schema extensions;\ncreate extension if not exists pg_cron;\ncreate extension if not exists hstore with schema extensions;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ncreate or replace function util.clear_column()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  clear_column text := tg_argv[0];\nbegin\n  new := new #= hstore(clear_column, null);\n  return new;\nend;\n$$;\n\nselect pgmq.create('embedding_jobs');\n\ncreate or replace function util.queue_embeddings()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  content_function text := tg_argv[0];\n  embedding_column text := tg_argv[1];\nbegin\n  perform pgmq.send(\n    queue_name => 'embedding_jobs',\n    msg => jsonb_build_object(\n      'id', new.id,\n      'schema', tg_table_schema,\n      'table', tg_table_name,\n      'contentFunction', content_function,\n      'embeddingColumn', embedding_column\n    )\n  );\n\n  return new;\nend;\n$$;\n\ncreate or replace function util.process_embeddings(\n  batch_size int default 10,\n  max_requests int default 10,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  job_batches jsonb[];\n  batch jsonb;\nbegin\n  with\n    numbered_jobs as (\n      select\n        message || jsonb_build_object('jobId', msg_id) as job_info,\n        (row_number() over (order by 1) - 1) / batch_size as batch_num\n      from pgmq.read(\n        queue_name => 'embedding_jobs',\n        vt => timeout_milliseconds / 1000,\n        qty => max_requests * batch_size\n      )\n    ),\n    batched_jobs as (\n      select jsonb_agg(job_info) as batch_array, batch_num\n      from numbered_jobs\n      group by batch_num\n    )\n  select coalesce(array_agg(batch_array), array[]::jsonb[])\n  into job_batches\n  from batched_jobs;\n\n  foreach batch in array job_batches loop\n    perform util.invoke_edge_function(\n      name => 'embed',\n      body => batch,\n      timeout_milliseconds => timeout_milliseconds\n    );\n  end loop;\nend;\n$$;\n\nselect cron.schedule(\n  'process-embeddings',\n  '10 seconds',\n  $$ select util.process_embeddings(); $$\n);\n\n-- Example: wire up the documents table from ai-vector-search\ncreate or replace function public.embedding_input(doc public.documents)\nreturns text\nlanguage plpgsql\nimmutable\nas $$\nbegin\n  return doc.title || E'\\n\\n' || doc.content;\nend;\n$$;\n\ncreate trigger embed_documents_on_insert\nafter insert on public.documents\nfor each row\nexecute function util.queue_embeddings('embedding_input', 'embedding');\n\ncreate trigger clear_document_embedding_on_update\nbefore update of title, content on public.documents\nfor each row\nexecute function util.clear_column('embedding');\n\ncreate trigger embed_documents_on_update\nafter update of title, content on public.documents\nfor each row\nexecute function util.queue_embeddings('embedding_input', 'embedding');\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- Local development project URL for util.project_url()\nselect vault.create_secret('http://api.supabase.internal:8000', 'project_url');\n"
      }
    ],
    "readme": "# Automatic embeddings template\n\nKeeps document embeddings in sync using database triggers and an Edge Function embed worker.\n\n## Includes\n\n- Embeddings schema and queue tables\n- `embed` Edge Function for batch embedding\n- Seed data for local development\n\n## Dependencies\n\nRequires **database**, **api**, and **functions**. Works best with **ai-vector-search** for similarity queries."
  },
  {
    "id": "mcp-server",
    "name": "MCP Server",
    "description": "Cursor MCP configuration for local Supabase MCP and hosted project access",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "mcp",
      "ai",
      "cursor",
      "tools"
    ],
    "dependencies": {
      "required": [
        "database",
        "api"
      ]
    },
    "files": [
      {
        "path": "supabase/integrations/cursor-mcp.json",
        "content": "{\n  \"mcpServers\": {\n    \"supabase-local\": {\n      \"url\": \"http://127.0.0.1:54321/mcp\"\n    },\n    \"supabase\": {\n      \"url\": \"https://mcp.supabase.com/mcp\"\n    }\n  }\n}\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- MCP setup notes:\n-- 1. Copy supabase/integrations/cursor-mcp.json to .cursor/mcp.json in your project root.\n-- 2. Local MCP is available at http://127.0.0.1:54321/mcp when running `supabase start`.\n-- 3. Hosted MCP: https://supabase.com/docs/guides/ai-tools/mcp\n"
      }
    ],
    "readme": "# MCP server template\n\nExposes Supabase project capabilities through a Model Context Protocol server integration.\n\n## Includes\n\n- Cursor MCP integration config\n- Seed data for local MCP tooling\n\n## Dependencies\n\nRequires **database**, **api**, and **auth**."
  }
]

export const templateIndex = createTemplateIndex(templates)

export const categories: CategoriesManifest = {
  "categories": [
    "Core",
    "Auth",
    "Security",
    "API",
    "Storage",
    "Realtime",
    "Database",
    "AI",
    "Ecommerce",
    "Analytics",
    "Observability"
  ],
  "featuredTemplates": [
    "database",
    "functions",
    "storage",
    "auth",
    "api",
    "graphql"
  ]
}
