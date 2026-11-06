import { getAuthHeaders } from './auth-headers'
import { contract } from './delete-notebook'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { deleteContents } from '@/data/content/content-delete-mutation'
import { getNotebook } from '@/data/content/notebooks/notebook-query'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async ({ id }, { abortSignal }) => {
    const notebook = await getNotebook({ projectRef, id }, abortSignal, authHeaders)

    await deleteContents({ projectRef: projectRef ?? '', ids: [id] }, abortSignal, authHeaders)

    return { id, name: notebook.name }
  })
}
