import { getAuthHeaders } from './auth-headers'
import { contract } from './list-notebooks'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { getContent } from '@/data/content/content-infinite-query'
import type { Notebooks } from '@/types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async ({ cursor, limit, sort_by }, { abortSignal }) => {
    const { content, cursor: nextCursor } = await getContent(
      { projectRef, type: 'notebook', limit, cursor, sort: sort_by },
      abortSignal,
      authHeaders
    )

    return {
      notebooks: content.map((notebook) => ({
        id: notebook.id,
        name: notebook.name,
        description: notebook.description,
        visibility: notebook.visibility,
        updated_at: notebook.updated_at,
        cell_count: (notebook.content as Notebooks.Content).cells.length,
      })),
      cursor: nextCursor,
    }
  })
}
