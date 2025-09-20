import { Eval } from 'braintrust'

import { generateTask } from './generate-task'
import { SupabaseAccuracy } from './supabase-accuracy'

// Evaluate database schema planning and SQL generation via execute_sql
Eval('Analytics Schema Generation', {
  data: () => {
    return [
      {
        input:
          'Help me design tables to capture product analytics events. I want to store event sources, user sessions, and individual events with a JSONB payload. Make sure the tables are normalized, have indexes for foreign keys, enable RLS, and avoid conflicting with existing tables. Show the SQL I should run.',
        expected: `
 Plan — what I'll do:
 - Inspect the public schema to understand existing tables and avoid collisions.
 - Confirm available extensions in case JSON or UUID support is needed.
 - Propose normalized tables plus supporting indexes and RLS enabling statements via execute_sql.

First, I'll list the tables in the public schema.

{ tool: "list_tables", input: { schemas: ["public"] } }

I'll also confirm which extensions are installed.

{ tool: "list_extensions", input: {} }

Now I'll supply SQL to create event_sources, event_sessions, and event_events with foreign keys, indexes, and RLS enabled.

{ tool: "execute_sql", input: { label: "Create analytics events schema", sql: "create table public.event_sources (\n  id bigint primary key generated always as identity,\n  slug text not null unique,\n  name text not null,\n  insert_user_id uuid references auth.users(id),\n  created_at timestamp with time zone default timezone('utc', now()) not null\n);\n\ncreate table public.event_sessions (\n  id bigint primary key generated always as identity,\n  source_id bigint not null references public.event_sources(id),\n  user_id uuid,\n  started_at timestamp with time zone not null,\n  ended_at timestamp with time zone,\n  created_at timestamp with time zone default timezone('utc', now()) not null\n);\n\ncreate table public.event_events (\n  id bigint primary key generated always as identity,\n  session_id bigint not null references public.event_sessions(id),\n  name text not null,\n  occurred_at timestamp with time zone not null,\n  payload jsonb default '{}'::jsonb not null,\n  created_at timestamp with time zone default timezone('utc', now()) not null\n);\n\nalter table public.event_sources enable row level security;\nalter table public.event_sessions enable row level security;\nalter table public.event_events enable row level security;\n\ncreate index event_sessions_source_id_idx on public.event_sessions (source_id);\ncreate index event_sessions_user_id_idx on public.event_sessions (user_id);\ncreate index event_events_session_id_idx on public.event_events (session_id);\ncreate index event_events_name_idx on public.event_events (name);", isWriteQuery: true } }
`,
      },
    ]
  },
  task: async (input: string, hooks) => {
    const output = await generateTask(input, {
      chatName: 'Schema Design',
      isLimited: false,
    })

    hooks.metadata.output = output
    return output
  },
  scores: [SupabaseAccuracy],
})
