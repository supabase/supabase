import type { SpanData, Trace } from 'braintrust'
import { z } from 'zod'

/**
 * Matches AI SDK tool spans as Braintrust records them: tool args first,
 * execution context second.
 */
const aiSdkToolSpanInputSchema = z.tuple([
  z.unknown(),
  z
    .object({
      messages: z.unknown().optional(),
      toolCallId: z.string().optional(),
    })
    .passthrough(),
])

/** Normalized Braintrust tool span with unwrapped tool input and raw output. */
export type ToolSpan = {
  span: SpanData
  input: unknown
  output: unknown
}

/** Optional schemas used to validate and type a tool span's input and output. */
type ToolSpanSchemas<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
> = {
  inputSchema?: TInputSchema
  outputSchema?: TOutputSchema
}

/** Tool span whose input/output types are inferred from provided schemas. */
type ParsedToolSpan<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
> = {
  span: SpanData
  input: TInputSchema extends z.ZodType ? z.infer<TInputSchema> : unknown
  output: TOutputSchema extends z.ZodType ? z.infer<TOutputSchema> : unknown
}

/** Extracts the actual tool args from Braintrust's traced function input shape. */
function getToolSpanInput(span: SpanData): unknown {
  const result = aiSdkToolSpanInputSchema.safeParse(span.input)
  return result.success ? result.data[0] : span.input
}

/** Returns normalized tool spans from the trace, optionally filtered to a specific tool name. */
export async function getToolSpans(trace: Trace, toolName?: string): Promise<ToolSpan[]> {
  const spans = await trace.getSpans({ spanType: ['tool'] })
  const toolSpans = spans.map((span) => ({
    span,
    input: getToolSpanInput(span),
    output: span.output,
  }))
  if (!toolName) return toolSpans
  return toolSpans.filter((s) => s.span.span_attributes?.name === toolName)
}

/** Returns only tool spans whose normalized input/output match the provided schemas. */
export async function getParsedToolSpans<
  TInputSchema extends z.ZodType | undefined = undefined,
  TOutputSchema extends z.ZodType | undefined = undefined,
>(
  trace: Trace,
  toolName: string,
  schemas: ToolSpanSchemas<TInputSchema, TOutputSchema> = {}
): Promise<Array<ParsedToolSpan<TInputSchema, TOutputSchema>>> {
  const spans = await getToolSpans(trace, toolName)

  return spans.flatMap(({ span, input, output }) => {
    const parsedInput = schemas.inputSchema?.safeParse(input)
    if (parsedInput && !parsedInput.success) return []

    const parsedOutput = schemas.outputSchema?.safeParse(output)
    if (parsedOutput && !parsedOutput.success) return []

    return [
      {
        span,
        input: parsedInput ? parsedInput.data : input,
        output: parsedOutput ? parsedOutput.data : output,
      } as ParsedToolSpan<TInputSchema, TOutputSchema>,
    ]
  })
}
