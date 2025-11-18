import { z } from 'zod'
import type { ToolDefinition } from './types.ts'

type DeleteTaskInput = {
  id: number
}

export const deleteTaskTool: ToolDefinition<DeleteTaskInput> = {
  name: 'deleteTask',
  description: 'Delete a task using its numeric id.',
  authErrorMessage: 'Error: Authentication required to delete tasks.',
  inputSchema: z.object({
    id: z.number().int().describe('Task id to delete.'),
  }),
  run: async (supabase, { id }) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .select('id, title')
        .single()

      if (error || !data) {
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting task: ${error?.message ?? 'Task not found or already deleted.'}`,
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Deleted task [${data.id}] "${data.title ?? 'Untitled'}" successfully.`,
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
