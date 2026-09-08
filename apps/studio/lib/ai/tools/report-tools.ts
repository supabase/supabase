import { tool } from 'ai'
import { z } from 'zod'

import { getContentById } from '@/data/content/content-id-query'
import { getContent } from '@/data/content/content-query'
import type { Dashboards, SqlSnippets } from '@/types'

export type ReportToolsContext = {
  projectRef?: string
  authorization?: string
}

export const getReportTools = (ctx: ReportToolsContext = {}) => {
  const { projectRef, authorization } = ctx
  const authHeaders = authorization ? { Authorization: authorization } : undefined

  return {
    list_reports: tool({
      description: 'List the custom reports saved for this project',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .default(20)
          .describe('Max number of reports to return.'),
      }),
      execute: async ({ limit }) => {
        const { content } = await getContent(
          { projectRef, type: 'report', limit },
          undefined,
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
      },
    }),
    get_report: tool({
      description:
        'Get a single custom report by id, including the resolved SQL for any SQL-based chart blocks it contains.',
      inputSchema: z.object({
        id: z.string().describe('The id of the report to fetch.'),
      }),
      execute: async ({ id }) => {
        const report = await getContentById({ projectRef, id }, undefined, authHeaders)
        if (report.type !== 'report') {
          throw new Error(`Content ${id} is not a report (type: ${report.type})`)
        }

        const content = report.content as Dashboards.Content
        const layout = await Promise.all(
          content.layout.map(async (chart) => {
            if (!chart.attribute.startsWith('snippet_')) return chart

            // A SQL-block chart's `id` is the id of its linked `type: 'sql'` content row.
            const snippet = await getContentById(
              { projectRef, id: chart.id },
              undefined,
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
      },
    }),
  }
}
