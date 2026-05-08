import type { SpanData, Trace } from 'braintrust'
import { z } from 'zod'

const projectContextPrefix = "The user's current project is "

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

const threadTextBlockSchema = z.object({ type: z.literal('text'), text: z.string() })
const threadToolCallBlockSchema = z.object({ type: z.literal('tool_call'), tool_name: z.string() })
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

/** Normalized Braintrust tool span with unwrapped tool input and raw output. */
export type ToolSpan = {
  span: SpanData
  input: unknown
  output: unknown
}

export type ThreadParts = {
  projectContext: string | null
  priorConversation: string | null
  currentUserInput: string | null
  lastAssistantTurn: string | null
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

function serializeMessageContent(message: ThreadMessage | undefined): string | null {
  if (!message) return null
  if (typeof message.content === 'string') return message.content || null

  const content = message.content
    .map((block) => (block.type === 'text' ? block.text : `[called ${block.tool_name}]`))
    .join('\n')

  return content || null
}

function serializeMessages(messages: ThreadMessage[]): string | null {
  const parts = messages.flatMap((message) => {
    const content = serializeMessageContent(message)
    return content ? [`[${message.role}]\n${content}`] : []
  })

  return parts.length > 0 ? parts.join('\n\n') : null
}

function isProjectContextMessage(message: ThreadMessage): boolean {
  return (
    message.role === 'assistant' &&
    Boolean(serializeMessageContent(message)?.startsWith(projectContextPrefix))
  )
}

function findLastUserIndex(messages: ThreadMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return i
  }
  return -1
}

export function getThreadPartsFromThread(thread: unknown[]): ThreadParts {
  const messages = thread.flatMap((message) => {
    const result = threadMessageSchema.safeParse(message)
    if (!result.success || result.data.role === 'system' || result.data.role === 'tool') return []
    return [result.data]
  })

  const projectContextMessages = messages.filter(isProjectContextMessage)
  const chatMessages = messages.filter((message) => !isProjectContextMessage(message))
  const lastUserIdx = findLastUserIndex(chatMessages)
  const projectContext = serializeMessageContent(
    projectContextMessages[projectContextMessages.length - 1]
  )

  if (lastUserIdx === -1) {
    return {
      projectContext,
      priorConversation: serializeMessages(chatMessages),
      currentUserInput: null,
      lastAssistantTurn: null,
    }
  }

  return {
    projectContext,
    priorConversation: serializeMessages(chatMessages.slice(0, lastUserIdx)),
    currentUserInput: serializeMessageContent(chatMessages[lastUserIdx]),
    lastAssistantTurn: serializeMessages(
      chatMessages.slice(lastUserIdx + 1).filter((message) => message.role === 'assistant')
    ),
  }
}

export async function getThreadParts(trace: Trace): Promise<ThreadParts> {
  return getThreadPartsFromThread(await trace.getThread())
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
