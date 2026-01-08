import { type SafeParseReturnType, z } from 'zod'

// [Joshen] From https://github.com/remarkjs/react-markdown/blob/fda7fa560bec901a6103e195f9b1979dab543b17/lib/index.js#L425
export function defaultUrlTransform(value: string) {
  const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i
  const colon = value.indexOf(':')
  const questionMark = value.indexOf('?')
  const numberSign = value.indexOf('#')
  const slash = value.indexOf('/')

  if (
    // If there is no protocol, it’s relative.
    colon === -1 ||
    // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    // It is a protocol, it should be allowed.
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value
  }

  return ''
}

const chartArgsSchema = z
  .object({
    view: z.enum(['table', 'chart']).optional(),
    xKey: z.string().optional(),
    xAxis: z.string().optional(),
    yKey: z.string().optional(),
    yAxis: z.string().optional(),
  })
  .passthrough()

const chartArgsFieldSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) return value[0]
  return value
}, chartArgsSchema.optional())

const executeSqlChartResultSchema = z
  .object({
    sql: z.string().optional(),
    label: z.string().optional(),
    isWriteQuery: z.boolean().optional(),
    chartConfig: chartArgsFieldSchema,
    config: chartArgsFieldSchema,
  })
  .passthrough()
  .transform(({ sql, label, isWriteQuery, chartConfig, config }) => {
    const chartArgs = chartConfig ?? config

    return {
      sql: sql ?? '',
      label,
      isWriteQuery,
      view: chartArgs?.view,
      xAxis: chartArgs?.xKey ?? chartArgs?.xAxis,
      yAxis: chartArgs?.yKey ?? chartArgs?.yAxis,
    }
  })

export function parseExecuteSqlChartResult(
  input: unknown
): SafeParseReturnType<unknown, z.infer<typeof executeSqlChartResultSchema>> {
  return executeSqlChartResultSchema.safeParse(input)
}

export const deployEdgeFunctionInputSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    functionName: z.string().trim().optional(),
    label: z.string().optional(),
  })
  .passthrough()
  .transform((data) => {
    const rawName = data.functionName ?? data.name ?? data.slug
    const trimmedName = rawName?.trim()
    const functionName = trimmedName && trimmedName.length > 0 ? trimmedName : 'my-function'

    const rawLabel = data.label ?? rawName
    const trimmedLabel = rawLabel?.trim()
    const label = trimmedLabel && trimmedLabel.length > 0 ? trimmedLabel : 'Edge Function'

    return {
      code: data.code,
      functionName,
      label,
    }
  })

export const deployEdgeFunctionOutputSchema = z
  .object({ success: z.boolean().optional() })
  .passthrough()

export const rateMessageResponseSchema = z.object({
  category: z.enum([
    'sql_generation',
    'schema_design',
    'rls_policies',
    'edge_functions',
    'database_optimization',
    'debugging',
    'general_help',
    'other',
  ]),
})

export type RateMessageResponse = z.infer<typeof rateMessageResponseSchema>
