import { type SafeParseReturnType, z } from 'zod'

const extractDataFromSafetyMessage = (text: string): string | null => {
  const openingTags = [...text.matchAll(/<untrusted-data-[a-z0-9-]+>/gi)]
  if (openingTags.length < 2) return null

  const closingTagMatch = text.match(/<\/untrusted-data-[a-z0-9-]+>/i)
  if (!closingTagMatch) return null

  const secondOpeningEnd = openingTags[1].index! + openingTags[1][0].length
  const closingStart = text.indexOf(closingTagMatch[0])
  const content = text.substring(secondOpeningEnd, closingStart)

  return content.replace(/\\n/g, '').replace(/\\"/g, '"').replace(/\n/g, '').trim()
}

// Helper function to find result data directly from parts array
export const findResultForManualId = (
  parts: any[] | undefined,
  manualId: string
): any[] | undefined => {
  if (!parts) return undefined

  const invocationPart = parts.find(
    (part) =>
      part.type === 'tool-invocation' &&
      'toolInvocation' in part &&
      part.toolInvocation.state === 'result' &&
      'result' in part.toolInvocation &&
      part.toolInvocation.result?.manualToolCallId === manualId
  )

  if (
    invocationPart &&
    'toolInvocation' in invocationPart &&
    'result' in invocationPart.toolInvocation &&
    invocationPart.toolInvocation.result?.content?.[0]?.text
  ) {
    try {
      const rawText = invocationPart.toolInvocation.result.content[0].text

      const extractedData = extractDataFromSafetyMessage(rawText) || rawText

      let parsedData = JSON.parse(extractedData.trim())
      return Array.isArray(parsedData) ? parsedData : undefined
    } catch (error) {
      console.error('Failed to parse tool invocation result data for manualId:', manualId, error)
      return undefined
    }
  }
  return undefined
}

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
