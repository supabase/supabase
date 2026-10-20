import { createTool as createListPoliciesTool } from './list-policies.server'
import type { ToolContext } from './types'

export const getSchemaTools = (ctx: ToolContext = {}) => ({
  list_policies: createListPoliciesTool(ctx),
})
