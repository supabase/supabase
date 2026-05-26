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
    "id": "multi-tenant-rbac",
    "name": "Multi-tenant RBAC",
    "description": "Organizations, membership roles, permissions, and tenant-scoped RLS policies",
    "category": "Auth",
    "version": "1.0.0",
    "tags": [
      "multi-tenant",
      "organizations",
      "rbac",
      "permissions",
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
        "path": "supabase/schemas/authorization.sql",
        "content": "-- Multi-tenant role-based access control.\n-- Add organization_id to tenant-owned tables and use authorize() in RLS policies.\n\ncreate type public.app_role as enum ('owner', 'admin', 'member');\n\ncreate type public.app_permission as enum (\n  'organizations.read',\n  'organizations.update',\n  'organizations.delete',\n  'members.read',\n  'members.invite',\n  'members.update',\n  'members.remove',\n  'projects.read',\n  'projects.create',\n  'projects.update',\n  'projects.delete'\n);\n\ncreate table public.organizations (\n  id uuid primary key default gen_random_uuid(),\n  name text not null,\n  slug text not null unique,\n  created_at timestamptz default now()\n);\n\ncreate table public.organization_members (\n  id bigint generated by default as identity primary key,\n  organization_id uuid references public.organizations on delete cascade not null,\n  user_id uuid references auth.users on delete cascade not null,\n  role public.app_role not null default 'member',\n  created_at timestamptz default now(),\n  unique (organization_id, user_id)\n);\n\ncomment on table public.organization_members is\n  'Organization membership and role assignment for each user.';\n\ncreate index organization_members_user_id_idx\non public.organization_members (user_id);\n\ncreate table public.role_permissions (\n  id bigint generated by default as identity primary key,\n  role public.app_role not null,\n  permission public.app_permission not null,\n  unique (role, permission)\n);\n\ncomment on table public.role_permissions is\n  'Permissions granted to each organization role.';\n\ncreate or replace function public.current_organization_ids()\nreturns setof uuid\nlanguage sql\nstable\nsecurity definer\nset search_path = ''\nas $$\n  select organization_id\n  from public.organization_members\n  where user_id = auth.uid();\n$$;\n\ncreate or replace function public.authorize(\n  requested_organization_id uuid,\n  requested_permission public.app_permission\n)\nreturns boolean\nlanguage sql\nstable\nsecurity definer\nset search_path = ''\nas $$\n  select exists (\n    select 1\n    from public.organization_members as organization_members\n    join public.role_permissions as role_permissions\n      on role_permissions.role = organization_members.role\n    where organization_members.organization_id = requested_organization_id\n      and organization_members.user_id = auth.uid()\n      and role_permissions.permission = requested_permission\n  );\n$$;\n\ncreate or replace function public.create_organization(\n  organization_name text,\n  organization_slug text\n)\nreturns public.organizations\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  new_organization public.organizations;\nbegin\n  if auth.uid() is null then\n    raise exception 'Authentication is required';\n  end if;\n\n  insert into public.organizations (name, slug)\n  values (organization_name, organization_slug)\n  returning * into new_organization;\n\n  insert into public.organization_members (organization_id, user_id, role)\n  values (new_organization.id, auth.uid(), 'owner');\n\n  return new_organization;\nend;\n$$;\n\nrevoke execute on function public.create_organization(text, text)\nfrom public;\n\ngrant execute on function public.create_organization(text, text)\nto authenticated;\n\nalter table public.organizations enable row level security;\nalter table public.organization_members enable row level security;\nalter table public.role_permissions enable row level security;\n\ncreate policy \"Members can read organizations\"\non public.organizations\nfor select\nto authenticated\nusing ((select public.authorize(id, 'organizations.read')));\n\ncreate policy \"Authorized members can update organizations\"\non public.organizations\nfor update\nto authenticated\nusing ((select public.authorize(id, 'organizations.update')))\nwith check ((select public.authorize(id, 'organizations.update')));\n\ncreate policy \"Authorized members can delete organizations\"\non public.organizations\nfor delete\nto authenticated\nusing ((select public.authorize(id, 'organizations.delete')));\n\ncreate policy \"Members can read organization memberships\"\non public.organization_members\nfor select\nto authenticated\nusing (\n  user_id = auth.uid()\n  or (select public.authorize(organization_id, 'members.read'))\n);\n\ncreate policy \"Authorized members can invite organization members\"\non public.organization_members\nfor insert\nto authenticated\nwith check (\n  (\n    role = 'member'\n    and (select public.authorize(organization_id, 'members.invite'))\n  )\n  or (select public.authorize(organization_id, 'members.update'))\n);\n\ncreate policy \"Authorized members can update organization members\"\non public.organization_members\nfor update\nto authenticated\nusing ((select public.authorize(organization_id, 'members.update')))\nwith check ((select public.authorize(organization_id, 'members.update')));\n\ncreate policy \"Authorized members can remove organization members\"\non public.organization_members\nfor delete\nto authenticated\nusing ((select public.authorize(organization_id, 'members.remove')));\n\ncreate policy \"Authenticated users can read role permissions\"\non public.role_permissions\nfor select\nto authenticated\nusing (true);\n\n-- Example tenant-scoped table.\ncreate table public.projects (\n  id uuid primary key default gen_random_uuid(),\n  organization_id uuid references public.organizations on delete cascade not null,\n  name text not null,\n  created_at timestamptz default now()\n);\n\ncreate index projects_organization_id_idx\non public.projects (organization_id);\n\nalter table public.projects enable row level security;\n\ncreate policy \"Authorized members can read projects\"\non public.projects\nfor select\nto authenticated\nusing ((select public.authorize(organization_id, 'projects.read')));\n\ncreate policy \"Authorized members can create projects\"\non public.projects\nfor insert\nto authenticated\nwith check ((select public.authorize(organization_id, 'projects.create')));\n\ncreate policy \"Authorized members can update projects\"\non public.projects\nfor update\nto authenticated\nusing ((select public.authorize(organization_id, 'projects.update')))\nwith check ((select public.authorize(organization_id, 'projects.update')));\n\ncreate policy \"Authorized members can delete projects\"\non public.projects\nfor delete\nto authenticated\nusing ((select public.authorize(organization_id, 'projects.delete')));\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "insert into public.role_permissions (role, permission)\nvalues\n  ('owner', 'organizations.read'),\n  ('owner', 'organizations.update'),\n  ('owner', 'organizations.delete'),\n  ('owner', 'members.read'),\n  ('owner', 'members.invite'),\n  ('owner', 'members.update'),\n  ('owner', 'members.remove'),\n  ('owner', 'projects.read'),\n  ('owner', 'projects.create'),\n  ('owner', 'projects.update'),\n  ('owner', 'projects.delete'),\n  ('admin', 'organizations.read'),\n  ('admin', 'organizations.update'),\n  ('admin', 'members.read'),\n  ('admin', 'members.invite'),\n  ('admin', 'projects.read'),\n  ('admin', 'projects.create'),\n  ('admin', 'projects.update'),\n  ('admin', 'projects.delete'),\n  ('member', 'organizations.read'),\n  ('member', 'members.read'),\n  ('member', 'projects.read'),\n  ('member', 'projects.create'),\n  ('member', 'projects.update')\non conflict do nothing;\n"
      }
    ],
    "readme": "# Multi-tenant RBAC template\n\nOrganization-scoped authorization for SaaS applications. Membership in an organization assigns a role, roles grant permissions, and RLS policies call `authorize(organization_id, permission)`.\n\n## Includes\n\n- Organizations and organization memberships\n- Organization-scoped roles and permissions\n- `create_organization()` bootstrap helper\n- `authorize()` helper for tenant-aware RLS policies\n- Example `projects` table with scalable tenant policies\n\n## Dependencies\n\nRequires **database** and **auth**."
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
    "id": "storage-pdf-thumbnails",
    "name": "PDF Thumbnails",
    "description": "Generate thumbnail images for uploaded PDFs via storage trigger and an Edge Function",
    "category": "Storage",
    "version": "1.0.0",
    "tags": [
      "storage",
      "pdf",
      "thumbnails",
      "media",
      "triggers",
      "functions"
    ],
    "dependencies": {
      "required": [
        "storage",
        "database",
        "functions"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/pdf-thumbnail/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { createCanvas } from 'npm:@napi-rs/canvas@0.1.55'\nimport * as pdfjs from 'npm:pdfjs-dist@4.7.76/legacy/build/pdf.mjs'\nimport { z } from 'npm:zod@3'\n\nconst SOURCE_BUCKET = 'pdfs'\nconst TARGET_BUCKET = 'pdf-thumbnails'\nconst RENDER_SCALE = 1.5\n\nconst requestSchema = z.object({\n  objectId: z.string().uuid(),\n  bucketId: z.string(),\n  objectPath: z.string(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { objectId, bucketId, objectPath } = parseResult.data\n\n  if (bucketId !== SOURCE_BUCKET) {\n    return Response.json({ skipped: true, reason: `bucket ${bucketId} is not handled` })\n  }\n\n  try {\n    const thumbnailPath = await renderThumbnail(objectId, objectPath)\n\n    await supabase\n      .from('pdf_thumbnails')\n      .update({\n        thumbnail_path: thumbnailPath,\n        status: 'ready',\n        error: null,\n        updated_at: new Date().toISOString(),\n      })\n      .eq('object_id', objectId)\n\n    return Response.json({ objectId, thumbnailPath })\n  } catch (error) {\n    const message = error instanceof Error ? error.message : String(error)\n\n    await supabase\n      .from('pdf_thumbnails')\n      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })\n      .eq('object_id', objectId)\n\n    return Response.json({ objectId, error: message }, { status: 500 })\n  }\n})\n\nasync function renderThumbnail(objectId: string, objectPath: string): Promise<string> {\n  const { data: download, error: downloadError } = await supabase.storage\n    .from(SOURCE_BUCKET)\n    .download(objectPath)\n\n  if (downloadError || !download) {\n    throw new Error(`failed to download PDF: ${downloadError?.message ?? 'unknown error'}`)\n  }\n\n  const pdfData = new Uint8Array(await download.arrayBuffer())\n  const document = await pdfjs.getDocument({ data: pdfData, disableFontFace: true }).promise\n  const page = await document.getPage(1)\n  const viewport = page.getViewport({ scale: RENDER_SCALE })\n\n  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))\n  const context = canvas.getContext('2d')\n\n  await page.render({\n    // @ts-expect-error — @napi-rs/canvas context is compatible at runtime\n    canvasContext: context,\n    viewport,\n  }).promise\n\n  const png = await canvas.encode('png')\n  const thumbnailPath = `${objectId}.png`\n\n  const { error: uploadError } = await supabase.storage\n    .from(TARGET_BUCKET)\n    .upload(thumbnailPath, png, { contentType: 'image/png', upsert: true })\n\n  if (uploadError) {\n    throw new Error(`failed to upload thumbnail: ${uploadError.message}`)\n  }\n\n  return thumbnailPath\n}\n"
      },
      {
        "path": "supabase/schemas/pdf-thumbnails.sql",
        "content": "-- PDF thumbnail pipeline.\n-- Uploads to the `pdfs` bucket trigger an Edge Function that renders the first\n-- page and uploads it to the public `pdf-thumbnails` bucket.\n\ncreate extension if not exists pg_net with schema extensions;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ninsert into storage.buckets (id, name, public)\nvalues\n  ('pdfs', 'pdfs', false),\n  ('pdf-thumbnails', 'pdf-thumbnails', true)\non conflict (id) do nothing;\n\ncreate table if not exists public.pdf_thumbnails (\n  id uuid primary key default gen_random_uuid(),\n  object_id uuid not null unique references storage.objects(id) on delete cascade,\n  bucket_id text not null,\n  object_path text not null,\n  thumbnail_path text,\n  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),\n  error text,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.pdf_thumbnails is 'Status and output path for PDF thumbnail generation jobs.';\n\nalter table public.pdf_thumbnails enable row level security;\n\ncreate policy \"Thumbnail status is readable by anyone\"\non public.pdf_thumbnails for select\nusing (true);\n\ncreate or replace function public.handle_pdf_upload()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  if new.bucket_id <> 'pdfs' then\n    return new;\n  end if;\n\n  insert into public.pdf_thumbnails (object_id, bucket_id, object_path)\n  values (new.id, new.bucket_id, new.name)\n  on conflict (object_id) do update\n    set status = 'pending',\n        error = null,\n        updated_at = now();\n\n  perform util.invoke_edge_function(\n    name => 'pdf-thumbnail',\n    body => jsonb_build_object(\n      'objectId', new.id,\n      'bucketId', new.bucket_id,\n      'objectPath', new.name\n    )\n  );\n\n  return new;\nend;\n$$;\n\ndrop trigger if exists on_pdf_upload on storage.objects;\n\ncreate trigger on_pdf_upload\nafter insert on storage.objects\nfor each row\nexecute function public.handle_pdf_upload();\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- Local development project URL for util.project_url()\nselect vault.create_secret('http://api.supabase.internal:8000', 'project_url');\n"
      }
    ],
    "readme": "# PDF thumbnails template\n\nGenerates a preview image of the first page of every PDF uploaded to the `pdfs` bucket and stores it in the public `pdf-thumbnails` bucket. A row in `public.pdf_thumbnails` tracks status so clients can poll or subscribe over Realtime.\n\n## How it works\n\n1. A user uploads a PDF to the `pdfs` bucket.\n2. A trigger on `storage.objects` inserts a row in `public.pdf_thumbnails` and invokes the `pdf-thumbnail` Edge Function via `pg_net`.\n3. The function downloads the PDF, renders the first page to PNG, and uploads it to `pdf-thumbnails/<object_id>.png`.\n4. The tracking row is updated to `ready` (or `failed` with an error message).\n\n## Includes\n\n- `supabase/schemas/pdf-thumbnails.sql` — buckets, tracking table, RLS, and trigger\n- `supabase/functions/pdf-thumbnail/index.ts` — render-and-upload worker\n- `supabase/seed.sql` — local `project_url` secret used by `pg_net`\n\n## Configuration\n\nThe Edge Function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` which are injected automatically in hosted projects. For local development, run `supabase functions serve pdf-thumbnail --no-verify-jwt` and set the `project_url` secret in `seed.sql` to your local Functions URL.\n\n## Dependencies\n\nRequires **storage**, **database**, and **functions**."
  },
  {
    "id": "storage-image-colors",
    "name": "Image Color Extraction",
    "description": "Extract primary and secondary vibrant colors from uploaded images via storage trigger and an Edge Function",
    "category": "Storage",
    "version": "1.0.0",
    "tags": [
      "storage",
      "images",
      "colors",
      "palette",
      "media",
      "triggers",
      "functions"
    ],
    "dependencies": {
      "required": [
        "storage",
        "database",
        "functions"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/image-colors/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { decode } from 'jsr:@imagescript/imagescript@1.3.0'\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { z } from 'npm:zod@3'\n\nconst SOURCE_BUCKET = 'images'\nconst PALETTE_SIZE = 5\nconst MAX_DIMENSION = 128\n\nconst requestSchema = z.object({\n  objectId: z.string().uuid(),\n  bucketId: z.string(),\n  objectPath: z.string(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { objectId, bucketId, objectPath } = parseResult.data\n\n  if (bucketId !== SOURCE_BUCKET) {\n    return Response.json({ skipped: true, reason: `bucket ${bucketId} is not handled` })\n  }\n\n  try {\n    const palette = await extractPalette(objectPath)\n\n    await supabase\n      .from('image_colors')\n      .update({\n        primary_color: palette[0]?.hex ?? null,\n        secondary_color: palette[1]?.hex ?? null,\n        palette,\n        status: 'ready',\n        error: null,\n        updated_at: new Date().toISOString(),\n      })\n      .eq('object_id', objectId)\n\n    return Response.json({ objectId, palette })\n  } catch (error) {\n    const message = error instanceof Error ? error.message : String(error)\n\n    await supabase\n      .from('image_colors')\n      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })\n      .eq('object_id', objectId)\n\n    return Response.json({ objectId, error: message }, { status: 500 })\n  }\n})\n\ntype Rgb = [number, number, number]\n\ntype PaletteEntry = {\n  hex: string\n  rgb: Rgb\n  population: number\n  vibrancy: number\n}\n\nasync function extractPalette(objectPath: string): Promise<PaletteEntry[]> {\n  const { data: download, error } = await supabase.storage.from(SOURCE_BUCKET).download(objectPath)\n\n  if (error || !download) {\n    throw new Error(`failed to download image: ${error?.message ?? 'unknown error'}`)\n  }\n\n  const bytes = new Uint8Array(await download.arrayBuffer())\n  const image = await decode(bytes)\n\n  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))\n  if (scale < 1) {\n    image.resize(\n      Math.max(1, Math.round(image.width * scale)),\n      Math.max(1, Math.round(image.height * scale))\n    )\n  }\n\n  const pixels: Rgb[] = []\n  const bitmap = image.bitmap\n  for (let i = 0; i < bitmap.length; i += 4) {\n    const alpha = bitmap[i + 3]\n    if (alpha < 128) continue\n    pixels.push([bitmap[i], bitmap[i + 1], bitmap[i + 2]])\n  }\n\n  if (pixels.length === 0) return []\n\n  const buckets = medianCut(pixels, PALETTE_SIZE)\n  return buckets\n    .map(toPaletteEntry)\n    .sort(\n      (a, b) => b.vibrancy * Math.log(b.population + 1) - a.vibrancy * Math.log(a.population + 1)\n    )\n}\n\nfunction medianCut(pixels: Rgb[], depth: number): Rgb[][] {\n  if (pixels.length === 0) return []\n\n  let buckets: Rgb[][] = [pixels]\n  while (buckets.length < depth) {\n    let widest = -1\n    let widestIndex = -1\n    let widestChannel = 0\n\n    buckets.forEach((bucket, index) => {\n      const ranges = channelRanges(bucket)\n      const max = Math.max(...ranges)\n      if (max > widest && bucket.length > 1) {\n        widest = max\n        widestIndex = index\n        widestChannel = ranges.indexOf(max)\n      }\n    })\n\n    if (widestIndex === -1) break\n\n    const target = buckets[widestIndex]\n    target.sort((a, b) => a[widestChannel] - b[widestChannel])\n    const mid = target.length >> 1\n    buckets = [\n      ...buckets.slice(0, widestIndex),\n      target.slice(0, mid),\n      target.slice(mid),\n      ...buckets.slice(widestIndex + 1),\n    ]\n  }\n\n  return buckets\n}\n\nfunction channelRanges(bucket: Rgb[]): [number, number, number] {\n  let rMin = 255,\n    rMax = 0,\n    gMin = 255,\n    gMax = 0,\n    bMin = 255,\n    bMax = 0\n  for (const [r, g, b] of bucket) {\n    if (r < rMin) rMin = r\n    if (r > rMax) rMax = r\n    if (g < gMin) gMin = g\n    if (g > gMax) gMax = g\n    if (b < bMin) bMin = b\n    if (b > bMax) bMax = b\n  }\n  return [rMax - rMin, gMax - gMin, bMax - bMin]\n}\n\nfunction toPaletteEntry(bucket: Rgb[]): PaletteEntry {\n  let r = 0,\n    g = 0,\n    b = 0\n  for (const [pr, pg, pb] of bucket) {\n    r += pr\n    g += pg\n    b += pb\n  }\n  const count = bucket.length || 1\n  const avg: Rgb = [Math.round(r / count), Math.round(g / count), Math.round(b / count)]\n  return {\n    hex: toHex(avg),\n    rgb: avg,\n    population: bucket.length,\n    vibrancy: vibrancy(avg),\n  }\n}\n\nfunction vibrancy([r, g, b]: Rgb): number {\n  const max = Math.max(r, g, b)\n  const min = Math.min(r, g, b)\n  const lightness = (max + min) / 510\n  const saturation = max === 0 ? 0 : (max - min) / max\n  return saturation * (1 - Math.abs(lightness - 0.55))\n}\n\nfunction toHex([r, g, b]: Rgb): string {\n  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`\n}\n"
      },
      {
        "path": "supabase/schemas/image-colors.sql",
        "content": "-- Color palette pipeline for image uploads.\n-- Uploads to the `images` bucket trigger an Edge Function that extracts the\n-- dominant colors and stores them for client-side use (tints, gradients, etc.).\n\ncreate extension if not exists pg_net with schema extensions;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ninsert into storage.buckets (id, name, public)\nvalues ('images', 'images', true)\non conflict (id) do nothing;\n\ncreate table if not exists public.image_colors (\n  id uuid primary key default gen_random_uuid(),\n  object_id uuid not null unique references storage.objects(id) on delete cascade,\n  bucket_id text not null,\n  object_path text not null,\n  primary_color text,\n  secondary_color text,\n  palette jsonb not null default '[]'::jsonb,\n  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),\n  error text,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.image_colors is 'Dominant colors extracted from images in the `images` bucket. Colors are stored as #rrggbb hex strings.';\n\nalter table public.image_colors enable row level security;\n\ncreate policy \"Image colors are readable by anyone\"\non public.image_colors for select\nusing (true);\n\ncreate or replace function public.handle_image_upload_for_colors()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  if new.bucket_id <> 'images' then\n    return new;\n  end if;\n\n  insert into public.image_colors (object_id, bucket_id, object_path)\n  values (new.id, new.bucket_id, new.name)\n  on conflict (object_id) do update\n    set status = 'pending',\n        error = null,\n        updated_at = now();\n\n  perform util.invoke_edge_function(\n    name => 'image-colors',\n    body => jsonb_build_object(\n      'objectId', new.id,\n      'bucketId', new.bucket_id,\n      'objectPath', new.name\n    )\n  );\n\n  return new;\nend;\n$$;\n\ndrop trigger if exists on_image_upload_colors on storage.objects;\n\ncreate trigger on_image_upload_colors\nafter insert on storage.objects\nfor each row\nexecute function public.handle_image_upload_for_colors();\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- Local development project URL for util.project_url()\nselect vault.create_secret('http://api.supabase.internal:8000', 'project_url');\n"
      }
    ],
    "readme": "# Image color extraction template\n\nExtracts a dominant color palette from every image uploaded to the `images` bucket. The primary and secondary colors are stored in `public.image_colors` so the client can tint UI (placeholders, gradients, hero backgrounds) without shipping the full image first.\n\n## How it works\n\n1. A user uploads an image to the `images` bucket.\n2. A trigger on `storage.objects` inserts a row in `public.image_colors` and invokes the `image-colors` Edge Function via `pg_net`.\n3. The function downloads the image, runs a simple color quantization, and updates the row with the top colors and a JSON palette.\n\nThe implementation uses median-cut quantization to stay dependency-light and Edge Runtime friendly. Swap it for `node-vibrant` or any other algorithm if you need more nuanced palettes.\n\n## Includes\n\n- `supabase/schemas/image-colors.sql` — bucket, tracking table, RLS, and trigger\n- `supabase/functions/image-colors/index.ts` — palette extraction worker\n- `supabase/seed.sql` — local `project_url` secret used by `pg_net`\n\n## Dependencies\n\nRequires **storage**, **database**, and **functions**. Pairs well with **storage-image-blurhash** for low-bandwidth image placeholders."
  },
  {
    "id": "storage-image-blurhash",
    "name": "Image Blurhash",
    "description": "Compute blurhash placeholders for uploaded images via storage trigger and an Edge Function",
    "category": "Storage",
    "version": "1.0.0",
    "tags": [
      "storage",
      "images",
      "blurhash",
      "media",
      "triggers",
      "functions"
    ],
    "dependencies": {
      "required": [
        "storage",
        "database",
        "functions"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/image-blurhash/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { decode } from 'jsr:@imagescript/imagescript@1.3.0'\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { encode as encodeBlurhash } from 'npm:blurhash@2.0.5'\nimport { z } from 'npm:zod@3'\n\nconst SOURCE_BUCKET = 'images'\nconst COMPONENT_X = 4\nconst COMPONENT_Y = 3\nconst MAX_DIMENSION = 64\n\nconst requestSchema = z.object({\n  objectId: z.string().uuid(),\n  bucketId: z.string(),\n  objectPath: z.string(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { objectId, bucketId, objectPath } = parseResult.data\n\n  if (bucketId !== SOURCE_BUCKET) {\n    return Response.json({ skipped: true, reason: `bucket ${bucketId} is not handled` })\n  }\n\n  try {\n    const result = await computeBlurhash(objectPath)\n\n    await supabase\n      .from('image_blurhashes')\n      .update({\n        blurhash: result.blurhash,\n        width: result.width,\n        height: result.height,\n        status: 'ready',\n        error: null,\n        updated_at: new Date().toISOString(),\n      })\n      .eq('object_id', objectId)\n\n    return Response.json({ objectId, ...result })\n  } catch (error) {\n    const message = error instanceof Error ? error.message : String(error)\n\n    await supabase\n      .from('image_blurhashes')\n      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })\n      .eq('object_id', objectId)\n\n    return Response.json({ objectId, error: message }, { status: 500 })\n  }\n})\n\nasync function computeBlurhash(objectPath: string) {\n  const { data: download, error } = await supabase.storage.from(SOURCE_BUCKET).download(objectPath)\n\n  if (error || !download) {\n    throw new Error(`failed to download image: ${error?.message ?? 'unknown error'}`)\n  }\n\n  const bytes = new Uint8Array(await download.arrayBuffer())\n  const image = await decode(bytes)\n  const fullWidth = image.width\n  const fullHeight = image.height\n\n  const scale = Math.min(1, MAX_DIMENSION / Math.max(fullWidth, fullHeight))\n  const targetWidth = Math.max(1, Math.round(fullWidth * scale))\n  const targetHeight = Math.max(1, Math.round(fullHeight * scale))\n\n  if (scale < 1) {\n    image.resize(targetWidth, targetHeight)\n  }\n\n  const pixels = new Uint8ClampedArray(image.bitmap)\n  const blurhash = encodeBlurhash(pixels, image.width, image.height, COMPONENT_X, COMPONENT_Y)\n\n  return { blurhash, width: fullWidth, height: fullHeight }\n}\n"
      },
      {
        "path": "supabase/schemas/image-blurhash.sql",
        "content": "-- Blurhash pipeline for image uploads.\n-- Uploads to the `images` bucket trigger an Edge Function that computes a\n-- blurhash string for client-side placeholders.\n\ncreate extension if not exists pg_net with schema extensions;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ninsert into storage.buckets (id, name, public)\nvalues ('images', 'images', true)\non conflict (id) do nothing;\n\ncreate table if not exists public.image_blurhashes (\n  id uuid primary key default gen_random_uuid(),\n  object_id uuid not null unique references storage.objects(id) on delete cascade,\n  bucket_id text not null,\n  object_path text not null,\n  blurhash text,\n  width int,\n  height int,\n  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),\n  error text,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.image_blurhashes is 'Computed blurhash placeholders for stored images.';\n\nalter table public.image_blurhashes enable row level security;\n\ncreate policy \"Blurhashes are readable by anyone\"\non public.image_blurhashes for select\nusing (true);\n\ncreate or replace function public.handle_image_upload_for_blurhash()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  if new.bucket_id <> 'images' then\n    return new;\n  end if;\n\n  insert into public.image_blurhashes (object_id, bucket_id, object_path)\n  values (new.id, new.bucket_id, new.name)\n  on conflict (object_id) do update\n    set status = 'pending',\n        error = null,\n        updated_at = now();\n\n  perform util.invoke_edge_function(\n    name => 'image-blurhash',\n    body => jsonb_build_object(\n      'objectId', new.id,\n      'bucketId', new.bucket_id,\n      'objectPath', new.name\n    )\n  );\n\n  return new;\nend;\n$$;\n\ndrop trigger if exists on_image_upload_blurhash on storage.objects;\n\ncreate trigger on_image_upload_blurhash\nafter insert on storage.objects\nfor each row\nexecute function public.handle_image_upload_for_blurhash();\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- Local development project URL for util.project_url()\nselect vault.create_secret('http://api.supabase.internal:8000', 'project_url');\n"
      }
    ],
    "readme": "# Image blurhash template\n\nComputes a [blurhash](https://blurha.sh) string for every image uploaded to the `images` bucket and stores it in `public.image_blurhashes`. Use the hash as a lightweight placeholder while the full image loads on the client.\n\n## How it works\n\n1. A user uploads an image to the `images` bucket.\n2. A trigger on `storage.objects` inserts a row in `public.image_blurhashes` and invokes the `image-blurhash` Edge Function via `pg_net`.\n3. The function downloads the image, decodes it, computes the blurhash, and updates the row.\n\n## Includes\n\n- `supabase/schemas/image-blurhash.sql` — bucket, tracking table, RLS, and trigger\n- `supabase/functions/image-blurhash/index.ts` — decode and hash worker\n- `supabase/seed.sql` — local `project_url` secret used by `pg_net`\n\n## Dependencies\n\nRequires **storage**, **database**, and **functions**."
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
    "description": "Streaming AI SDK agent endpoint with session persistence, memory, and MCP tool access",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "ai",
      "agents",
      "memory",
      "sessions",
      "pgvector",
      "tools",
      "mcp",
      "streaming",
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
        "ai-automatic-embeddings",
        "mcp-server"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/agent-chat/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { openai } from 'npm:@ai-sdk/openai'\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { streamText, stepCountIs, tool, type CoreMessage, type ToolSet } from 'npm:ai'\nimport { z } from 'npm:zod@3'\n\nconst DEFAULT_MODEL = 'gpt-4.1-mini'\nconst DEFAULT_SYSTEM_PROMPT =\n  'You are a helpful assistant. Use available tools when they are relevant, and cite tool results clearly.'\nconst MAX_HISTORY_MESSAGES = 24\n\nconst mcpServerSchema = z.object({\n  name: z.string().min(1),\n  url: z.string().url(),\n  headers: z.record(z.string()).optional(),\n})\n\nconst requestSchema = z.object({\n  sessionId: z.string().uuid().optional(),\n  message: z.string().min(1),\n  model: z.string().optional(),\n  system: z.string().optional(),\n  metadata: z.record(z.unknown()).optional(),\n  mcpServers: z.array(mcpServerSchema).optional(),\n})\n\ntype AgentMcpServer = z.infer<typeof mcpServerSchema>\n\ntype AgentMemory = {\n  role: 'user' | 'assistant' | 'system' | 'tool'\n  content: string | null\n}\n\ntype McpToolDefinition = {\n  name: string\n  description?: string\n  inputSchema?: Record<string, unknown>\n}\n\ntype JsonRpcResponse<T> = {\n  result?: T\n  error?: { code: number; message: string }\n}\n\nconst supabaseUrl = Deno.env.get('SUPABASE_URL')!\nconst supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!\nconst supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const authHeader = req.headers.get('Authorization') ?? ''\n  const userClient = createClient(supabaseUrl, supabaseAnonKey, {\n    global: { headers: { Authorization: authHeader } },\n  })\n  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)\n\n  const {\n    data: { user },\n    error: userError,\n  } = await userClient.auth.getUser()\n\n  if (userError || !user) {\n    return Response.json({ error: 'valid user JWT is required' }, { status: 401 })\n  }\n\n  const body = parseResult.data\n  const sessionId = await getOrCreateSession(serviceClient, {\n    sessionId: body.sessionId,\n    userId: user.id,\n    title: body.message.slice(0, 80),\n    metadata: body.metadata ?? {},\n  })\n\n  if (!sessionId) {\n    return Response.json({ error: 'session not found or not owned by user' }, { status: 404 })\n  }\n\n  await serviceClient.from('agent_memories').insert({\n    session_id: sessionId,\n    role: 'user',\n    content: body.message,\n    state: body.metadata ?? {},\n  })\n\n  const history = await loadHistory(serviceClient, sessionId)\n  const mcpServers = await loadMcpServers(serviceClient, body.mcpServers, authHeader)\n  const tools = await buildMcpTools(mcpServers)\n\n  const result = streamText({\n    model: openai(body.model ?? Deno.env.get('OPENAI_MODEL') ?? DEFAULT_MODEL),\n    system: body.system ?? DEFAULT_SYSTEM_PROMPT,\n    messages: toCoreMessages(history),\n    tools,\n    stopWhen: stepCountIs(5),\n  })\n\n  const encoder = new TextEncoder()\n  let assistantText = ''\n\n  const stream = new ReadableStream<Uint8Array>({\n    async start(controller) {\n      try {\n        for await (const delta of result.textStream) {\n          assistantText += delta\n          controller.enqueue(encoder.encode(delta))\n        }\n\n        await serviceClient.from('agent_memories').insert({\n          session_id: sessionId,\n          role: 'assistant',\n          content: assistantText,\n          state: { model: body.model ?? Deno.env.get('OPENAI_MODEL') ?? DEFAULT_MODEL },\n        })\n\n        controller.close()\n      } catch (error) {\n        controller.error(error)\n      }\n    },\n  })\n\n  return new Response(stream, {\n    headers: {\n      'Content-Type': 'text/plain; charset=utf-8',\n      'X-Agent-Session-Id': sessionId,\n    },\n  })\n})\n\nasync function getOrCreateSession(\n  supabase: ReturnType<typeof createClient>,\n  {\n    sessionId,\n    userId,\n    title,\n    metadata,\n  }: {\n    sessionId?: string\n    userId: string\n    title: string\n    metadata: Record<string, unknown>\n  }\n) {\n  if (sessionId) {\n    const { data } = await supabase\n      .from('agent_sessions')\n      .select('id')\n      .eq('id', sessionId)\n      .eq('user_id', userId)\n      .single()\n\n    return data?.id ?? null\n  }\n\n  const { data, error } = await supabase\n    .from('agent_sessions')\n    .insert({ user_id: userId, title, metadata })\n    .select('id')\n    .single()\n\n  if (error || !data) {\n    throw new Error(`failed to create agent session: ${error?.message ?? 'unknown error'}`)\n  }\n\n  return data.id as string\n}\n\nasync function loadHistory(\n  supabase: ReturnType<typeof createClient>,\n  sessionId: string\n): Promise<AgentMemory[]> {\n  const { data, error } = await supabase\n    .from('agent_memories')\n    .select('role, content')\n    .eq('session_id', sessionId)\n    .order('created_at', { ascending: false })\n    .limit(MAX_HISTORY_MESSAGES)\n\n  if (error) {\n    throw new Error(`failed to load agent history: ${error.message}`)\n  }\n\n  return (data ?? []).reverse() as AgentMemory[]\n}\n\nfunction toCoreMessages(memories: AgentMemory[]): CoreMessage[] {\n  return memories\n    .filter((memory) => memory.content && memory.role !== 'tool')\n    .map((memory) => ({\n      role: memory.role === 'assistant' ? 'assistant' : memory.role === 'system' ? 'system' : 'user',\n      content: memory.content ?? '',\n    }))\n}\n\nasync function loadMcpServers(\n  supabase: ReturnType<typeof createClient>,\n  requestServers: AgentMcpServer[] | undefined,\n  authHeader: string\n): Promise<AgentMcpServer[]> {\n  const { data } = await supabase\n    .from('agent_mcp_servers')\n    .select('name, url, headers')\n    .eq('enabled', true)\n\n  const configuredServers = (data ?? []).map((server) => ({\n    name: String(server.name),\n    url: String(server.url),\n    headers: normalizeHeaders(server.headers),\n  }))\n\n  const defaultLocalServer = {\n    name: 'project',\n    url: `${supabaseUrl}/functions/v1/mcp-server`,\n    headers: authHeader ? { Authorization: authHeader } : undefined,\n  }\n\n  const servers = [...configuredServers, ...(requestServers ?? [])]\n  return dedupeServers(servers.length > 0 ? servers : [defaultLocalServer])\n}\n\nasync function buildMcpTools(servers: AgentMcpServer[]): Promise<ToolSet> {\n  const entries = await Promise.all(\n    servers.map(async (server) => {\n      try {\n        const tools = await listMcpTools(server)\n        return tools.map((mcpTool) => {\n          const name = toAiToolName(server.name, mcpTool.name)\n\n          return [\n            name,\n            tool({\n              description: `[${server.name}] ${mcpTool.description ?? mcpTool.name}`,\n              inputSchema: (mcpTool.inputSchema ?? { type: 'object', properties: {} }) as never,\n              execute: async (args) => callMcpTool(server, mcpTool.name, args),\n            }),\n          ] as const\n        })\n      } catch {\n        return []\n      }\n    })\n  )\n\n  return Object.fromEntries(entries.flat())\n}\n\nasync function listMcpTools(server: AgentMcpServer): Promise<McpToolDefinition[]> {\n  await mcpRequest(server, 'initialize', {\n    protocolVersion: '2024-11-05',\n    clientInfo: { name: 'supabase-agent', version: '0.1.0' },\n    capabilities: {},\n  })\n\n  const response = await mcpRequest<{ tools: McpToolDefinition[] }>(server, 'tools/list')\n  return response.tools ?? []\n}\n\nasync function callMcpTool(\n  server: AgentMcpServer,\n  name: string,\n  args: unknown\n): Promise<unknown> {\n  const response = await mcpRequest<{ content?: Array<{ type: string; text?: string }>; isError?: boolean }>(\n    server,\n    'tools/call',\n    {\n      name,\n      arguments: args,\n    }\n  )\n\n  if (response.isError) {\n    throw new Error(response.content?.map((item) => item.text).filter(Boolean).join('\\n') ?? name)\n  }\n\n  return response.content?.map((item) => item.text).filter(Boolean).join('\\n') ?? response\n}\n\nasync function mcpRequest<T>(\n  server: AgentMcpServer,\n  method: string,\n  params?: Record<string, unknown>\n): Promise<T> {\n  const response = await fetch(server.url, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      ...(server.headers ?? {}),\n    },\n    body: JSON.stringify({\n      jsonrpc: '2.0',\n      id: crypto.randomUUID(),\n      method,\n      params,\n    }),\n  })\n\n  if (!response.ok) {\n    throw new Error(`MCP server ${server.name} returned HTTP ${response.status}`)\n  }\n\n  const payload = (await response.json()) as JsonRpcResponse<T>\n\n  if (payload.error) {\n    throw new Error(payload.error.message)\n  }\n\n  if (payload.result === undefined) {\n    throw new Error(`MCP server ${server.name} returned no result`)\n  }\n\n  return payload.result\n}\n\nfunction normalizeHeaders(value: unknown): Record<string, string> | undefined {\n  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined\n\n  return Object.fromEntries(\n    Object.entries(value)\n      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')\n      .map(([key, headerValue]) => [key, headerValue])\n  )\n}\n\nfunction dedupeServers(servers: AgentMcpServer[]): AgentMcpServer[] {\n  const seen = new Set<string>()\n  return servers.filter((server) => {\n    const key = server.name\n    if (seen.has(key)) return false\n    seen.add(key)\n    return true\n  })\n}\n\nfunction toAiToolName(serverName: string, toolName: string) {\n  return `${serverName}_${toolName}`.replace(/[^a-zA-Z0-9_]/g, '_')\n}\n"
      },
      {
        "path": "supabase/schemas/agent.sql",
        "content": "-- Persistent sessions, memory, and MCP server configuration for streaming AI agents.\n-- Pair with ai-vector-search or ai-automatic-embeddings for embedding generation.\n\ncreate extension if not exists vector with schema extensions;\n\ncreate table if not exists public.agent_sessions (\n  id uuid primary key default gen_random_uuid(),\n  user_id uuid references auth.users on delete cascade,\n  title text,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.agent_sessions is 'Conversation sessions for an agent or user.';\n\ncreate table if not exists public.agent_memories (\n  id uuid primary key default gen_random_uuid(),\n  session_id uuid references public.agent_sessions on delete cascade not null,\n  role text not null check (role in ('user', 'assistant', 'system', 'tool')),\n  content text,\n  state jsonb not null default '{}',\n  embedding extensions.halfvec(1536),\n  created_at timestamptz default now()\n);\n\ncomment on table public.agent_memories is 'Individual messages and tool results within a session.';\n\ncreate table if not exists public.agent_mcp_servers (\n  id uuid primary key default gen_random_uuid(),\n  name text not null unique,\n  url text not null,\n  headers jsonb not null default '{}',\n  enabled boolean not null default true,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.agent_mcp_servers is 'MCP servers whose tools can be exposed to the streaming agent endpoint. Avoid storing long-lived secrets in headers.';\n\ncreate index if not exists agent_memories_session_id_idx on public.agent_memories (session_id);\n\ncreate index if not exists agent_memories_embedding_idx\non public.agent_memories\nusing hnsw (embedding extensions.halfvec_cosine_ops);\n\nalter table public.agent_sessions enable row level security;\nalter table public.agent_memories enable row level security;\nalter table public.agent_mcp_servers enable row level security;\n\ncreate policy \"Users can read their own sessions\"\non public.agent_sessions\nfor select\nto authenticated\nusing (auth.uid() = user_id);\n\ncreate policy \"Users can insert their own sessions\"\non public.agent_sessions\nfor insert\nto authenticated\nwith check (auth.uid() = user_id);\n\ncreate policy \"Users can update their own sessions\"\non public.agent_sessions\nfor update\nto authenticated\nusing (auth.uid() = user_id);\n\ncreate policy \"Users can delete their own sessions\"\non public.agent_sessions\nfor delete\nto authenticated\nusing (auth.uid() = user_id);\n\ncreate policy \"Users can read memories in their sessions\"\non public.agent_memories\nfor select\nto authenticated\nusing (\n  exists (\n    select 1\n    from public.agent_sessions\n    where agent_sessions.id = agent_memories.session_id\n      and agent_sessions.user_id = auth.uid()\n  )\n);\n\ncreate policy \"Users can insert memories in their sessions\"\non public.agent_memories\nfor insert\nto authenticated\nwith check (\n  exists (\n    select 1\n    from public.agent_sessions\n    where agent_sessions.id = agent_memories.session_id\n      and agent_sessions.user_id = auth.uid()\n  )\n);\n\ncreate policy \"Authenticated users can read enabled MCP servers\"\non public.agent_mcp_servers\nfor select\nto authenticated\nusing (enabled = true);\n\ncreate or replace function public.match_agent_memories(\n  session_id uuid,\n  query_embedding extensions.halfvec(1536),\n  match_count int default 8\n)\nreturns table (\n  id uuid,\n  role text,\n  content text,\n  state jsonb,\n  similarity float\n)\nlanguage sql\nstable\nsecurity invoker\nset search_path = ''\nas $$\n  select\n    agent_memories.id,\n    agent_memories.role,\n    agent_memories.content,\n    agent_memories.state,\n    1 - (agent_memories.embedding <=> query_embedding) as similarity\n  from public.agent_memories\n  where agent_memories.session_id = match_agent_memories.session_id\n    and agent_memories.embedding is not null\n    and exists (\n      select 1\n      from public.agent_sessions\n      where agent_sessions.id = agent_memories.session_id\n        and agent_sessions.user_id = auth.uid()\n    )\n  order by agent_memories.embedding <=> query_embedding\n  limit least(match_count, 50);\n$$;\n"
      }
    ],
    "readme": "# Agent template\n\nBuild persistent AI agents on Supabase with a streaming chat endpoint, session history, long-term memory, and MCP tool access. The generated `agent-chat` Edge Function uses the AI SDK to stream model responses back to clients while persisting user and assistant messages in Postgres.\n\nThe agent can call tools from connected MCP servers. If you also add the **mcp-server** template, the agent can use that local Edge Function MCP server as one of its tool sources.\n\n## What's included\n\n| Asset         | Path                                      | Purpose                                      |\n| ------------- | ----------------------------------------- | -------------------------------------------- |\n| Schema        | `supabase/schemas/agent.sql`              | Sessions, messages, memory, MCP servers, RLS |\n| Edge Function | `supabase/functions/agent-chat/index.ts`  | Streaming AI SDK chat endpoint               |\n\n### Sessions and messages\n\nEach session belongs to a user. `agent-chat` creates a session when `sessionId` is omitted, appends the user message, streams the model response, then persists the assistant response.\n\n### Memory and recall\n\nMemory rows can store arbitrary JSON payloads. When combined with **ai-vector-search** or **ai-automatic-embeddings**, embeddings enable similarity search over past context before the model runs.\n\n### MCP tools\n\n`agent-chat` discovers tools from MCP servers and exposes them to the AI SDK model call. By default, it attempts to connect to the local `mcp-server` Edge Function at:\n\n```text\n${SUPABASE_URL}/functions/v1/mcp-server\n```\n\nYou can also add rows to `public.agent_mcp_servers`:\n\n```sql\ninsert into public.agent_mcp_servers (name, url)\nvalues ('project', 'https://<project-ref>.supabase.co/functions/v1/mcp-server');\n```\n\nor pass request-scoped MCP servers:\n\n```ts\nconst response = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {\n  method: 'POST',\n  headers: {\n    Authorization: `Bearer ${session.access_token}`,\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify({\n    sessionId,\n    message: 'List the public tables in my project',\n    mcpServers: [\n      {\n        name: 'project',\n        url: `${supabaseUrl}/functions/v1/mcp-server`,\n      },\n    ],\n  }),\n})\n```\n\nTool names are namespaced as `<server>_<tool>`, so a `list_tables` tool from the local MCP server is exposed to the model as `project_list_tables`.\n\n## Dependencies\n\n**Required**\n\n- `database` — base Supabase project config\n- `api` — REST/GraphQL surface for client access\n- `auth` — user-scoped sessions and RLS\n- `functions` — Edge Functions runtime\n\n**Optional**\n\n- `ai-vector-search` — pgvector similarity over memory embeddings\n- `ai-automatic-embeddings` — keep embeddings in sync via triggers\n- `mcp-server` — local Edge Function MCP server the agent can call for project tools\n\n## Getting started\n\n1. Add this template (and its required dependencies) to your composition.\n2. Run `supabase db reset` or apply migrations locally to create agent tables.\n3. Set model provider secrets, for example `supabase secrets set OPENAI_API_KEY=...`.\n4. Deploy Edge Functions: `supabase functions deploy agent-chat`.\n5. From your app, POST `{ message, sessionId? }` to `agent-chat` and read the streamed text response.\n\nFor production, review RLS policies in `agent.sql`, restrict service-role usage to server-side agent loops, and avoid storing long-lived third-party MCP secrets directly in `agent_mcp_servers.headers`."
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
    "id": "ai-rag-pipeline",
    "name": "RAG Pipeline",
    "description": "Turn-key retrieval-augmented generation: ingest text via an Edge Function, auto-chunk and embed, then query for similar passages",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "ai",
      "rag",
      "embeddings",
      "pgvector",
      "pgmq",
      "openai"
    ],
    "dependencies": {
      "required": [
        "database",
        "api",
        "functions"
      ],
      "optional": [
        "queues",
        "ai-vector-search"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/rag-embed/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'\nimport OpenAI from 'jsr:@openai/openai@4'\nimport { z } from 'npm:zod@3'\n\nconst QUEUE_NAME = 'rag_embedding_jobs'\nconst EMBEDDING_MODEL = 'text-embedding-3-small'\n\nconst openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })\nconst sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)\n\nconst jobSchema = z.object({\n  jobId: z.number(),\n  chunkId: z.string().uuid(),\n})\n\ntype Job = z.infer<typeof jobSchema>\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = z.array(jobSchema).safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const completedJobs: Job[] = []\n  const failedJobs: Array<Job & { error: string }> = []\n\n  for (const job of parseResult.data) {\n    try {\n      await processJob(job)\n      completedJobs.push(job)\n    } catch (error) {\n      failedJobs.push({\n        ...job,\n        error: error instanceof Error ? error.message : JSON.stringify(error),\n      })\n    }\n  }\n\n  return Response.json({ completedJobs, failedJobs })\n})\n\nasync function processJob({ jobId, chunkId }: Job) {\n  const [chunk] = await sql<{ id: string; content: string }[]>`\n    select id, content\n    from public.rag_chunks\n    where id = ${chunkId}\n  `\n\n  if (!chunk) {\n    throw new Error(`chunk not found: ${chunkId}`)\n  }\n\n  const response = await openai.embeddings.create({\n    model: EMBEDDING_MODEL,\n    input: chunk.content,\n  })\n\n  const embedding = response.data[0]?.embedding\n\n  if (!embedding) {\n    throw new Error('failed to generate embedding')\n  }\n\n  await sql`\n    update public.rag_chunks\n    set embedding = ${JSON.stringify(embedding)}\n    where id = ${chunkId}\n  `\n\n  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n}\n"
      },
      {
        "path": "supabase/functions/rag-ingest/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { z } from 'npm:zod@3'\n\nconst CHUNK_SIZE = 1000\nconst CHUNK_OVERLAP = 150\n\nconst requestSchema = z.object({\n  source: z.string().min(1),\n  content: z.string().min(1),\n  metadata: z.record(z.unknown()).optional(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { source, content, metadata } = parseResult.data\n\n  const { data: document, error: documentError } = await supabase\n    .from('rag_documents')\n    .insert({ source, metadata: metadata ?? {} })\n    .select('id')\n    .single()\n\n  if (documentError || !document) {\n    return Response.json(\n      { error: `failed to create document: ${documentError?.message ?? 'unknown error'}` },\n      { status: 500 }\n    )\n  }\n\n  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP).map((text, index) => ({\n    document_id: document.id,\n    chunk_index: index,\n    content: text,\n  }))\n\n  const { error: chunkError } = await supabase.from('rag_chunks').insert(chunks)\n\n  if (chunkError) {\n    return Response.json(\n      { error: `failed to insert chunks: ${chunkError.message}` },\n      { status: 500 }\n    )\n  }\n\n  return Response.json({ documentId: document.id, chunkCount: chunks.length })\n})\n\nfunction chunkText(text: string, size: number, overlap: number): string[] {\n  const trimmed = text.trim()\n  if (trimmed.length <= size) return [trimmed]\n\n  const chunks: string[] = []\n  let start = 0\n\n  while (start < trimmed.length) {\n    const end = Math.min(start + size, trimmed.length)\n    let breakAt = end\n\n    if (end < trimmed.length) {\n      const paragraphBreak = trimmed.lastIndexOf('\\n\\n', end)\n      const sentenceBreak = trimmed.lastIndexOf('. ', end)\n      const candidate = Math.max(paragraphBreak, sentenceBreak)\n      if (candidate > start + size / 2) breakAt = candidate + 1\n    }\n\n    chunks.push(trimmed.slice(start, breakAt).trim())\n    if (breakAt >= trimmed.length) break\n    start = Math.max(breakAt - overlap, start + 1)\n  }\n\n  return chunks.filter((chunk) => chunk.length > 0)\n}\n"
      },
      {
        "path": "supabase/functions/rag-query/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport OpenAI from 'jsr:@openai/openai@4'\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { z } from 'npm:zod@3'\n\nconst EMBEDDING_MODEL = 'text-embedding-3-small'\n\nconst requestSchema = z.object({\n  query: z.string().min(1),\n  matchCount: z.number().int().positive().max(50).optional(),\n  source: z.string().optional(),\n})\n\nconst openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { query, matchCount, source } = parseResult.data\n\n  const embeddingResponse = await openai.embeddings.create({\n    model: EMBEDDING_MODEL,\n    input: query,\n  })\n\n  const embedding = embeddingResponse.data[0]?.embedding\n\n  if (!embedding) {\n    return Response.json({ error: 'failed to embed query' }, { status: 500 })\n  }\n\n  const { data, error } = await supabase.rpc('match_rag_chunks', {\n    query_embedding: JSON.stringify(embedding),\n    match_count: matchCount ?? 8,\n    source_filter: source ?? null,\n  })\n\n  if (error) {\n    return Response.json({ error: error.message }, { status: 500 })\n  }\n\n  return Response.json({ query, matches: data })\n})\n"
      },
      {
        "path": "supabase/schemas/rag.sql",
        "content": "-- Self-contained RAG pipeline: documents, chunked passages, vector index,\n-- embedding queue, and a SQL helper for similarity search.\n\ncreate extension if not exists vector with schema extensions;\ncreate extension if not exists pgmq;\ncreate extension if not exists pg_net with schema extensions;\ncreate extension if not exists pg_cron;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ncreate table if not exists public.rag_documents (\n  id uuid primary key default gen_random_uuid(),\n  source text not null,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.rag_documents is 'One row per ingested document. Content lives in `rag_chunks`.';\n\ncreate table if not exists public.rag_chunks (\n  id uuid primary key default gen_random_uuid(),\n  document_id uuid not null references public.rag_documents(id) on delete cascade,\n  chunk_index int not null,\n  content text not null,\n  embedding extensions.halfvec(1536),\n  created_at timestamptz default now(),\n  unique (document_id, chunk_index)\n);\n\ncomment on table public.rag_chunks is 'Chunked text passages with embeddings. One document fans out into many chunks.';\n\ncreate index if not exists rag_chunks_embedding_idx\non public.rag_chunks\nusing hnsw (embedding extensions.halfvec_cosine_ops);\n\nalter table public.rag_documents enable row level security;\nalter table public.rag_chunks enable row level security;\n\ncreate policy \"Authenticated users can read documents\"\non public.rag_documents for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read chunks\"\non public.rag_chunks for select\nto authenticated\nusing (true);\n\nselect pgmq.create('rag_embedding_jobs');\n\ncreate or replace function public.queue_rag_chunk_embedding()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  perform pgmq.send(\n    queue_name => 'rag_embedding_jobs',\n    msg => jsonb_build_object('chunkId', new.id)\n  );\n  return new;\nend;\n$$;\n\ncreate trigger queue_rag_chunk_embedding_on_insert\nafter insert on public.rag_chunks\nfor each row\nexecute function public.queue_rag_chunk_embedding();\n\ncreate trigger reembed_rag_chunk_on_content_change\nafter update of content on public.rag_chunks\nfor each row\nwhen (new.content is distinct from old.content)\nexecute function public.queue_rag_chunk_embedding();\n\ncreate or replace function util.process_rag_embeddings(\n  batch_size int default 10,\n  max_requests int default 5,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  job_batches jsonb[];\n  batch jsonb;\nbegin\n  with\n    numbered_jobs as (\n      select\n        message || jsonb_build_object('jobId', msg_id) as job_info,\n        (row_number() over (order by 1) - 1) / batch_size as batch_num\n      from pgmq.read(\n        queue_name => 'rag_embedding_jobs',\n        vt => timeout_milliseconds / 1000,\n        qty => max_requests * batch_size\n      )\n    ),\n    batched_jobs as (\n      select jsonb_agg(job_info) as batch_array, batch_num\n      from numbered_jobs\n      group by batch_num\n    )\n  select coalesce(array_agg(batch_array), array[]::jsonb[])\n  into job_batches\n  from batched_jobs;\n\n  foreach batch in array job_batches loop\n    perform util.invoke_edge_function(\n      name => 'rag-embed',\n      body => batch,\n      timeout_milliseconds => timeout_milliseconds\n    );\n  end loop;\nend;\n$$;\n\nselect cron.schedule(\n  'process-rag-embeddings',\n  '10 seconds',\n  $$ select util.process_rag_embeddings(); $$\n);\n\ncreate or replace function public.match_rag_chunks(\n  query_embedding extensions.halfvec(1536),\n  match_count int default 8,\n  source_filter text default null\n)\nreturns table (\n  chunk_id uuid,\n  document_id uuid,\n  source text,\n  chunk_index int,\n  content text,\n  metadata jsonb,\n  similarity float\n)\nlanguage sql\nstable\nsecurity invoker\nset search_path = ''\nas $$\n  select\n    c.id as chunk_id,\n    c.document_id,\n    d.source,\n    c.chunk_index,\n    c.content,\n    d.metadata,\n    1 - (c.embedding <=> query_embedding) as similarity\n  from public.rag_chunks c\n  join public.rag_documents d on d.id = c.document_id\n  where c.embedding is not null\n    and (source_filter is null or d.source = source_filter)\n  order by c.embedding <=> query_embedding\n  limit least(match_count, 50);\n$$;\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- Local development project URL for util.project_url()\nselect vault.create_secret('http://api.supabase.internal:8000', 'project_url');\n"
      }
    ],
    "readme": "# RAG pipeline template\n\nA turn-key retrieval-augmented generation setup. POST text to `rag-ingest` and it is chunked, embedded, and stored. POST a question to `rag-query` and the top matching chunks come back, ready to drop into a model prompt.\n\n## How it works\n\n1. Client calls `rag-ingest` with `{ source, content, metadata? }`.\n2. The function inserts a `public.rag_documents` row and splits the content into ~1,000-character chunks in `public.rag_chunks`.\n3. A trigger enqueues each chunk on the `rag_embedding_jobs` `pgmq` queue.\n4. A `pg_cron` job drains the queue every 10 seconds and invokes the `rag-embed` worker.\n5. The worker calls OpenAI's embedding API and writes the vectors back to `rag_chunks`.\n6. Clients call `rag-query` with a question — the function embeds the query and returns the closest chunks via the `match_rag_chunks` SQL helper.\n\n## Includes\n\n- `supabase/schemas/rag.sql` — documents, chunks, HNSW index, queue, cron, and trigger\n- `supabase/functions/rag-ingest/index.ts` — accepts text, splits into chunks\n- `supabase/functions/rag-embed/index.ts` — batch worker invoked by `pg_cron`\n- `supabase/functions/rag-query/index.ts` — embeds a query and returns matches\n- `supabase/seed.sql` — local `project_url` secret used by `pg_net`\n\n## Configuration\n\nSet `OPENAI_API_KEY` on the project (`supabase secrets set OPENAI_API_KEY=...`). The pipeline uses `text-embedding-3-small` (1536 dimensions); change `embedding_dim` in `rag.sql` and the model name in the worker if you switch.\n\n## Dependencies\n\nRequires **database**, **api**, and **functions**. Optional: **queues** (the schema enables `pgmq` itself) and **ai-vector-search** if you want the generic `documents` table side by side."
  },
  {
    "id": "ai-storage-rag-ingest",
    "name": "Storage RAG Ingest",
    "description": "Ingest text and markdown files from Storage into the existing RAG pipeline",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "ai",
      "rag",
      "storage",
      "embeddings",
      "files",
      "functions"
    ],
    "dependencies": {
      "required": [
        "database",
        "storage",
        "functions",
        "ai-rag-pipeline"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/rag-file-ingest/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { z } from 'npm:zod@3'\n\nconst CHUNK_SIZE = 1000\nconst CHUNK_OVERLAP = 150\nconst SOURCE_BUCKET = 'rag-files'\n\nconst requestSchema = z.object({\n  objectId: z.string().uuid(),\n  bucketId: z.string(),\n  objectPath: z.string(),\n  mimeType: z.string().optional().nullable(),\n  metadata: z.record(z.unknown()).optional(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { objectId, bucketId, objectPath, mimeType, metadata } = parseResult.data\n\n  if (bucketId !== SOURCE_BUCKET) {\n    return Response.json({ skipped: true, reason: `bucket ${bucketId} is not handled` })\n  }\n\n  await markIngestion(objectId, { status: 'processing', error: null })\n\n  try {\n    assertSupportedFile(objectPath, mimeType ?? undefined)\n\n    const text = await downloadText(objectPath)\n    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP)\n\n    if (chunks.length === 0) {\n      throw new Error('file did not contain ingestible text')\n    }\n\n    const { data: document, error: documentError } = await supabase\n      .from('rag_documents')\n      .insert({\n        source: objectPath,\n        metadata: {\n          ...(metadata ?? {}),\n          bucketId,\n          objectId,\n          objectPath,\n          mimeType: mimeType ?? null,\n        },\n      })\n      .select('id')\n      .single()\n\n    if (documentError || !document) {\n      throw new Error(`failed to create RAG document: ${documentError?.message ?? 'unknown error'}`)\n    }\n\n    const { error: chunkError } = await supabase.from('rag_chunks').insert(\n      chunks.map((content, index) => ({\n        document_id: document.id,\n        chunk_index: index,\n        content,\n      }))\n    )\n\n    if (chunkError) {\n      throw new Error(`failed to insert RAG chunks: ${chunkError.message}`)\n    }\n\n    await markIngestion(objectId, {\n      status: 'ready',\n      document_id: document.id,\n      error: null,\n      metadata: { chunkCount: chunks.length },\n    })\n\n    return Response.json({ objectId, documentId: document.id, chunkCount: chunks.length })\n  } catch (error) {\n    const message = error instanceof Error ? error.message : String(error)\n\n    await markIngestion(objectId, { status: 'failed', error: message })\n\n    return Response.json({ objectId, error: message }, { status: 500 })\n  }\n})\n\nasync function downloadText(objectPath: string): Promise<string> {\n  const { data, error } = await supabase.storage.from(SOURCE_BUCKET).download(objectPath)\n\n  if (error || !data) {\n    throw new Error(`failed to download file: ${error?.message ?? 'unknown error'}`)\n  }\n\n  return new TextDecoder().decode(await data.arrayBuffer()).trim()\n}\n\nfunction assertSupportedFile(objectPath: string, mimeType?: string) {\n  const normalizedMime = mimeType?.toLowerCase()\n  const normalizedPath = objectPath.toLowerCase()\n\n  const isSupportedMime =\n    normalizedMime === undefined ||\n    normalizedMime.startsWith('text/plain') ||\n    normalizedMime.startsWith('text/markdown') ||\n    normalizedMime.startsWith('text/x-markdown')\n\n  const isSupportedExtension =\n    normalizedPath.endsWith('.txt') ||\n    normalizedPath.endsWith('.md') ||\n    normalizedPath.endsWith('.markdown')\n\n  if (!isSupportedMime || !isSupportedExtension) {\n    throw new Error('only .txt, .md, and .markdown files are supported')\n  }\n}\n\nasync function markIngestion(\n  objectId: string,\n  values: {\n    status: 'processing' | 'ready' | 'failed'\n    document_id?: string\n    error?: string | null\n    metadata?: Record<string, unknown>\n  }\n) {\n  await supabase\n    .from('rag_file_ingestions')\n    .update({ ...values, updated_at: new Date().toISOString() })\n    .eq('object_id', objectId)\n}\n\nfunction chunkText(text: string, size: number, overlap: number): string[] {\n  const trimmed = text.trim()\n  if (trimmed.length <= size) return trimmed.length > 0 ? [trimmed] : []\n\n  const chunks: string[] = []\n  let start = 0\n\n  while (start < trimmed.length) {\n    const end = Math.min(start + size, trimmed.length)\n    let breakAt = end\n\n    if (end < trimmed.length) {\n      const paragraphBreak = trimmed.lastIndexOf('\\n\\n', end)\n      const sentenceBreak = trimmed.lastIndexOf('. ', end)\n      const candidate = Math.max(paragraphBreak, sentenceBreak)\n      if (candidate > start + size / 2) breakAt = candidate + 1\n    }\n\n    chunks.push(trimmed.slice(start, breakAt).trim())\n    if (breakAt >= trimmed.length) break\n    start = Math.max(breakAt - overlap, start + 1)\n  }\n\n  return chunks.filter((chunk) => chunk.length > 0)\n}\n"
      },
      {
        "path": "supabase/schemas/storage-rag-ingest.sql",
        "content": "-- Storage-backed ingestion for the RAG pipeline.\n-- Text and Markdown files uploaded to `rag-files` are copied into rag_documents/rag_chunks.\n\ncreate extension if not exists pg_net with schema extensions;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ninsert into storage.buckets (id, name, public)\nvalues ('rag-files', 'rag-files', false)\non conflict (id) do nothing;\n\ncreate policy \"Users can upload their own RAG files\"\non storage.objects for insert\nto authenticated\nwith check (\n  bucket_id = 'rag-files'\n  and auth.uid()::text = (storage.foldername(name))[1]\n);\n\ncreate policy \"Users can read their own RAG files\"\non storage.objects for select\nto authenticated\nusing (\n  bucket_id = 'rag-files'\n  and auth.uid()::text = (storage.foldername(name))[1]\n);\n\ncreate table if not exists public.rag_file_ingestions (\n  id uuid primary key default gen_random_uuid(),\n  object_id uuid not null unique references storage.objects(id) on delete cascade,\n  bucket_id text not null,\n  object_path text not null,\n  document_id uuid references public.rag_documents(id) on delete set null,\n  mime_type text,\n  metadata jsonb not null default '{}',\n  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),\n  error text,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncomment on table public.rag_file_ingestions is 'Tracks Storage objects being ingested into the RAG pipeline.';\n\nalter table public.rag_file_ingestions enable row level security;\n\ncreate policy \"Users can read their own RAG file ingestions\"\non public.rag_file_ingestions for select\nto authenticated\nusing (auth.uid()::text = split_part(object_path, '/', 1));\n\ncreate or replace function public.handle_rag_file_upload()\nreturns trigger\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  if new.bucket_id <> 'rag-files' then\n    return new;\n  end if;\n\n  insert into public.rag_file_ingestions (\n    object_id,\n    bucket_id,\n    object_path,\n    mime_type,\n    status\n  )\n  values (\n    new.id,\n    new.bucket_id,\n    new.name,\n    new.metadata ->> 'mimetype',\n    'pending'\n  )\n  on conflict (object_id) do update\n    set status = 'pending',\n        error = null,\n        updated_at = now();\n\n  perform util.invoke_edge_function(\n    name => 'rag-file-ingest',\n    body => jsonb_build_object(\n      'objectId', new.id,\n      'bucketId', new.bucket_id,\n      'objectPath', new.name,\n      'mimeType', new.metadata ->> 'mimetype'\n    )\n  );\n\n  return new;\nend;\n$$;\n\ndrop trigger if exists on_rag_file_upload on storage.objects;\n\ncreate trigger on_rag_file_upload\nafter insert on storage.objects\nfor each row\nexecute function public.handle_rag_file_upload();\n"
      }
    ],
    "readme": "# Storage RAG ingest template\n\nExtends **RAG Pipeline** with file uploads. Files uploaded to the private `rag-files` bucket are downloaded by an Edge Function, converted to text, and inserted into the existing `rag_documents` and `rag_chunks` tables.\n\n## How it works\n\n1. A user uploads a `.txt`, `.md`, or `.markdown` file to `rag-files/<user_id>/...`.\n2. A trigger on `storage.objects` creates a `public.rag_file_ingestions` row.\n3. The trigger invokes `rag-file-ingest` through `pg_net`.\n4. The function downloads the file, extracts UTF-8 text, chunks it, and inserts rows into the existing RAG tables.\n5. The ingestion row is updated to `ready` or `failed`.\n\n## Includes\n\n- `supabase/schemas/storage-rag-ingest.sql` - bucket, policies, tracking table, and upload trigger\n- `supabase/functions/rag-file-ingest/index.ts` - Storage download and RAG insert worker\n\n## Configuration\n\nRequires **RAG Pipeline**. The Edge Function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are injected automatically in hosted projects. For local development, set the `project_url` Vault secret to the local Functions URL."
  },
  {
    "id": "durable-workflows",
    "name": "Durable Workflows",
    "description": "Workflow runs, retryable steps, attempts, queues, and an Edge Function worker scaffold",
    "category": "Database",
    "version": "1.0.0",
    "tags": [
      "workflows",
      "background-jobs",
      "pgmq",
      "pg_cron",
      "functions",
      "retries"
    ],
    "dependencies": {
      "required": [
        "database",
        "functions"
      ],
      "optional": [
        "queues"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/workflow-worker/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { z } from 'npm:zod@3'\n\nconst QUEUE_NAME = 'workflow_runs'\n\nconst requestSchema = z.object({\n  jobId: z.number().int().positive(),\n  runId: z.string().uuid(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\nconst sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)\n\ntype WorkflowRun = {\n  id: string\n  workflow_type: string\n  input: Record<string, unknown>\n  attempt_count: number\n  max_attempts: number\n}\n\ntype WorkflowHandler = (run: WorkflowRun) => Promise<Record<string, unknown>>\n\nconst handlers: Record<string, WorkflowHandler> = {\n  example: async (run) => ({ ok: true, input: run.input }),\n}\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = requestSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const { jobId, runId } = parseResult.data\n\n  const { data: run, error: runError } = await supabase\n    .from('workflow_runs')\n    .select('*')\n    .eq('id', runId)\n    .single<WorkflowRun>()\n\n  if (runError || !run) {\n    await deleteQueueMessage(jobId)\n    return Response.json({ error: `workflow run not found: ${runError?.message}` }, { status: 404 })\n  }\n\n  if (!['queued', 'failed'].includes((run as { status?: string }).status ?? '')) {\n    await deleteQueueMessage(jobId)\n    return Response.json({ skipped: true, runId, status: (run as { status?: string }).status })\n  }\n\n  const attemptNumber = run.attempt_count + 1\n  const { data: attempt } = await supabase\n    .from('workflow_attempts')\n    .insert({ run_id: runId, attempt_number: attemptNumber })\n    .select('id')\n    .single()\n\n  await supabase\n    .from('workflow_runs')\n    .update({\n      status: 'running',\n      attempt_count: attemptNumber,\n      locked_at: new Date().toISOString(),\n      locked_by: crypto.randomUUID(),\n      updated_at: new Date().toISOString(),\n    })\n    .eq('id', runId)\n\n  try {\n    const handler = handlers[run.workflow_type]\n\n    if (!handler) {\n      throw new Error(`no workflow handler registered for \"${run.workflow_type}\"`)\n    }\n\n    const result = await handler(run)\n\n    await supabase\n      .from('workflow_runs')\n      .update({\n        status: 'succeeded',\n        result,\n        error: null,\n        locked_at: null,\n        locked_by: null,\n        updated_at: new Date().toISOString(),\n      })\n      .eq('id', runId)\n\n    if (attempt?.id) {\n      await supabase\n        .from('workflow_attempts')\n        .update({ status: 'succeeded', result, finished_at: new Date().toISOString() })\n        .eq('id', attempt.id)\n    }\n\n    await deleteQueueMessage(jobId)\n\n    return Response.json({ runId, result })\n  } catch (error) {\n    const message = error instanceof Error ? error.message : String(error)\n    const exhausted = attemptNumber >= run.max_attempts\n\n    await supabase\n      .from('workflow_runs')\n      .update({\n        status: exhausted ? 'dead_letter' : 'failed',\n        error: message,\n        locked_at: null,\n        locked_by: null,\n        updated_at: new Date().toISOString(),\n      })\n      .eq('id', runId)\n\n    if (attempt?.id) {\n      await supabase\n        .from('workflow_attempts')\n        .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })\n        .eq('id', attempt.id)\n    }\n\n    if (!exhausted) {\n      await sql`select pgmq.send(${QUEUE_NAME}, ${JSON.stringify({ runId })}::jsonb)`\n    }\n\n    await deleteQueueMessage(jobId)\n\n    return Response.json({ runId, error: message, retrying: !exhausted }, { status: 500 })\n  }\n})\n\nasync function deleteQueueMessage(jobId: number) {\n  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n}\n"
      },
      {
        "path": "supabase/schemas/workflows.sql",
        "content": "-- Durable workflow runner with pgmq, retry state, attempts, and an Edge Function worker.\n\ncreate extension if not exists pgmq;\ncreate extension if not exists pg_net with schema extensions;\ncreate extension if not exists pg_cron;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ncreate table if not exists public.workflow_runs (\n  id uuid primary key default gen_random_uuid(),\n  workflow_type text not null,\n  input jsonb not null default '{}',\n  status text not null default 'queued' check (\n    status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'dead_letter')\n  ),\n  attempt_count int not null default 0,\n  max_attempts int not null default 3,\n  run_after timestamptz not null default now(),\n  locked_at timestamptz,\n  locked_by text,\n  result jsonb,\n  error text,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncreate table if not exists public.workflow_steps (\n  id uuid primary key default gen_random_uuid(),\n  run_id uuid not null references public.workflow_runs(id) on delete cascade,\n  step_key text not null,\n  status text not null default 'queued' check (\n    status in ('queued', 'running', 'succeeded', 'failed', 'skipped')\n  ),\n  input jsonb not null default '{}',\n  result jsonb,\n  error text,\n  attempt_count int not null default 0,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now(),\n  unique (run_id, step_key)\n);\n\ncreate table if not exists public.workflow_attempts (\n  id uuid primary key default gen_random_uuid(),\n  run_id uuid not null references public.workflow_runs(id) on delete cascade,\n  attempt_number int not null,\n  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),\n  started_at timestamptz not null default now(),\n  finished_at timestamptz,\n  error text,\n  result jsonb\n);\n\ncreate index if not exists workflow_runs_status_run_after_idx\non public.workflow_runs (status, run_after);\n\ncreate index if not exists workflow_steps_run_id_idx\non public.workflow_steps (run_id);\n\ncreate index if not exists workflow_attempts_run_id_idx\non public.workflow_attempts (run_id);\n\nalter table public.workflow_runs enable row level security;\nalter table public.workflow_steps enable row level security;\nalter table public.workflow_attempts enable row level security;\n\ncreate policy \"Authenticated users can read workflow runs\"\non public.workflow_runs for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read workflow steps\"\non public.workflow_steps for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read workflow attempts\"\non public.workflow_attempts for select\nto authenticated\nusing (true);\n\nselect pgmq.create('workflow_runs');\n\ncreate or replace function public.enqueue_workflow(\n  workflow_type text,\n  input jsonb default '{}',\n  run_after timestamptz default now(),\n  max_attempts int default 3,\n  metadata jsonb default '{}'\n)\nreturns uuid\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  run_id uuid;\nbegin\n  insert into public.workflow_runs (\n    workflow_type,\n    input,\n    run_after,\n    max_attempts,\n    metadata\n  )\n  values (\n    enqueue_workflow.workflow_type,\n    enqueue_workflow.input,\n    enqueue_workflow.run_after,\n    greatest(enqueue_workflow.max_attempts, 1),\n    enqueue_workflow.metadata\n  )\n  returning id into run_id;\n\n  perform pgmq.send(\n    queue_name => 'workflow_runs',\n    msg => jsonb_build_object('runId', run_id)\n  );\n\n  return run_id;\nend;\n$$;\n\ncreate or replace function util.dispatch_workflows(\n  batch_size int default 10,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  job record;\nbegin\n  for job in\n    select msg_id, message\n    from pgmq.read(\n      queue_name => 'workflow_runs',\n      vt => timeout_milliseconds / 1000,\n      qty => batch_size\n    )\n  loop\n    perform util.invoke_edge_function(\n      name => 'workflow-worker',\n      body => job.message || jsonb_build_object('jobId', job.msg_id),\n      timeout_milliseconds => timeout_milliseconds\n    );\n  end loop;\nend;\n$$;\n\nselect cron.schedule(\n  'dispatch-workflows',\n  '10 seconds',\n  $$ select util.dispatch_workflows(); $$\n);\n"
      }
    ],
    "readme": "# Durable workflows template\n\nAdds a Postgres-backed workflow runner for long-running or retryable product work. Use it for imports, exports, document processing, billing reconciliation, AI batch work, or any task that should survive request timeouts.\n\n## How it works\n\n1. Call `public.enqueue_workflow(...)` to create a workflow run and enqueue it in `pgmq`.\n2. A `pg_cron` job drains the queue and invokes the `workflow-worker` Edge Function.\n3. The worker marks the run `running`, records an attempt, and dispatches by `workflow_type`.\n4. Successful runs are marked `succeeded`; failures are retried until `max_attempts`, then moved to `dead_letter`.\n\n## Includes\n\n- `supabase/schemas/workflows.sql` - workflow tables, enqueue helper, queue dispatcher, and cron job\n- `supabase/functions/workflow-worker/index.ts` - Edge Function worker scaffold with retry handling\n\n## Configuration\n\nThe generated worker intentionally includes a small dispatch registry. Add your workflow handlers inside `handlers` in `workflow-worker/index.ts`."
  },
  {
    "id": "app-rate-limits",
    "name": "App Rate Limits",
    "description": "Application-level usage quotas and cost guards with fixed-window and token-bucket helpers",
    "category": "Security",
    "version": "1.0.0",
    "tags": [
      "rate-limits",
      "quotas",
      "usage",
      "security",
      "cost-controls"
    ],
    "dependencies": {
      "required": [
        "database",
        "api"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/app-rate-limits.sql",
        "content": "-- Application-level rate limits and usage quotas.\n-- These complement Supabase platform limits; they do not replace Auth/Realtime/Edge guardrails.\n\ncreate table if not exists public.app_rate_limit_rules (\n  key text primary key,\n  algorithm text not null check (algorithm in ('fixed_window', 'token_bucket')),\n  limit_count int not null check (limit_count > 0),\n  window_seconds int not null default 60 check (window_seconds > 0),\n  refill_rate_per_second numeric,\n  burst_count int,\n  metadata jsonb not null default '{}',\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncreate table if not exists public.app_rate_limit_counters (\n  rule_key text not null references public.app_rate_limit_rules(key) on delete cascade,\n  subject text not null,\n  window_start timestamptz not null,\n  count int not null default 0,\n  updated_at timestamptz default now(),\n  primary key (rule_key, subject, window_start)\n);\n\ncreate table if not exists public.app_rate_limit_buckets (\n  rule_key text not null references public.app_rate_limit_rules(key) on delete cascade,\n  subject text not null,\n  tokens numeric not null,\n  last_refill_at timestamptz not null default now(),\n  updated_at timestamptz default now(),\n  primary key (rule_key, subject)\n);\n\ncreate index if not exists app_rate_limit_counters_subject_idx\non public.app_rate_limit_counters (subject, rule_key);\n\nalter table public.app_rate_limit_rules enable row level security;\nalter table public.app_rate_limit_counters enable row level security;\nalter table public.app_rate_limit_buckets enable row level security;\n\ncreate policy \"Authenticated users can read app rate limit rules\"\non public.app_rate_limit_rules for select\nto authenticated\nusing (true);\n\ncreate or replace function public.consume_app_rate_limit(\n  rule_key text,\n  subject text,\n  cost int default 1\n)\nreturns table (\n  allowed boolean,\n  remaining int,\n  reset_at timestamptz,\n  retry_after_seconds int\n)\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  rule public.app_rate_limit_rules;\n  now_at timestamptz := now();\n  window_start_at timestamptz;\n  current_count int;\n  bucket public.app_rate_limit_buckets;\n  refill_rate numeric;\n  burst_limit int;\n  refilled_tokens numeric;\nbegin\n  if cost < 1 then\n    raise exception 'cost must be at least 1';\n  end if;\n\n  select *\n  into rule\n  from public.app_rate_limit_rules\n  where key = consume_app_rate_limit.rule_key;\n\n  if not found then\n    raise exception 'rate limit rule not found: %', rule_key;\n  end if;\n\n  if rule.algorithm = 'fixed_window' then\n    window_start_at := to_timestamp(\n      floor(extract(epoch from now_at) / rule.window_seconds) * rule.window_seconds\n    );\n\n    insert into public.app_rate_limit_counters as counters (\n      rule_key,\n      subject,\n      window_start,\n      count\n    )\n    values (\n      consume_app_rate_limit.rule_key,\n      consume_app_rate_limit.subject,\n      window_start_at,\n      cost\n    )\n    on conflict (rule_key, subject, window_start) do update\n      set count = counters.count + cost,\n          updated_at = now()\n    returning count into current_count;\n\n    allowed := current_count <= rule.limit_count;\n    remaining := greatest(rule.limit_count - current_count, 0);\n    reset_at := window_start_at + make_interval(secs => rule.window_seconds);\n    retry_after_seconds := case\n      when allowed then 0\n      else greatest(ceil(extract(epoch from reset_at - now_at))::int, 1)\n    end;\n\n    return next;\n    return;\n  end if;\n\n  refill_rate := coalesce(rule.refill_rate_per_second, rule.limit_count::numeric / rule.window_seconds);\n  burst_limit := coalesce(rule.burst_count, rule.limit_count);\n\n  insert into public.app_rate_limit_buckets as buckets (\n    rule_key,\n    subject,\n    tokens,\n    last_refill_at\n  )\n  values (\n    consume_app_rate_limit.rule_key,\n    consume_app_rate_limit.subject,\n    burst_limit,\n    now_at\n  )\n  on conflict (rule_key, subject) do nothing;\n\n  select *\n  into bucket\n  from public.app_rate_limit_buckets\n  where app_rate_limit_buckets.rule_key = consume_app_rate_limit.rule_key\n    and app_rate_limit_buckets.subject = consume_app_rate_limit.subject\n  for update;\n\n  refilled_tokens := least(\n    burst_limit,\n    bucket.tokens + greatest(extract(epoch from now_at - bucket.last_refill_at), 0) * refill_rate\n  );\n\n  allowed := refilled_tokens >= cost;\n  remaining := greatest(floor(refilled_tokens - case when allowed then cost else 0 end)::int, 0);\n  reset_at := case\n    when allowed then now_at\n    else now_at + make_interval(secs => ceil((cost - refilled_tokens) / refill_rate)::int)\n  end;\n  retry_after_seconds := case\n    when allowed then 0\n    else greatest(ceil((cost - refilled_tokens) / refill_rate)::int, 1)\n  end;\n\n  update public.app_rate_limit_buckets\n  set tokens = remaining,\n      last_refill_at = now_at,\n      updated_at = now_at\n  where app_rate_limit_buckets.rule_key = consume_app_rate_limit.rule_key\n    and app_rate_limit_buckets.subject = consume_app_rate_limit.subject;\n\n  return next;\nend;\n$$;\n\ncreate or replace function public.check_app_rate_limit(\n  rule_key text,\n  subject text,\n  cost int default 1\n)\nreturns table (\n  allowed boolean,\n  remaining int,\n  reset_at timestamptz,\n  retry_after_seconds int\n)\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  rule public.app_rate_limit_rules;\n  now_at timestamptz := now();\n  window_start_at timestamptz;\n  current_count int := 0;\n  bucket public.app_rate_limit_buckets;\n  refill_rate numeric;\n  burst_limit int;\n  refilled_tokens numeric;\nbegin\n  select *\n  into rule\n  from public.app_rate_limit_rules\n  where key = check_app_rate_limit.rule_key;\n\n  if not found then\n    raise exception 'rate limit rule not found: %', rule_key;\n  end if;\n\n  if rule.algorithm = 'fixed_window' then\n    window_start_at := to_timestamp(\n      floor(extract(epoch from now_at) / rule.window_seconds) * rule.window_seconds\n    );\n\n    select count\n    into current_count\n    from public.app_rate_limit_counters\n    where app_rate_limit_counters.rule_key = check_app_rate_limit.rule_key\n      and app_rate_limit_counters.subject = check_app_rate_limit.subject\n      and window_start = window_start_at;\n\n    current_count := coalesce(current_count, 0);\n    allowed := current_count + cost <= rule.limit_count;\n    remaining := greatest(rule.limit_count - current_count, 0);\n    reset_at := window_start_at + make_interval(secs => rule.window_seconds);\n    retry_after_seconds := case\n      when allowed then 0\n      else greatest(ceil(extract(epoch from reset_at - now_at))::int, 1)\n    end;\n\n    return next;\n    return;\n  end if;\n\n  refill_rate := coalesce(rule.refill_rate_per_second, rule.limit_count::numeric / rule.window_seconds);\n  burst_limit := coalesce(rule.burst_count, rule.limit_count);\n\n  select *\n  into bucket\n  from public.app_rate_limit_buckets\n  where app_rate_limit_buckets.rule_key = check_app_rate_limit.rule_key\n    and app_rate_limit_buckets.subject = check_app_rate_limit.subject;\n\n  if not found then\n    refilled_tokens := burst_limit;\n  else\n    refilled_tokens := least(\n      burst_limit,\n      bucket.tokens + greatest(extract(epoch from now_at - bucket.last_refill_at), 0) * refill_rate\n    );\n  end if;\n\n  allowed := refilled_tokens >= cost;\n  remaining := floor(refilled_tokens)::int;\n  reset_at := case\n    when allowed then now_at\n    else now_at + make_interval(secs => ceil((cost - refilled_tokens) / refill_rate)::int)\n  end;\n  retry_after_seconds := case\n    when allowed then 0\n    else greatest(ceil((cost - refilled_tokens) / refill_rate)::int, 1)\n  end;\n\n  return next;\nend;\n$$;\n\ncreate or replace function public.reset_app_rate_limit(\n  rule_key text,\n  subject text\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  delete from public.app_rate_limit_counters\n  where app_rate_limit_counters.rule_key = reset_app_rate_limit.rule_key\n    and app_rate_limit_counters.subject = reset_app_rate_limit.subject;\n\n  delete from public.app_rate_limit_buckets\n  where app_rate_limit_buckets.rule_key = reset_app_rate_limit.rule_key\n    and app_rate_limit_buckets.subject = reset_app_rate_limit.subject;\nend;\n$$;\n\ninsert into public.app_rate_limit_rules (\n  key,\n  algorithm,\n  limit_count,\n  window_seconds,\n  metadata\n)\nvalues (\n  'ai.generations.daily',\n  'fixed_window',\n  10,\n  86400,\n  '{\"description\": \"Example daily AI generation quota per user or organization\"}'\n)\non conflict (key) do nothing;\n"
      }
    ],
    "readme": "# App rate limits template\n\nAdds application-level quotas for product behavior. This does not replace Supabase Auth, Realtime, or Edge platform limits. Use it for limits like \"10 AI generations per user per day\", \"100 exports per organization per hour\", or \"3 invite emails per workspace per minute\".\n\n## Includes\n\n- Rule table for fixed-window and token-bucket limits\n- Counter and bucket state tables\n- `public.consume_app_rate_limit(...)` RPC for atomic checks and consumption\n- `public.reset_app_rate_limit(...)` RPC for admin resets\n\n## Example\n\n```sql\ninsert into public.app_rate_limit_rules (\n  key,\n  algorithm,\n  limit_count,\n  window_seconds\n)\nvalues ('ai.generations.daily', 'fixed_window', 10, 86400);\n\nselect *\nfrom public.consume_app_rate_limit('ai.generations.daily', auth.uid()::text);\n```"
  },
  {
    "id": "functions-resend-email",
    "name": "Resend Email",
    "description": "Queued transactional email delivery with Resend, Edge Functions, and delivery status tracking",
    "category": "Integrations",
    "version": "1.0.0",
    "tags": [
      "email",
      "resend",
      "functions",
      "pgmq",
      "transactional"
    ],
    "dependencies": {
      "required": [
        "database",
        "functions"
      ],
      "optional": [
        "queues"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/resend-webhook/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\nimport { z } from 'npm:zod@3'\n\nconst webhookSchema = z.object({\n  type: z.string(),\n  data: z\n    .object({\n      email_id: z.string().optional(),\n      id: z.string().optional(),\n      last_event: z.string().optional(),\n    })\n    .passthrough(),\n})\n\nconst supabase = createClient(\n  Deno.env.get('SUPABASE_URL')!,\n  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n)\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  const parseResult = webhookSchema.safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const event = parseResult.data\n  const providerMessageId = event.data.email_id ?? event.data.id\n\n  if (!providerMessageId) {\n    return Response.json({ skipped: true, reason: 'missing provider message id' })\n  }\n\n  const status = toEmailStatus(event.type, event.data.last_event)\n\n  const { error } = await supabase\n    .from('email_messages')\n    .update({\n      status,\n      error: status === 'failed' ? event.type : null,\n      updated_at: new Date().toISOString(),\n    })\n    .eq('provider_message_id', providerMessageId)\n\n  if (error) {\n    return Response.json({ error: error.message }, { status: 500 })\n  }\n\n  return Response.json({ received: true })\n})\n\nfunction toEmailStatus(type: string, lastEvent?: string): 'sent' | 'failed' {\n  const eventName = `${type}:${lastEvent ?? ''}`.toLowerCase()\n  return eventName.includes('bounced') || eventName.includes('complained') ? 'failed' : 'sent'\n}\n"
      },
      {
        "path": "supabase/functions/send-email/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'\nimport { z } from 'npm:zod@3'\n\nconst QUEUE_NAME = 'email_jobs'\nconst RESEND_API_URL = 'https://api.resend.com/emails'\n\nconst jobSchema = z.object({\n  jobId: z.number(),\n  emailId: z.string().uuid(),\n})\n\ntype Job = z.infer<typeof jobSchema>\n\ntype EmailMessage = {\n  id: string\n  to_email: string[]\n  from_email: string | null\n  subject: string\n  html: string | null\n  text: string | null\n  tags: Record<string, unknown>\n  attempts: number\n  max_attempts: number\n}\n\nconst sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)\nconst resendApiKey = Deno.env.get('RESEND_API_KEY')\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  if (!resendApiKey) {\n    return Response.json({ error: 'missing RESEND_API_KEY secret' }, { status: 500 })\n  }\n\n  const parseResult = z.array(jobSchema).safeParse(await req.json())\n\n  if (!parseResult.success) {\n    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })\n  }\n\n  const completedJobs: Job[] = []\n  const failedJobs: Array<Job & { error: string }> = []\n\n  for (const job of parseResult.data) {\n    try {\n      await processJob(job)\n      completedJobs.push(job)\n    } catch (error) {\n      failedJobs.push({\n        ...job,\n        error: error instanceof Error ? error.message : JSON.stringify(error),\n      })\n    }\n  }\n\n  return Response.json({ completedJobs, failedJobs })\n})\n\nasync function processJob({ jobId, emailId }: Job) {\n  const [email] = await sql<EmailMessage[]>`\n    select *\n    from public.email_messages\n    where id = ${emailId}\n  `\n\n  if (!email) {\n    await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n    throw new Error(`email message not found: ${emailId}`)\n  }\n\n  if (email.attempts >= email.max_attempts) {\n    await markFailed(emailId, 'maximum attempts reached')\n    await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n    return\n  }\n\n  await sql`\n    update public.email_messages\n    set status = 'sending',\n        attempts = attempts + 1,\n        updated_at = now()\n    where id = ${emailId}\n  `\n\n  const response = await fetch(RESEND_API_URL, {\n    method: 'POST',\n    headers: {\n      Authorization: `Bearer ${resendApiKey}`,\n      'Content-Type': 'application/json',\n    },\n    body: JSON.stringify({\n      from: email.from_email ?? Deno.env.get('RESEND_FROM_EMAIL'),\n      to: email.to_email,\n      subject: email.subject,\n      html: email.html ?? undefined,\n      text: email.text ?? undefined,\n      tags: toResendTags(email.tags),\n    }),\n  })\n\n  const payload = await response.json().catch(() => ({}))\n\n  if (!response.ok) {\n    const error = typeof payload?.message === 'string' ? payload.message : response.statusText\n    const exhausted = email.attempts + 1 >= email.max_attempts\n    await markFailed(emailId, error, exhausted)\n    if (exhausted) {\n      await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n    }\n    throw new Error(error)\n  }\n\n  await sql`\n    update public.email_messages\n    set status = 'sent',\n        provider_message_id = ${payload.id ?? null},\n        sent_at = now(),\n        error = null,\n        updated_at = now()\n    where id = ${emailId}\n  `\n\n  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`\n}\n\nasync function markFailed(emailId: string, error: string, exhausted = true) {\n  await sql`\n    update public.email_messages\n    set status = ${exhausted ? 'failed' : 'queued'},\n        error = ${error},\n        updated_at = now()\n    where id = ${emailId}\n  `\n}\n\nfunction toResendTags(tags: Record<string, unknown>) {\n  return Object.entries(tags)\n    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')\n    .map(([name, value]) => ({ name, value }))\n}\n"
      },
      {
        "path": "supabase/schemas/resend-email.sql",
        "content": "-- Queued transactional email delivery with Resend.\n\ncreate extension if not exists pgmq;\ncreate extension if not exists pg_net with schema extensions;\ncreate extension if not exists pg_cron;\n\ncreate schema if not exists util;\n\ncreate or replace function util.project_url()\nreturns text\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  secret_value text;\nbegin\n  select decrypted_secret into secret_value\n  from vault.decrypted_secrets\n  where name = 'project_url';\n\n  return secret_value;\nend;\n$$;\n\ncreate or replace function util.invoke_edge_function(\n  name text,\n  body jsonb,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  headers_raw text;\n  auth_header text;\nbegin\n  headers_raw := current_setting('request.headers', true);\n\n  auth_header := case\n    when headers_raw is not null then (headers_raw::json ->> 'authorization')\n    else null\n  end;\n\n  perform net.http_post(\n    url => util.project_url() || '/functions/v1/' || name,\n    headers => jsonb_build_object(\n      'Content-Type', 'application/json',\n      'Authorization', auth_header\n    ),\n    body => body,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\ncreate table if not exists public.email_messages (\n  id uuid primary key default gen_random_uuid(),\n  to_email text[] not null check (array_length(to_email, 1) > 0),\n  from_email text,\n  subject text not null,\n  html text,\n  text text,\n  tags jsonb not null default '{}',\n  status text not null default 'queued' check (\n    status in ('queued', 'sending', 'sent', 'failed', 'cancelled')\n  ),\n  provider_message_id text,\n  error text,\n  scheduled_at timestamptz not null default now(),\n  sent_at timestamptz,\n  attempts int not null default 0,\n  max_attempts int not null default 3,\n  created_by uuid references auth.users(id) on delete set null,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now(),\n  check (html is not null or text is not null)\n);\n\ncreate index if not exists email_messages_status_scheduled_at_idx\non public.email_messages (status, scheduled_at);\n\ncreate index if not exists email_messages_provider_message_id_idx\non public.email_messages (provider_message_id);\n\nalter table public.email_messages enable row level security;\n\ncreate policy \"Users can read their own email messages\"\non public.email_messages for select\nto authenticated\nusing (created_by = auth.uid());\n\nselect pgmq.create('email_jobs');\n\ncreate or replace function public.enqueue_email(\n  to_email text[],\n  subject text,\n  html text default null,\n  text text default null,\n  from_email text default null,\n  tags jsonb default '{}',\n  scheduled_at timestamptz default now(),\n  max_attempts int default 3\n)\nreturns uuid\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  email_id uuid;\nbegin\n  insert into public.email_messages (\n    to_email,\n    from_email,\n    subject,\n    html,\n    text,\n    tags,\n    scheduled_at,\n    max_attempts,\n    created_by\n  )\n  values (\n    enqueue_email.to_email,\n    enqueue_email.from_email,\n    enqueue_email.subject,\n    enqueue_email.html,\n    enqueue_email.text,\n    enqueue_email.tags,\n    enqueue_email.scheduled_at,\n    greatest(enqueue_email.max_attempts, 1),\n    auth.uid()\n  )\n  returning id into email_id;\n\n  perform pgmq.send(\n    queue_name => 'email_jobs',\n    msg => jsonb_build_object('emailId', email_id)\n  );\n\n  return email_id;\nend;\n$$;\n\ncreate or replace function util.process_email_queue(\n  batch_size int default 10,\n  timeout_milliseconds int default 300000\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  jobs jsonb;\nbegin\n  with queued_jobs as (\n    select message || jsonb_build_object('jobId', msg_id) as job\n    from pgmq.read(\n      queue_name => 'email_jobs',\n      vt => timeout_milliseconds / 1000,\n      qty => batch_size\n    )\n  )\n  select jsonb_agg(job)\n  into jobs\n  from queued_jobs;\n\n  if jobs is null then\n    return;\n  end if;\n\n  perform util.invoke_edge_function(\n    name => 'send-email',\n    body => jobs,\n    timeout_milliseconds => timeout_milliseconds\n  );\nend;\n$$;\n\nselect cron.schedule(\n  'process-email-queue',\n  '10 seconds',\n  $$ select util.process_email_queue(); $$\n);\n"
      }
    ],
    "readme": "# Resend email template\n\nAdds a queued transactional email pipeline using Resend. Application code enqueues an email in Postgres, `pg_cron` invokes an Edge Function worker, and delivery status is tracked in `public.email_messages`.\n\n## How it works\n\n1. Call `public.enqueue_email(...)`.\n2. The email row is inserted with `queued` status and a message is sent to the `email_jobs` queue.\n3. A cron job invokes the `send-email` worker with queued jobs.\n4. The worker calls Resend and updates the row to `sent` or `failed`.\n5. The `resend-webhook` function provides a small status update placeholder for Resend webhooks.\n\n## Configuration\n\nSet these secrets:\n\n```sh\nsupabase secrets set RESEND_API_KEY=...\nsupabase secrets set RESEND_FROM_EMAIL=\"Acme <hello@example.com>\"\n```\n\n## Includes\n\n- `supabase/schemas/resend-email.sql` - email table, queue helpers, and cron dispatcher\n- `supabase/functions/send-email/index.ts` - Resend worker\n- `supabase/functions/resend-webhook/index.ts` - delivery webhook placeholder"
  },
  {
    "id": "presence-rooms",
    "name": "Presence Rooms",
    "description": "Durable rooms, memberships, last-seen state, and RLS to complement Supabase Realtime Presence",
    "category": "Realtime",
    "version": "1.0.0",
    "tags": [
      "realtime",
      "presence",
      "rooms",
      "collaboration",
      "auth",
      "rls"
    ],
    "dependencies": {
      "required": [
        "database",
        "auth"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/presence-rooms.sql",
        "content": "-- Durable room and membership state for Supabase Realtime Presence.\n-- Use native Realtime Presence for ephemeral sync/join/leave events.\n\ncreate table if not exists public.presence_rooms (\n  id uuid primary key default gen_random_uuid(),\n  slug text unique,\n  name text not null,\n  metadata jsonb not null default '{}',\n  created_by uuid references auth.users(id) on delete set null default auth.uid(),\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncreate table if not exists public.presence_room_members (\n  room_id uuid not null references public.presence_rooms(id) on delete cascade,\n  user_id uuid not null references auth.users(id) on delete cascade,\n  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),\n  joined_at timestamptz default now(),\n  primary key (room_id, user_id)\n);\n\ncreate table if not exists public.presence_room_heartbeats (\n  room_id uuid not null references public.presence_rooms(id) on delete cascade,\n  user_id uuid not null references auth.users(id) on delete cascade,\n  presence_key text not null,\n  status text not null default 'online' check (status in ('online', 'away', 'offline')),\n  metadata jsonb not null default '{}',\n  last_seen_at timestamptz not null default now(),\n  expires_at timestamptz not null default now() + interval '2 minutes',\n  primary key (room_id, presence_key)\n);\n\ncreate index if not exists presence_room_members_user_id_idx\non public.presence_room_members (user_id);\n\ncreate index if not exists presence_room_heartbeats_room_seen_idx\non public.presence_room_heartbeats (room_id, last_seen_at desc);\n\nalter table public.presence_rooms enable row level security;\nalter table public.presence_room_members enable row level security;\nalter table public.presence_room_heartbeats enable row level security;\n\ncreate or replace function public.is_presence_room_member(\n  room_id uuid,\n  allowed_roles text[] default null\n)\nreturns boolean\nlanguage sql\nstable\nsecurity definer\nset search_path = ''\nas $$\n  select exists (\n    select 1\n    from public.presence_room_members m\n    where m.room_id = is_presence_room_member.room_id\n      and m.user_id = auth.uid()\n      and (\n        is_presence_room_member.allowed_roles is null\n        or m.role = any(is_presence_room_member.allowed_roles)\n      )\n  );\n$$;\n\ncreate policy \"Room members can read rooms\"\non public.presence_rooms for select\nto authenticated\nusing (public.is_presence_room_member(id));\n\ncreate policy \"Authenticated users can create rooms\"\non public.presence_rooms for insert\nto authenticated\nwith check (created_by = auth.uid());\n\ncreate policy \"Room admins can update rooms\"\non public.presence_rooms for update\nto authenticated\nusing (public.is_presence_room_member(id, array['owner', 'admin']));\n\ncreate policy \"Room members can read memberships\"\non public.presence_room_members for select\nto authenticated\nusing (public.is_presence_room_member(room_id));\n\ncreate policy \"Room admins can manage memberships\"\non public.presence_room_members for all\nto authenticated\nusing (public.is_presence_room_member(room_id, array['owner', 'admin']))\nwith check (public.is_presence_room_member(room_id, array['owner', 'admin']));\n\ncreate policy \"Room members can read room heartbeats\"\non public.presence_room_heartbeats for select\nto authenticated\nusing (public.is_presence_room_member(room_id));\n\ncreate policy \"Users can update their own heartbeat\"\non public.presence_room_heartbeats for all\nto authenticated\nusing (user_id = auth.uid())\nwith check (user_id = auth.uid());\n\ncreate or replace function public.create_presence_room(\n  name text,\n  slug text default null,\n  metadata jsonb default '{}'\n)\nreturns uuid\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  room_id uuid;\nbegin\n  insert into public.presence_rooms (name, slug, metadata, created_by)\n  values (\n    create_presence_room.name,\n    create_presence_room.slug,\n    create_presence_room.metadata,\n    auth.uid()\n  )\n  returning id into room_id;\n\n  insert into public.presence_room_members (room_id, user_id, role)\n  values (room_id, auth.uid(), 'owner');\n\n  return room_id;\nend;\n$$;\n\ncreate or replace function public.touch_presence_room(\n  room_id uuid,\n  presence_key text,\n  status text default 'online',\n  metadata jsonb default '{}',\n  ttl_seconds int default 120\n)\nreturns void\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\nbegin\n  if not exists (\n    select 1\n    from public.presence_room_members m\n    where m.room_id = touch_presence_room.room_id\n      and m.user_id = auth.uid()\n  ) then\n    raise exception 'user is not a member of room %', room_id;\n  end if;\n\n  insert into public.presence_room_heartbeats (\n    room_id,\n    user_id,\n    presence_key,\n    status,\n    metadata,\n    last_seen_at,\n    expires_at\n  )\n  values (\n    touch_presence_room.room_id,\n    auth.uid(),\n    touch_presence_room.presence_key,\n    touch_presence_room.status,\n    touch_presence_room.metadata,\n    now(),\n    now() + make_interval(secs => greatest(touch_presence_room.ttl_seconds, 30))\n  )\n  on conflict (room_id, presence_key) do update\n    set status = excluded.status,\n        metadata = excluded.metadata,\n        last_seen_at = excluded.last_seen_at,\n        expires_at = excluded.expires_at;\nend;\n$$;\n\ncreate or replace function public.cleanup_presence_room_heartbeats()\nreturns int\nlanguage plpgsql\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  updated_count int;\nbegin\n  update public.presence_room_heartbeats\n  set status = 'offline'\n  where status <> 'offline'\n    and expires_at < now();\n\n  get diagnostics updated_count = row_count;\n  return updated_count;\nend;\n$$;\n\nalter publication supabase_realtime add table public.presence_room_heartbeats;\n"
      }
    ],
    "readme": "# Presence rooms template\n\nComplements Supabase Realtime Presence with durable room and membership data. Supabase Presence remains the source of truth for ephemeral online state; these tables answer durable questions like who can join a room, who was last seen, and which rooms exist.\n\n## How it works\n\n1. Create a room in `public.presence_rooms`.\n2. Add members to `public.presence_room_members`.\n3. Clients subscribe to a Realtime channel such as `presence-room:<room_id>` and use native Presence `track()` / `untrack()`.\n4. Clients can periodically call `public.touch_presence_room(...)` to persist last-seen state for server rendering, reconnects, or audit views.\n5. A cleanup helper marks expired heartbeat rows offline.\n\n## Includes\n\n- `supabase/schemas/presence-rooms.sql` - rooms, memberships, heartbeat table, RLS, cleanup helper, and Realtime publication\n\n## Notes\n\nThis template does not reimplement Supabase Realtime Presence. Use the Realtime client for live `sync`, `join`, and `leave` events, and use these tables for authorization and durable state."
  },
  {
    "id": "feature-flags",
    "name": "Feature Flags",
    "description": "Projects, environments, rollout rules, variants, overrides, and SQL flag evaluation",
    "category": "Database",
    "version": "1.0.0",
    "tags": [
      "feature-flags",
      "experiments",
      "rollouts",
      "targeting",
      "database"
    ],
    "dependencies": {
      "required": [
        "database",
        "api",
        "auth"
      ]
    },
    "files": [
      {
        "path": "supabase/schemas/feature-flags.sql",
        "content": "-- Feature flags with environments, variants, JSONB targeting, overrides, and SQL evaluation.\n\ncreate table if not exists public.feature_flag_projects (\n  id uuid primary key default gen_random_uuid(),\n  slug text not null unique,\n  name text not null,\n  created_by uuid references auth.users(id) on delete set null default auth.uid(),\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncreate table if not exists public.feature_flag_environments (\n  id uuid primary key default gen_random_uuid(),\n  project_id uuid not null references public.feature_flag_projects(id) on delete cascade,\n  key text not null,\n  name text not null,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now(),\n  unique (project_id, key)\n);\n\ncreate table if not exists public.feature_flags (\n  id uuid primary key default gen_random_uuid(),\n  project_id uuid not null references public.feature_flag_projects(id) on delete cascade,\n  key text not null,\n  name text not null,\n  description text,\n  enabled boolean not null default false,\n  default_value jsonb not null default 'true',\n  rollout_percentage numeric not null default 100 check (\n    rollout_percentage >= 0 and rollout_percentage <= 100\n  ),\n  created_at timestamptz default now(),\n  updated_at timestamptz default now(),\n  unique (project_id, key)\n);\n\ncreate table if not exists public.feature_flag_variants (\n  id uuid primary key default gen_random_uuid(),\n  flag_id uuid not null references public.feature_flags(id) on delete cascade,\n  key text not null,\n  value jsonb not null default 'true',\n  weight int not null default 1 check (weight > 0),\n  created_at timestamptz default now(),\n  unique (flag_id, key)\n);\n\ncreate table if not exists public.feature_flag_rules (\n  id uuid primary key default gen_random_uuid(),\n  flag_id uuid not null references public.feature_flags(id) on delete cascade,\n  environment_id uuid references public.feature_flag_environments(id) on delete cascade,\n  priority int not null default 100,\n  name text,\n  conditions jsonb not null default '{}',\n  enabled boolean not null default true,\n  variant_key text,\n  value jsonb,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);\n\ncreate table if not exists public.feature_flag_overrides (\n  id uuid primary key default gen_random_uuid(),\n  flag_id uuid not null references public.feature_flags(id) on delete cascade,\n  environment_id uuid references public.feature_flag_environments(id) on delete cascade,\n  subject_key text not null,\n  enabled boolean not null default true,\n  variant_key text,\n  value jsonb,\n  reason text,\n  created_at timestamptz default now(),\n  updated_at timestamptz default now(),\n  unique (flag_id, environment_id, subject_key)\n);\n\ncreate table if not exists public.feature_flag_audit_events (\n  id uuid primary key default gen_random_uuid(),\n  project_id uuid references public.feature_flag_projects(id) on delete cascade,\n  actor_id uuid references auth.users(id) on delete set null default auth.uid(),\n  action text not null,\n  target_type text not null,\n  target_id uuid,\n  payload jsonb not null default '{}',\n  created_at timestamptz default now()\n);\n\ncreate index if not exists feature_flag_rules_lookup_idx\non public.feature_flag_rules (flag_id, environment_id, priority);\n\ncreate index if not exists feature_flag_overrides_lookup_idx\non public.feature_flag_overrides (flag_id, environment_id, subject_key);\n\nalter table public.feature_flag_projects enable row level security;\nalter table public.feature_flag_environments enable row level security;\nalter table public.feature_flags enable row level security;\nalter table public.feature_flag_variants enable row level security;\nalter table public.feature_flag_rules enable row level security;\nalter table public.feature_flag_overrides enable row level security;\nalter table public.feature_flag_audit_events enable row level security;\n\ncreate policy \"Authenticated users can read feature flag projects\"\non public.feature_flag_projects for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read feature flag environments\"\non public.feature_flag_environments for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read feature flags\"\non public.feature_flags for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read feature flag variants\"\non public.feature_flag_variants for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read feature flag rules\"\non public.feature_flag_rules for select\nto authenticated\nusing (true);\n\ncreate policy \"Authenticated users can read their feature flag overrides\"\non public.feature_flag_overrides for select\nto authenticated\nusing (subject_key = auth.uid()::text);\n\ncreate or replace function public.pick_feature_flag_variant(\n  flag_id uuid,\n  subject_key text\n)\nreturns table (\n  variant_key text,\n  value jsonb\n)\nlanguage plpgsql\nstable\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  total_weight int;\n  bucket int;\n  running_weight int := 0;\n  variant record;\nbegin\n  select coalesce(sum(weight), 0)\n  into total_weight\n  from public.feature_flag_variants\n  where feature_flag_variants.flag_id = pick_feature_flag_variant.flag_id;\n\n  if total_weight = 0 then\n    return;\n  end if;\n\n  bucket := mod(\n    abs(hashtext(pick_feature_flag_variant.flag_id::text || ':' || pick_feature_flag_variant.subject_key)),\n    total_weight\n  );\n\n  for variant in\n    select key, value, weight\n    from public.feature_flag_variants\n    where feature_flag_variants.flag_id = pick_feature_flag_variant.flag_id\n    order by key\n  loop\n    running_weight := running_weight + variant.weight;\n    if bucket < running_weight then\n      variant_key := variant.key;\n      value := variant.value;\n      return next;\n      return;\n    end if;\n  end loop;\nend;\n$$;\n\ncreate or replace function public.evaluate_feature_flag(\n  project_slug text,\n  environment_key text,\n  flag_key text,\n  subject_key text default auth.uid()::text,\n  attributes jsonb default '{}'\n)\nreturns table (\n  enabled boolean,\n  variant_key text,\n  value jsonb,\n  reason text\n)\nlanguage plpgsql\nstable\nsecurity definer\nset search_path = ''\nas $$\ndeclare\n  target_project public.feature_flag_projects;\n  target_environment public.feature_flag_environments;\n  target_flag public.feature_flags;\n  override_row public.feature_flag_overrides;\n  rule_row public.feature_flag_rules;\n  picked_variant record;\n  rollout_bucket numeric;\nbegin\n  select *\n  into target_project\n  from public.feature_flag_projects\n  where slug = evaluate_feature_flag.project_slug;\n\n  if not found then\n    enabled := false;\n    variant_key := null;\n    value := 'false';\n    reason := 'project_not_found';\n    return next;\n    return;\n  end if;\n\n  select *\n  into target_environment\n  from public.feature_flag_environments\n  where project_id = target_project.id\n    and key = evaluate_feature_flag.environment_key;\n\n  if not found then\n    enabled := false;\n    variant_key := null;\n    value := 'false';\n    reason := 'environment_not_found';\n    return next;\n    return;\n  end if;\n\n  select *\n  into target_flag\n  from public.feature_flags\n  where project_id = target_project.id\n    and key = evaluate_feature_flag.flag_key;\n\n  if not found then\n    enabled := false;\n    variant_key := null;\n    value := 'false';\n    reason := 'flag_not_found';\n    return next;\n    return;\n  end if;\n\n  select *\n  into override_row\n  from public.feature_flag_overrides\n  where flag_id = target_flag.id\n    and environment_id = target_environment.id\n    and subject_key = evaluate_feature_flag.subject_key;\n\n  if found then\n    enabled := override_row.enabled;\n    variant_key := override_row.variant_key;\n    value := coalesce(override_row.value, target_flag.default_value);\n    reason := 'override';\n    return next;\n    return;\n  end if;\n\n  if not target_flag.enabled then\n    enabled := false;\n    variant_key := null;\n    value := target_flag.default_value;\n    reason := 'flag_disabled';\n    return next;\n    return;\n  end if;\n\n  select *\n  into rule_row\n  from public.feature_flag_rules\n  where flag_id = target_flag.id\n    and enabled = true\n    and (environment_id is null or environment_id = target_environment.id)\n    and evaluate_feature_flag.attributes @> conditions\n  order by priority asc, created_at asc\n  limit 1;\n\n  if found then\n    enabled := true;\n    variant_key := rule_row.variant_key;\n    value := coalesce(rule_row.value, target_flag.default_value);\n    reason := 'rule';\n    return next;\n    return;\n  end if;\n\n  rollout_bucket := mod(\n    abs(hashtext(target_flag.id::text || ':' || evaluate_feature_flag.subject_key)),\n    10000\n  ) / 100.0;\n\n  if rollout_bucket >= target_flag.rollout_percentage then\n    enabled := false;\n    variant_key := null;\n    value := target_flag.default_value;\n    reason := 'rollout';\n    return next;\n    return;\n  end if;\n\n  select *\n  into picked_variant\n  from public.pick_feature_flag_variant(target_flag.id, evaluate_feature_flag.subject_key)\n  limit 1;\n\n  enabled := true;\n  variant_key := picked_variant.variant_key;\n  value := coalesce(picked_variant.value, target_flag.default_value);\n  reason := case when picked_variant.variant_key is null then 'default' else 'variant' end;\n  return next;\nend;\n$$;\n\ninsert into public.feature_flag_projects (slug, name)\nvalues ('app', 'Application')\non conflict (slug) do nothing;\n\ninsert into public.feature_flag_environments (project_id, key, name)\nselect id, 'production', 'Production'\nfrom public.feature_flag_projects\nwhere slug = 'app'\non conflict (project_id, key) do nothing;\n"
      }
    ],
    "readme": "# Feature flags template\n\nAdds a Postgres-backed feature flag model with environments, variants, JSONB audience rules, subject overrides, audit events, and an evaluation RPC.\n\n## Includes\n\n- Projects and environments\n- Flags with global enablement and rollout percentage\n- Optional variants with weights\n- Audience rules using JSONB containment against caller attributes\n- Per-subject overrides\n- `public.evaluate_feature_flag(...)` RPC\n\n## Example\n\n```sql\nselect *\nfrom public.evaluate_feature_flag(\n  project_slug => 'app',\n  environment_key => 'production',\n  flag_key => 'new_onboarding',\n  subject_key => auth.uid()::text,\n  attributes => '{\"plan\": \"pro\"}'\n);\n```\n\nAudience rules match when `attributes @> conditions`, so a rule with `{\"plan\": \"pro\"}` matches callers whose attributes include that key/value pair."
  },
  {
    "id": "mcp-server",
    "name": "MCP Server",
    "description": "Edge Function MCP server with a tool registry for exposing project capabilities to MCP clients",
    "category": "AI",
    "version": "1.0.0",
    "tags": [
      "mcp",
      "ai",
      "tools",
      "functions"
    ],
    "dependencies": {
      "required": [
        "database",
        "api",
        "functions"
      ]
    },
    "files": [
      {
        "path": "supabase/functions/mcp-server/index.ts",
        "content": "import 'jsr:@supabase/functions-js/edge-runtime.d.ts'\n\nimport { createClient } from 'jsr:@supabase/supabase-js@2'\n\nimport { getTool, listTools } from './registry.ts'\n\nimport './tools/index.ts'\n\nconst SERVER_INFO = {\n  name: 'supabase-mcp-server',\n  version: '0.1.0',\n}\n\nconst PROTOCOL_VERSION = '2024-11-05'\n\ntype JsonRpcRequest = {\n  jsonrpc: '2.0'\n  id?: string | number | null\n  method: string\n  params?: Record<string, unknown>\n}\n\nfunction rpcResult(id: JsonRpcRequest['id'], result: unknown) {\n  return Response.json({ jsonrpc: '2.0', id: id ?? null, result })\n}\n\nfunction rpcError(id: JsonRpcRequest['id'], code: number, message: string) {\n  return Response.json({\n    jsonrpc: '2.0',\n    id: id ?? null,\n    error: { code, message },\n  })\n}\n\nDeno.serve(async (req) => {\n  if (req.method !== 'POST') {\n    return new Response('expected POST request', { status: 405 })\n  }\n\n  let body: JsonRpcRequest\n  try {\n    body = await req.json()\n  } catch {\n    return rpcError(null, -32700, 'parse error')\n  }\n\n  const supabase = createClient(\n    Deno.env.get('SUPABASE_URL')!,\n    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!\n  )\n\n  switch (body.method) {\n    case 'initialize':\n      return rpcResult(body.id, {\n        protocolVersion: PROTOCOL_VERSION,\n        serverInfo: SERVER_INFO,\n        capabilities: { tools: {} },\n      })\n\n    case 'tools/list':\n      return rpcResult(body.id, {\n        tools: listTools().map(({ name, description, inputSchema }) => ({\n          name,\n          description,\n          inputSchema,\n        })),\n      })\n\n    case 'tools/call': {\n      const name = String(body.params?.name ?? '')\n      const args = (body.params?.arguments ?? {}) as Record<string, unknown>\n      const tool = getTool(name)\n\n      if (!tool) {\n        return rpcError(body.id, -32601, `unknown tool: ${name}`)\n      }\n\n      try {\n        const result = await tool.handler(args, { supabase, request: req })\n        return rpcResult(body.id, {\n          content: [{ type: 'text', text: JSON.stringify(result) }],\n        })\n      } catch (err) {\n        return rpcResult(body.id, {\n          isError: true,\n          content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],\n        })\n      }\n    }\n\n    default:\n      return rpcError(body.id, -32601, `unknown method: ${body.method}`)\n  }\n})\n"
      },
      {
        "path": "supabase/functions/mcp-server/registry.ts",
        "content": "import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'\n\nexport type JsonSchema = {\n  type: 'object'\n  properties?: Record<string, unknown>\n  required?: string[]\n  additionalProperties?: boolean\n}\n\nexport type ToolContext = {\n  supabase: SupabaseClient\n  request: Request\n}\n\nexport type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>\n\nexport type Tool = {\n  name: string\n  description: string\n  inputSchema: JsonSchema\n  handler: ToolHandler\n}\n\nconst tools = new Map<string, Tool>()\n\nexport function registerTool(tool: Tool): void {\n  if (tools.has(tool.name)) {\n    throw new Error(`tool already registered: ${tool.name}`)\n  }\n  tools.set(tool.name, tool)\n}\n\nexport function getTool(name: string): Tool | undefined {\n  return tools.get(name)\n}\n\nexport function listTools(): Tool[] {\n  return Array.from(tools.values())\n}\n"
      },
      {
        "path": "supabase/functions/mcp-server/tools/echo.ts",
        "content": "import { registerTool } from '../registry.ts'\n\nregisterTool({\n  name: 'echo',\n  description: 'Echoes the provided message back. Useful for connectivity checks.',\n  inputSchema: {\n    type: 'object',\n    properties: {\n      message: { type: 'string', description: 'Text to echo back.' },\n    },\n    required: ['message'],\n    additionalProperties: false,\n  },\n  async handler(args) {\n    return { message: String(args.message ?? '') }\n  },\n})\n"
      },
      {
        "path": "supabase/functions/mcp-server/tools/index.ts",
        "content": "// Import each tool module so it self-registers with the registry.\n// To add a new tool: create a file under ./tools and import it below.\nimport './echo.ts'\nimport './list-tables.ts'\n"
      },
      {
        "path": "supabase/functions/mcp-server/tools/list-tables.ts",
        "content": "import { registerTool } from '../registry.ts'\n\nregisterTool({\n  name: 'list_tables',\n  description: 'List tables in a schema of the connected Supabase database.',\n  inputSchema: {\n    type: 'object',\n    properties: {\n      schema: {\n        type: 'string',\n        description: 'Schema name to inspect. Defaults to \"public\".',\n      },\n    },\n    additionalProperties: false,\n  },\n  async handler(args, { supabase }) {\n    const schema = typeof args.schema === 'string' ? args.schema : 'public'\n\n    const { data, error } = await supabase\n      .schema('information_schema')\n      .from('tables')\n      .select('table_name')\n      .eq('table_schema', schema)\n      .order('table_name')\n\n    if (error) throw new Error(error.message)\n\n    return { schema, tables: data?.map((t) => t.table_name) ?? [] }\n  },\n})\n"
      },
      {
        "path": "supabase/seed.sql",
        "content": "-- MCP server notes:\n-- 1. The MCP server is implemented as an Edge Function at supabase/functions/mcp-server.\n-- 2. Tools are registered via the registry in functions/mcp-server/registry.ts.\n--    Add new tools under functions/mcp-server/tools/ and import them in tools/index.ts.\n-- 3. Local endpoint: http://127.0.0.1:54321/functions/v1/mcp-server\n-- 4. Configure your MCP client (e.g. Cursor) to point at that URL.\n"
      }
    ],
    "readme": "# MCP server template\n\nScaffolds a Model Context Protocol server as a Supabase Edge Function. The function speaks JSON-RPC over HTTP and exposes tools that are declared through a small registry.\n\nThis composes with the **Agent** template: `agent-chat` can connect to this Edge Function and expose its tools to the model. By default, the agent looks for a local MCP server at `${SUPABASE_URL}/functions/v1/mcp-server`; you can also register additional servers in `public.agent_mcp_servers`.\n\n## Includes\n\n- `supabase/functions/mcp-server/index.ts` — JSON-RPC entrypoint handling `initialize`, `tools/list`, and `tools/call`\n- `supabase/functions/mcp-server/registry.ts` — `registerTool` API and tool typings\n- `supabase/functions/mcp-server/tools/` — one file per tool, imported from `tools/index.ts`\n\n## Adding a tool\n\n1. Create a new file under `supabase/functions/mcp-server/tools/`, e.g. `tools/my-tool.ts`.\n2. Call `registerTool({ name, description, inputSchema, handler })` at module scope.\n3. Import the new file from `tools/index.ts` so it self-registers at boot.\n\n## Dependencies\n\nRequires **database**, **api**, and **functions**."
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
    "Integrations",
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
