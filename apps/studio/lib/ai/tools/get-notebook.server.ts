import { getAuthHeaders } from './auth-headers'
import { contract } from './get-notebook'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import { toWireNotebook } from '@/data/content/notebooks/notebook-schema'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async ({ id }, { abortSignal }) => {
    const notebook = await getNotebook({ projectRef, id }, abortSignal, authHeaders)

    return {
      id: notebook.id,
      name: notebook.name,
      description: notebook.description,
      visibility: notebook.visibility,
      updated_at: notebook.updated_at,
      cells: toWireNotebook(notebook.content).cells,
    }
  })
}
