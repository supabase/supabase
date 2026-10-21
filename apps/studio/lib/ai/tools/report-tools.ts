import { createTool as createGetReportTool } from './get-report.server'
import { createTool as createListReportsTool } from './list-reports.server'
import type { ToolContext } from './types'

export const getReportTools = (ctx: ToolContext = {}) => ({
  list_reports: createListReportsTool(ctx),
  get_report: createGetReportTool(ctx),
})
