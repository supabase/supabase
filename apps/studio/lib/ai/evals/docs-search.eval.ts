import { Eval } from 'braintrust'

import { generateTask } from './generate-task'
import { SupabaseAccuracy } from './supabase-accuracy'

// Evaluate when the assistant should search documentation vs use telemetry tools
Eval('Documentation Search Guidance', {
  data: () => {
    return [
      {
        input:
          "I can't remember where to find my project's API keys in Supabase. Can you show me the steps?",
        expected: `
Plan — what I'll do:
- Search Supabase docs for guidance on viewing project API keys.
- Summarize the recommended dashboard steps for the user.

Let me consult the docs for the latest instructions.

{ tool: "search_docs", input: { query: "view api keys" } }

According to the docs, open Project Settings > API in the dashboard to view and rotate your anon and service role keys.`,
      },
      {
        input:
          'Check if my project is having issues right now and tell me what to fix first.',
        expected: `
Plan — what I'll do:
- Pull advisor findings to surface any warnings.
- Review recent error logs for failing components.
- Summarize the most urgent fixes and next steps.

{ tool: "get_advisors", input: {} }
{ tool: "get_logs", input: { level: "error", limit: 5 } }

Findings:
- Advisors highlight security gaps and slow queries. Address materialized views in API schema, harden api.health_check, and profile the slow edge_function_logs query.
- Logs show edge-function invocation failures and RLS permission issues refreshing user_documents. Verify secrets/retry logic and ensure appropriate policies or service role context.`,
      },
    ]
  },
  task: async (input: string, hooks) => {
    const output = await generateTask(input, {
      chatName: 'Docs Guidance',
      isLimited: false,
    })

    hooks.metadata.output = output
    return output
  },
  scores: [SupabaseAccuracy],
})

