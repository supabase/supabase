import { contract } from './resolve-support-conversation'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'

export const createTool: ToolFactory<typeof contract> = (ctx) =>
  toolFromContract(contract, ctx, async () => ({ status: 'Resolve request sent to client.' }))
