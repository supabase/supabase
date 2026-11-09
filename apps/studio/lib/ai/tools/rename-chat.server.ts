import { contract } from './rename-chat'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'

// The client applies the rename in `onToolCall`; the server only acknowledges it.
export const createTool: ToolFactory<typeof contract> = (ctx) =>
  toolFromContract(contract, ctx, async () => ({ status: 'Chat request sent to client' }))
