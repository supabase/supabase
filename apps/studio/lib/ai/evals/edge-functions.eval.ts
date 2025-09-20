import { Eval } from 'braintrust'

import { generateTask } from './generate-task'
import { SupabaseAccuracy } from './supabase-accuracy'

// Evaluate planning and code generation for Supabase Edge Functions using tools
Eval('Edge Function Generation', {
  data: () => {
    return [
      {
        input:
          'I want to notify our Slack channel whenever a new support ticket is created. Build a Supabase Edge Function that accepts a webhook payload with ticketId, subject, description, and priority, then post a nicely formatted message to the Slack webhook URL stored in secrets. Make sure you check what Edge Functions already exist first so we do not collide with their names.',
        expected: `
Plan — what I'll do:
- Review existing Edge Functions to avoid naming conflicts.
- Outline the new function's behavior and required secrets.
- Provide deployable Edge Function code via deploy_edge_function.

First, I'll list current Edge Functions so I can pick a distinct name.

{ tool: "list_edge_functions", input: {} }

I'll create support-ticket-notifier to accept POST requests, validate the payload, require the SLACK_WEBHOOK_URL secret, and forward the message to Slack with basic error handling.

{ tool: "deploy_edge_function", input: { name: "support-ticket-notifier", code: "const SLACK_WEBHOOK_URL = Deno.env.get(\"SLACK_WEBHOOK_URL\");\nif (!SLACK_WEBHOOK_URL) {\n  throw new Error(\"Missing SLACK_WEBHOOK_URL secret\");\n}\n\nconsole.info(\"support-ticket-notifier loaded\");\n\nDeno.serve(async (req) => {\n  if (req.method !== \"POST\") {\n    return new Response(JSON.stringify({ error: \"Only POST supported\" }), {\n      status: 405,\n      headers: { \"Content-Type\": \"application/json\" },\n    });\n  }\n\n  let body: { ticketId: string; subject: string; description?: string; priority?: string };\n  try {\n    body = await req.json();\n  } catch (_error) {\n    return new Response(JSON.stringify({ error: \"Invalid JSON payload\" }), {\n      status: 400,\n      headers: { \"Content-Type\": \"application/json\" },\n    });\n  }\n\n  if (!body.ticketId || !body.subject) {\n    return new Response(JSON.stringify({ error: \"ticketId and subject are required\" }), {\n      status: 422,\n      headers: { \"Content-Type\": \"application/json\" },\n    });\n  }\n\n  const summaryLine = \"*Ticket:* \" + body.ticketId + \"\\n*Subject:* \" + body.subject + \"\\n*Priority:* \" + (body.priority ?? \"unspecified\");\n  const description = body.description ? body.description : \"\";\n\n  const slackPayload = {\n    text: \"New support ticket #\" + body.ticketId + \": \" + body.subject,\n    blocks: [\n      {\n        type: \"section\",\n        text: {\n          type: \"mrkdwn\",\n          text: summaryLine + (description ? \"\\n\" + description : \"\"),\n        },\n      },\n    ],\n  };\n\n  const response = await fetch(SLACK_WEBHOOK_URL, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/json\" },\n    body: JSON.stringify(slackPayload),\n  });\n\n  if (!response.ok) {\n    const errorText = await response.text();\n    console.error(\"Failed to post to Slack\", errorText);\n    return new Response(JSON.stringify({ error: \"Failed to notify Slack\" }), {\n      status: 502,\n      headers: { \"Content-Type\": \"application/json\" },\n    });\n  }\n\n  return new Response(JSON.stringify({ status: \"ok\" }), {\n    headers: { \"Content-Type\": \"application/json\" },\n  });\n});" } }
`,
      },
    ]
  },
  task: async (input: string, hooks) => {
    const output = await generateTask(input, {
      chatName: 'Edge Functions',
      isLimited: false,
    })

    hooks.metadata.output = output
    return output
  },
  scores: [SupabaseAccuracy],
})
