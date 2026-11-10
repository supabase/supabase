import { getAuthHeaders } from './auth-headers'
import { contract } from './get-report'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { getContentById } from '@/data/content/content-id-query'
import type { Dashboards, SqlSnippets } from '@/types'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async ({ id }, { abortSignal }) => {
    const report = await getContentById({ projectRef, id }, abortSignal, authHeaders)
    if (report.type !== 'report') {
      throw new Error(`Content ${id} is not a report (type: ${report.type})`)
    }

    const content = report.content as Dashboards.Content
    const layout = await Promise.all(
      content.layout.map(async (chart) => {
        if (!chart.attribute.startsWith('snippet_')) return chart

        const snippet = await getContentById(
          { projectRef, id: chart.id },
          abortSignal,
          authHeaders
        ).catch(() => null)

        const sql =
          snippet?.type === 'sql'
            ? (snippet.content as SqlSnippets.Content).unchecked_sql
            : undefined

        return { ...chart, sql }
      })
    )

    return {
      id: report.id,
      name: report.name,
      description: report.description,
      visibility: report.visibility,
      period_start: content.period_start,
      period_end: content.period_end,
      interval: content.interval,
      layout,
    }
  })
}
