import { z } from 'zod'
import { createAuthenticatedClient } from '../lib/supabase.ts'

export const createTaskTool = {
  name: 'createTask',
  options: {
    description: 'Create a task for the authenticated user. Optionally provide a due date (YYYY-MM-DD).',
    inputSchema: z.object({
      title: z
        .string()
        .min(1, 'Title must not be empty')
        .describe('Task title to display in the list.'),
      due_date: z
        .string()
        .optional()
        .describe('Optional due date in YYYY-MM-DD format.'),
    }),
    handler: async ({ title, due_date }: { title: string; due_date?: string }, ctx: any) => {
      const authHeader = ctx.state?.authHeader

      if (!authHeader) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Authentication required to create tasks.',
            },
          ],
          isError: true,
        }
      }

      try {
        const supabase = createAuthenticatedClient(authHeader)

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          return {
            content: [
              {
                type: 'text',
                text: `Error retrieving authenticated user: ${userError?.message ?? 'Not found'}`,
              },
            ],
            isError: true,
          }
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title,
            due_at: due_date ?? null,
            assignee_id: user.id,
          })
          .select('id, title, due_at, assignee_id')
          .single()

        if (error || !data) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating task: ${error?.message ?? 'Unknown error'}`,
              },
            ],
            isError: true,
          }
        }

        const dueDateText = data.due_at ? `Due ${data.due_at}` : 'No due date set'

        return {
          content: [
            {
              type: 'text',
              text: `Created task [${data.id}] "${data.title}" for user ${data.assignee_id}. ${dueDateText}.`,
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
