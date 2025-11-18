import { createTaskTool } from './create-task.ts'
import { deleteTaskTool } from './delete-task.ts'
import { getUserTasksTool } from './get-user-tasks.ts'
import { updateTaskTool } from './update-task.ts'
import type { ToolDefinition } from './types.ts'

export const toolRegistry: ToolDefinition[] = [
  getUserTasksTool,
  createTaskTool,
  updateTaskTool,
  deleteTaskTool,
]
