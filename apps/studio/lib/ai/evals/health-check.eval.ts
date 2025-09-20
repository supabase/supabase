import { Eval } from 'braintrust'

import { generateTask } from './generate-task'
import { SupabaseAccuracy } from './supabase-accuracy'

// Evaluate project health triage using get_advisors and get_logs tools
Eval('Project Health Check', {
  data: () => {
    return [
      {
        input:
          'The project has been unstable. Please run a health check: look at advisor warnings and recent errors, then tell me the top issues to fix and recommended follow-up.',
        expected: `
Plan — what I'll do:
- Pull advisor findings to surface security or performance concerns.
- Inspect recent error logs for failing components.
- Summarize the most urgent fixes and next steps.

I'll start with the advisor feed to see outstanding warnings.

{ tool: "get_advisors", input: {} }

Next I'll review recent error-level logs for failures.

{ tool: "get_logs", input: { level: "error", limit: 5 } }

Findings:
- Security advisors flag that an API materialized view and the api.health_check function can bypass RLS. Move materialized views to private schema and add auth context checks to health_check before reading tables. A slow query on edge_function_logs should be profiled.
- Logs show the hello-world Edge Function failing when invoking analytics and Postgres denying access to user_documents. Verify secrets/retry logic for the function and ensure RLS policies or service-role usage allow the trigger to refresh user_documents.`,
      },
    ]
  },
  task: async (input: string, hooks) => {
    const output = await generateTask(input, {
      chatName: 'Health Check',
      isLimited: false,
    })

    hooks.metadata.output = output
    return output
  },
  scores: [SupabaseAccuracy],
})

