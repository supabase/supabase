import { getAuthHeaders } from './auth-headers'
import { contract } from './list-reports'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { getContent } from '@/data/content/content-query'
import type { Dashboards } from '@/types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async ({ limit }, { abortSignal }) => {
    const { content } = await getContent(
      { projectRef, type: 'report', limit },
      abortSignal,
      authHeaders
    )

    return content.map((report) => ({
      id: report.id,
      name: report.name,
      description: report.description,
      visibility: report.visibility,
      updated_at: report.updated_at,
      chart_count: (report.content as Dashboards.Content).layout?.length ?? 0,
    }))
  })
}
