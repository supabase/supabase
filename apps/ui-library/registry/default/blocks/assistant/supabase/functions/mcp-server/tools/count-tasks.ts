import { z } from 'zod'
import type { ToolDefinition } from './types.ts'

type CountTasksInput = {
  createdAtStart?: string
  createdAtEnd?: string
  completedAtStart?: string
  completedAtEnd?: string
}

export const countTasksTool: ToolDefinition<CountTasksInput> = {
  name: 'countTasks',
  description:
    'Count tasks that were created and/or completed between the provided date ranges. Dates should be ISO strings (YYYY-MM-DD or full timestamp).',
  authErrorMessage: 'Error: Authentication required to count tasks.',
  inputSchema: z.object({
    createdAtStart: z
      .string()
      .optional()
      .describe('Lower bound for created_at (inclusive). Accepts ISO dates or timestamps.'),
    createdAtEnd: z
      .string()
      .optional()
      .describe('Upper bound for created_at (inclusive). Accepts ISO dates or timestamps.'),
    completedAtStart: z
      .string()
      .optional()
      .describe('Lower bound for completed_at (inclusive). Accepts ISO dates or timestamps.'),
    completedAtEnd: z
      .string()
      .optional()
      .describe('Upper bound for completed_at (inclusive). Accepts ISO dates or timestamps.'),
  }),
  run: async (supabase, { createdAtStart, createdAtEnd, completedAtStart, completedAtEnd }) => {
    try {
      const { data, error } = await supabase.rpc('count_tasks', {
        created_at_start: createdAtStart ?? null,
        created_at_end: createdAtEnd ?? null,
        completed_at_start: completedAtStart ?? null,
        completed_at_end: completedAtEnd ?? null,
      })

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error counting tasks: ${error.message}`,
            },
          ],
          isError: true,
        }
      }

      const total = Array.isArray(data)
        ? (data[0]?.total as number | undefined) ?? 0
        : (data as number | null) ?? 0

      return {
        content: [
          {
            type: 'text',
            text: `Found ${total} task(s) matching the provided filters.`,
          },
        ],
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      }
    }
  },
}
