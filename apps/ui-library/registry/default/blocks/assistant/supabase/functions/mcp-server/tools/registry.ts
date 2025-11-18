import { createTaskTool } from './create-task.ts'
import { getUserTasksTool } from './get-user-tasks.ts'

export const toolRegistry = [getUserTasksTool, createTaskTool]

export type ToolDefinition = (typeof toolRegistry)[number]
