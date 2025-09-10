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
I'll check your tables and existing policies, enable RLS where it's off, and add the missing rules in one SQL block.

{ tool: "list_tables", input: { schemas: ["public"] } }
{ tool: "list_policies", input: { schemas: ["public"] } }

I see an existing SELECT policy on public.customers; I won't duplicate it.

{ tool: "display_query", input: { label: "Enable RLS and Add Policies", sql: "alter table public.user_documents enable row level security;\nalter table public.projects enable row level security;\n\ncreate policy \"user_documents_select_own\" on public.user_documents for select using (auth.uid() = user_id);\ncreate policy \"user_documents_insert_own\" on public.user_documents for insert with check (auth.uid() = user_id);\ncreate policy \"user_documents_update_own\" on public.user_documents for update using (auth.uid() = user_id);\ncreate policy \"user_documents_delete_own\" on public.user_documents for delete using (auth.uid() = user_id);\n\ncreate policy \"projects_select_members\" on public.projects for select using (exists (select 1 from public.user_organizations uo where uo.user_id = auth.uid() and uo.organization_id = public.projects.organization_id));" } }
`,
      },
    ]
  },
  task: async (input: string, hooks) => {
    // Use default options suitable for eval environment (no schema access)
    const output = await generateTask(input, {
      isLimited: false,
    })

    hooks.metadata.output = output
    return output
  },
  scores: [SupabaseAccuracy],
})
