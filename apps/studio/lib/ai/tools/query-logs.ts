import type { RemoteToolContract } from './types'

export const contract = {
  name: 'query_logs',
  minOptInLevel: 'schema_and_log',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: `- Use \`query_logs\`, not \`execute_sql\`, for project logs, including SQL snippets marked with the \`clickhouse\` dialect. Load \`logs\` knowledge first.
- The tool runs immediately with no confirmation step. The client renders the SQL and results in an interactive cell — do not paste the SQL, list rows, or reformat the result as a markdown table. Summarize the trend or notable outliers in 1–2 sentences.`,
} as const satisfies RemoteToolContract
