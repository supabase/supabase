import { type DatabaseActivity } from '@/data/database/activity-query'

export const buildDatabaseConnectionsSummaryPrompt = ({
  activities,
  timestamp,
}: {
  activities: DatabaseActivity[]
  timestamp: string
}) => {
  const prompt = `
Data from \`pg_stat_activity\` captured at: ${timestamp}
\`\`\`
${JSON.stringify(activities)}
\`\`\`

Summarize the sessions in the above data for a developer who isn't a DBA. Cover, in this order, only the categories that have at least one match:
1. Idle-in-transaction sessions — cite the PID and role; note it's almost always a missing commit/rollback in their app.
2. Blocked sessions — cite the blocked PID and the PID/query blocking it.
3. Active queries running longer than 30 seconds — cite the PID and duration.

Rules:
- Only include a bullet for a category if it has at least one match. Do not mention categories with nothing to report.
- If none of the four apply, respond with a single plain sentence confirming things look healthy — no bullets, no "if you want..." offer, no restating the data.
- Reference every finding by PID so the user can find the row in the table.
- Use the pre-computed duration_seconds and blocked_by fields from the data — do not recompute durations from raw timestamps.

Format:
- Bold every PID (e.g. **PID 511**).
- If anything was flagged, end with one short line inviting the user to ask for more detail on a specific PID. If everything is healthy, stop after the health sentence — do not ask for more data.
`
  return prompt
}
