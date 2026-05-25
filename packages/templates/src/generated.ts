import { createTemplateIndex, type ProjectComposerTemplate } from './schema'

export const projectComposerTemplates: ProjectComposerTemplate[] = [
  {
    "id": "database",
    "name": "Database",
    "description": "PostgreSQL database with schemas and seed support",
    "category": "Core",
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
    "tags": [
      "storage",
      "files",
      "s3"
    ],
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
    "tags": [
      "auth",
      "users",
      "sessions"
    ],
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
    "id": "auth-email",
    "name": "Email Authentication",
    "description": "Email/password authentication with user profiles and RLS",
    "category": "Auth",
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
  }
]

export const projectComposerTemplateIndex = createTemplateIndex(projectComposerTemplates)
