import { Eval } from 'braintrust'
import { Levenshtein } from 'autoevals'
import { generateTask } from './generate-task'

// Evaluate how well the generate-v4-like function creates RLS policies
Eval('RLS Policy Generation', {
  data: () => {
    return [
      // Simple single-table, user-ownership pattern
      {
        input:
          'Create RLS policies for table public.user_documents with column user_id so users can read/write only their own rows. Include select, insert, update, delete.',
        expected: 'CREATE POLICY', // We check fuzzy string similarity; exact SQL compared by Levenshtein
      },
      // Multi-tenant via jwt claim pattern
      {
        input:
          "For table public.customers with tenant_id, add SELECT policy restricting rows to tenant_id from auth.jwt() ->> 'tenant_id'.",
        expected: 'CREATE POLICY',
      },
      // Org membership via join-like pattern
      {
        input:
          'For table public.projects with organization_id, allow SELECT for members listed in public.user_organizations(user_id, organization_id) matched by auth.uid().',
        expected: 'CREATE POLICY',
      },
      // Storage example
      {
        input:
          "For table storage.objects, allow SELECT/INSERT only for bucket 'user-uploads' where first folder equals auth.uid().",
        expected: 'CREATE POLICY',
      },
    ]
  },
  task: async (input: string) => {
    // Use default options suitable for eval environment (no schema access)
    const output = await generateTask(input, {
      isLimited: false,
    })
    return output
  },
  scores: [Levenshtein],
})
