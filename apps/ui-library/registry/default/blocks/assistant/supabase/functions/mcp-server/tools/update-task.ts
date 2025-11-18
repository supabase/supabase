import { z } from 'zod'
import type { ToolDefinition } from './types.ts'

type UpdateTaskInput = {
  id: number
  title?: string
  due_date?: string
}

export const updateTaskTool: ToolDefinition<UpdateTaskInput> = {
  name: 'updateTask',
  description: 'Update a task title and/or due date by id.',
  authErrorMessage: 'Error: Authentication required to update tasks.',
  inputSchema: z
    .object({
      id: z.number().int().describe('Task id to update.'),
      title: z.string().optional().describe('New title for the task.'),
      due_date: z
        .string()
        .optional()
        .describe('New due date in YYYY-MM-DD format. Set to empty string to clear.'),
    })
    .refine((data) => data.title !== undefined || data.due_date !== undefined, {
      message: 'Provide at least a title or due_date to update.',
      path: ['title'],
    }),
  run: async (supabase, { id, title, due_date }) => {
    try {
      const updatePayload: Record<string, string | null> = {}

      if (title !== undefined) {
        updatePayload.title = title
      }

      if (due_date !== undefined) {
        updatePayload.due_at = due_date || null
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id)
        .select('id, title, due_at, assignee_id')
        .single()

      if (error || !data) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating task: ${error?.message ?? 'Task not found.'}`,
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
            text: `Updated task [${data.id}] "${data.title}". ${dueDateText}.`,
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
