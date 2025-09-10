import { Eval } from 'braintrust'
import { SupabaseAccuracy } from './supabase-accuracy'
import { generateTask } from './generate-task'

// Evaluate planning for RLS enablement and missing policy creation using tools
Eval('RLS Policy Generation', {
  data: () => {
    return [
      {
        input:
          'Secure my database tables. I want to make sure only the right people can read and write data. Please check what tables I have and what rules already exist, then turn on security where it is off and add any missing rules.',
        expected: `
Plan — what I'll do:
- Inspect schemas and extensions to see current tables and policies.
- Review existing RLS policies.
- Propose SQL to enable RLS and add missing CRUD policies.
- Present SQL via display_query for review.

Now I'll gather current schema, extension, and policy info:
{ tool: "list_tables", input: { schemas: ["public","auth","storage","private"] } }
{ tool: "list_policies", input: { schemas: ["public","auth","storage","private"] } }
{ tool: "list_extensions", input: {} }

First, I will enable RLS on user_documents and projects

{ tool: "display_query", input: { label: "Enable RLS", sql: "alter table public.user_documents enable row level security;\nalter table public.projects enable row level security;" } }

Now I will add the missing policies:

{ tool: "display_query", input: { label: "Add Policies", sql: "create policy \"user_documents_select_own\" on public.user_documents for select using (auth.uid() = user_id);\ncreate policy \"user_documents_insert_own\" on public.user_documents for insert with check (auth.uid() = user_id);\ncreate policy \"user_documents_update_own\" on public.user_documents for update using (auth.uid() = user_id);\ncreate policy \"user_documents_delete_own\" on public.user_documents for delete using (auth.uid() = user_id);\n\ncreate policy \"projects_select_members\" on public.projects for select using (exists (select 1 from public.user_organizations uo where uo.user_id = auth.uid() and uo.organization_id = public.projects.organization_id));" } }
`,
      },
    ]
  },
  task: async (input: string, hooks) => {
    const output = await generateTask(input, {
      isLimited: false,
    })

    hooks.metadata.output = output
    return output
  },
  scores: [SupabaseAccuracy],
})
