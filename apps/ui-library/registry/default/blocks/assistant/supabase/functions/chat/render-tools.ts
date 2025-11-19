import { tool } from 'ai'
import { z } from 'zod'

const rowSchema = z.object({
  primaryText: z.string().describe('Primary label for the row such as the task title.'),
  secondaryText: z
    .string()
    .optional()
    .describe('Secondary information such as due dates or task metadata.'),
  actions: z
    .array(
      z.object({
        label: z.string().describe('Text shown in the action menu, e.g., "Delete task".'),
        prompt: z
          .string()
          .describe('Prompt to send back to the assistant when the action is selected.'),
      })
    )
    .optional()
    .describe('Optional list of quick actions the user can trigger for this row.'),
})

const chartDataPointSchema = z
  .object({})
  .catchall(
    z
      .union([z.string(), z.number()])
      .describe(
        'Value for this property in the data point. Strings are typically labels, numbers are metrics.'
      )
  )
  .describe('Data point object containing axis and value fields.')

const chartSchema = z.object({
  primaryText: z
    .string()
    .describe('Primary title shown at the top of the chart card. e.g. Tasks completed'),
  secondaryText: z
    .string()
    .optional()
    .describe('Optional short description shown under the title. e.g. Last 7 days'),
  tertiaryText: z
    .string()
    .optional()
    .describe(
      'Optional supporting text shown beneath the chart. e.g. Increase of 12% week over week'
    ),
  data: z.array(chartDataPointSchema).min(1).describe('Data points to plot on the chart.'),
  xAxis: z
    .string()
    .describe('Key inside each data point to use for the X-axis labels (e.g., "month").'),
  yAxis: z
    .string()
    .describe('Key inside each data point to use for the bar height values (e.g., "desktop").'),
})

const renderRowTool = tool({
  description:
    'Render a task row to summarize Supabase records, including follow-up actions the user can take.',
  inputSchema: z.object({
    rows: z.array(rowSchema).min(1).describe('Rows to display to the user.'),
  }),
  execute: async ({ rows }) => {
    return {
      success: true,
      message: 'Rows have been shown to the user',
    }
  },
})

const renderChartTool = tool({
  description: 'Render a bar chart summarizing Supabase metrics for the user.',
  inputSchema: chartSchema,
  execute: async () => {
    return {
      success: true,
      message: 'Chart has been shown to the user',
    }
  },
})

export const renderTools = {
  renderRow: renderRowTool,
  renderChart: renderChartTool,
}
