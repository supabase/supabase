import { z } from 'zod'
import { createAuthenticatedClient } from '../lib/supabase.ts'

export const getUserTasksTool = {
  name: 'getUserTasks',
  options: {
    description:
      'Fetch tasks for the authenticated user with optional filtering by due date and title search.',
    inputSchema: z.object({
      due_date: z
        .string()
        .optional()
        .describe('Optional due date filter in YYYY-MM-DD format. Returns tasks with this exact due date.'),
      title_search: z
        .string()
        .optional()
        .describe('Optional title search term. Returns tasks where the title contains this text (case-insensitive).'),
    }),
    handler: async (
      { due_date, title_search }: { due_date?: string; title_search?: string },
      ctx: any
    ) => {
      const authHeader = ctx.state?.authHeader

      if (!authHeader) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Authentication required to fetch tasks.',
            },
          ],
          isError: true,
        }
      }

      try {
        const supabase = createAuthenticatedClient(authHeader)

        let query = supabase
          .from('tasks')
          .select('id, created_at, title, assignee_id, due_at')
          .order('due_at', { ascending: true, nullsFirst: false })

        if (due_date) {
          query = query.eq('due_at', due_date)
        }

        if (title_search) {
          query = query.ilike('title', `%${title_search}%`)
        }

        const { data, error } = await query

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching tasks: ${error.message}`,
              },
            ],
            isError: true,
          }
        }

        const taskCount = data?.length || 0
        const tasksText =
          data && taskCount > 0
            ? data
                .map((task) => {
                  const dueDate = task.due_at ? `Due: ${task.due_at}` : 'No due date'
                  return `- [${task.id}] ${task.title || 'Untitled'} (${dueDate})`
                })
                .join('\n')
            : 'No tasks found.'

        return {
          content: [
            {
              type: 'text',
              text: `Found ${taskCount} task(s):\n\n${tasksText}`,
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
  },
}

export type ToolDefinition = typeof getUserTasksTool
