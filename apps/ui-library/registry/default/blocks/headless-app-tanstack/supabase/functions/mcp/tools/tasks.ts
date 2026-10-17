import type { McpServer } from 'npm:@modelcontextprotocol/server@2.0.0'
import { z } from 'npm:zod@4.4.3'

import { errorResult, jsonResult, runtimeErrorResult } from './result.ts'
import type { ToolContext } from './types.ts'

const taskFields = 'id, title, closed, created_at'
const taskId = z.uuid().describe('The task ID returned by list_tasks or create_task.')
const taskTitle = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .describe('A task title, 1–200 characters after trimming surrounding whitespace.')
const taskNotFound = 'Task not found or you do not have access.'

// Use only the caller's client. Ownership comes from auth.uid() in the schema,
// and RLS applies to reads and writes, including queries by a supplied task ID.
export function registerTaskTools(server: McpServer, { supabase }: ToolContext): void {
  server.registerTool(
    'list_tasks',
    {
      description:
        'List your tasks, newest first. Optionally filter by closed status. Pass next_offset as offset to fetch another page; null means there are no more tasks.',
      inputSchema: z.strictObject({
        closed: z.boolean().optional().describe('False for open tasks, true for closed tasks.'),
        limit: z.int().min(1).max(100).default(20).describe('Maximum tasks per page (1–100).'),
        offset: z.int().min(0).default(0).describe('Number of tasks to skip.'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ closed, limit, offset }) => {
      try {
        let query = supabase
          .from('tasks')
          .select(taskFields)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, offset + limit)

        if (closed !== undefined) query = query.eq('closed', closed)

        const { data } = await query.throwOnError()
        return jsonResult({
          tasks: data.slice(0, limit),
          next_offset: data.length > limit ? offset + limit : null,
        })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    }
  )

  server.registerTool(
    'create_task',
    {
      description:
        'Create an open task for yourself and return it. Each call creates a new task; do not retry blindly after a connection failure.',
      inputSchema: z.strictObject({ title: taskTitle }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ title }) => {
      try {
        const { data } = await supabase
          .from('tasks')
          .insert({ title })
          .select(taskFields)
          .single()
          .throwOnError()

        return jsonResult({ task: data })
      } catch (error) {
        return runtimeErrorResult(error)
      }
    }
  )

  server.registerTool(
    'update_task',
    {
      description:
        'Rename, close, or reopen one of your tasks and return it. Supply title, closed, or both. Fields you omit keep their current values.',
      inputSchema: z
        .strictObject({
          id: taskId,
          title: taskTitle.optional(),
          closed: z.boolean().optional().describe('True to close the task; false to reopen it.'),
        })
        .refine(({ title, closed }) => title !== undefined || closed !== undefined, {
          message: 'Supply title or closed to update a task.',
        }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, title, closed }) => {
      try {
        const changes = {
          ...(title !== undefined ? { title } : {}),
          ...(closed !== undefined ? { closed } : {}),
        }
        const { data } = await supabase
          .from('tasks')
          .update(changes)
          .eq('id', id)
          .select(taskFields)
          .maybeSingle()
          .throwOnError()

        return data ? jsonResult({ task: data }) : errorResult(taskNotFound)
      } catch (error) {
        return runtimeErrorResult(error)
      }
    }
  )

  server.registerTool(
    'delete_task',
    {
      description:
        'Permanently delete one of your tasks by ID. Use update_task with closed: true to keep a completed task instead.',
      inputSchema: z.strictObject({ id: taskId }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      try {
        const { data } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .select('id')
          .maybeSingle()
          .throwOnError()

        return data ? jsonResult({ deleted: true, id: data.id }) : errorResult(taskNotFound)
      } catch (error) {
        return runtimeErrorResult(error)
      }
    }
  )
}
