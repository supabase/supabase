import { contract } from './escalate-to-human'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'

export const createTool: ToolFactory<typeof contract> = (ctx) =>
  toolFromContract(contract, ctx, async () => ({ status: 'Escalation request sent to client.' }))
