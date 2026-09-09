import type { SpanData, Trace } from 'braintrust'
import { z } from 'zod'

import type { Transcript } from './transcript'

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

// --- Thread parsing (fallback path for online scorers) ---
//
// Online scorers run against live production traces, which have no in-memory
// transcript to read (that only exists inside the offline eval task — see
// buildTranscript in transcript.ts). trace.getThread() is the only source of
// the full conversation available to them there, so we derive an equivalent
// Transcript from it. This is subject to Braintrust's getThread()
// preview-length truncation, unlike buildTranscript's in-memory path — that's
// a known, pre-existing limitation of the online-scoring path, not something
// this fallback introduces.

const projectContextPrefix = "The user's current project is "

const threadTextBlockSchema = z.object({ type: z.literal('text'), text: z.string() })
const threadToolCallArgumentsSchema = z.object({ type: z.literal('valid'), value: z.unknown() })
const threadToolCallBlockSchema = z.object({
  type: z.literal('tool_call'),
  tool_name: z.string(),
  arguments: z.unknown().optional(),
})
const threadContentBlockSchema = z.union([threadTextBlockSchema, threadToolCallBlockSchema])
const threadContentSchema = z.union([
  z.string(),
  z.array(z.unknown()).transform((blocks) =>
    blocks.flatMap((block) => {
      const result = threadContentBlockSchema.safeParse(block)
      return result.success ? [result.data] : []
    })
  ),
])
const threadMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: threadContentSchema,
})

type ThreadMessage = z.infer<typeof threadMessageSchema>
type ThreadContentBlock = z.infer<typeof threadContentBlockSchema>

function unwrapToolCallArguments(args: unknown): unknown {
  const result = threadToolCallArgumentsSchema.safeParse(args)
  return result.success ? result.data.value : args
}

function serializeContentBlock(block: ThreadContentBlock, includeToolCallInputs: boolean): string {
  if (block.type === 'text') return block.text

  const marker = `[called ${block.tool_name}]`
  if (!includeToolCallInputs || typeof block.arguments === 'undefined') return marker

  return `${marker}\n${JSON.stringify(unwrapToolCallArguments(block.arguments), null, 2)}`
}

function serializeMessageContent(
  message: ThreadMessage | undefined,
  includeToolCallInputs: boolean
): string | null {
  if (!message) return null
  if (typeof message.content === 'string') return message.content || null

  const content = message.content
    .map((block) => serializeContentBlock(block, includeToolCallInputs))
    .join('\n')

  return content || null
}

function serializeMessages(
  messages: ThreadMessage[],
  includeToolCallInputs: boolean
): string | null {
  const parts = messages.flatMap((message) => {
    const content = serializeMessageContent(message, includeToolCallInputs)
    return content ? [`[${message.role}]\n${content}`] : []
  })

  return parts.length > 0 ? parts.join('\n\n') : null
}

function isProjectContextMessage(message: ThreadMessage): boolean {
  return (
    message.role === 'assistant' &&
    Boolean(serializeMessageContent(message, false)?.startsWith(projectContextPrefix))
  )
}

function findLastUserIndex(messages: ThreadMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return i
  }
  return -1
}

/**
 * Parses a raw trace.getThread() payload into a Transcript. Pulled out from
 * getThreadParts so it can be unit tested without a live Trace.
 */
export function getThreadPartsFromThread(thread: unknown[]): Transcript {
  const messages = thread.flatMap((message) => {
    const result = threadMessageSchema.safeParse(message)
    if (!result.success || result.data.role === 'system' || result.data.role === 'tool') return []
    return [result.data]
  })

  const chatMessages = messages.filter((message) => !isProjectContextMessage(message))
  const lastUserIdx = findLastUserIndex(chatMessages)

  if (lastUserIdx === -1) {
    return {
      currentUserInput: '',
      priorConversation: serializeMessages(chatMessages, true),
      lastAssistantTurn: null,
      lastAssistantTurnWithToolInputs: null,
    }
  }

  const assistantMessages = chatMessages
    .slice(lastUserIdx + 1)
    .filter((message) => message.role === 'assistant')

  return {
    currentUserInput: serializeMessageContent(chatMessages[lastUserIdx], false) ?? '',
    priorConversation: serializeMessages(chatMessages.slice(0, lastUserIdx), true),
    lastAssistantTurn: serializeMessages(assistantMessages, false),
    lastAssistantTurnWithToolInputs: serializeMessages(assistantMessages, true),
  }
}

/**
 * Derives a Transcript from a live trace's thread. Used as the fallback for
 * online scorers, which have no in-memory transcript to read (see
 * getThreadPartsFromThread above for why, and why this is truncation-prone
 * in a way the offline path isn't).
 */
export async function getThreadParts(trace: Trace): Promise<Transcript> {
  return getThreadPartsFromThread(await trace.getThread())
}
