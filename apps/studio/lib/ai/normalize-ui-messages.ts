import type { UIMessage } from 'ai'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export type NormalizeUiMessagesOptions = {
  dropReasoningParts?: boolean
  dropStepParts?: boolean
  dropEmptyMessages?: boolean
  dropToolStates?: string[]
  dropNonTextParts?: boolean
  sanitizePart?: (part: UIMessage['parts'][number]) => UIMessage['parts'][number]
}

const DEFAULT_DROP_TOOL_STATES = ['input-streaming']

function shouldDropStepPart(type: string) {
  // `toUIMessageStreamResponse({ sendReasoning: true })` can emit step boundary parts which are
  // useful for streaming UX, but not useful (and sometimes invalid) when re-hydrated from storage.
  return type === 'step-start' || type === 'step-finish'
}

function normalizeParts(
  parts: Array<unknown>,
  options: Required<
    Pick<NormalizeUiMessagesOptions, 'dropReasoningParts' | 'dropStepParts' | 'dropNonTextParts'>
  > & {
    dropToolStates: string[]
    sanitizePart?: NormalizeUiMessagesOptions['sanitizePart']
  }
): UIMessage['parts'] {
  const normalized: UIMessage['parts'] = []

  for (const rawPart of parts) {
    if (!isRecord(rawPart)) continue
    const type = typeof rawPart.type === 'string' ? rawPart.type : undefined
    if (type == null) continue

    if (options.dropStepParts && shouldDropStepPart(type)) continue

    if (type === 'text') {
      if (typeof rawPart.text !== 'string') continue
      normalized.push(rawPart as any)
      continue
    }

    if (options.dropNonTextParts) continue

    if (type === 'reasoning') {
      if (options.dropReasoningParts) continue
      if (typeof rawPart.text !== 'string') continue
      normalized.push(rawPart as any)
      continue
    }

    if (type.startsWith('tool-')) {
      const state = typeof rawPart.state === 'string' ? rawPart.state : undefined
      if (state == null) continue
      if (typeof rawPart.toolCallId !== 'string') continue
      if (!('input' in rawPart)) continue
      if (options.dropToolStates.includes(state)) continue
      if (state === 'output-available' && !('output' in rawPart)) continue
      if (state === 'output-error' && typeof rawPart.errorText !== 'string') continue
      if (options.sanitizePart) {
        normalized.push(options.sanitizePart(rawPart as any))
      } else {
        normalized.push(rawPart as any)
      }
      continue
    }

    if (type === 'dynamic-tool') {
      const state = typeof rawPart.state === 'string' ? rawPart.state : undefined
      if (state == null) continue
      if (typeof rawPart.toolName !== 'string') continue
      if (typeof rawPart.toolCallId !== 'string') continue
      if (!('input' in rawPart)) continue
      if (options.dropToolStates.includes(state)) continue
      if (state === 'output-available' && !('output' in rawPart)) continue
      if (state === 'output-error' && typeof rawPart.errorText !== 'string') continue
      if (options.sanitizePart) {
        normalized.push(options.sanitizePart(rawPart as any))
      } else {
        normalized.push(rawPart as any)
      }
      continue
    }

    // For anything else (data parts, sources, etc.), keep it and let `validateUIMessages`
    // decide whether it matches the current AI SDK schemas.
    normalized.push(rawPart as any)
  }

  return normalized
}

/**
 * Normalizes message history read from storage into a shape the AI SDK can reliably parse.
 * This is intentionally strict: unknown/invalid parts are dropped to avoid schema errors.
 */
export function normalizeUiMessages(
  messages: Array<unknown>,
  {
    dropReasoningParts = false,
    dropStepParts = true,
    dropEmptyMessages = true,
    dropToolStates = DEFAULT_DROP_TOOL_STATES,
    dropNonTextParts = false,
    sanitizePart,
  }: NormalizeUiMessagesOptions = {}
): UIMessage[] {
  const out: UIMessage[] = []

  for (let i = 0; i < messages.length; i++) {
    const rawMessage = messages[i]
    if (!isRecord(rawMessage)) continue

    const role = typeof rawMessage.role === 'string' ? rawMessage.role : undefined
    if (
      role !== 'user' &&
      role !== 'assistant' &&
      role !== 'system' &&
      role !== 'tool' &&
      role !== 'data'
    ) {
      continue
    }

    const id = typeof rawMessage.id === 'string' ? rawMessage.id : `msg-${i}`

    const parts =
      Array.isArray(rawMessage.parts) && rawMessage.parts.length > 0
        ? rawMessage.parts
        : typeof rawMessage.content === 'string'
          ? [{ type: 'text', text: rawMessage.content }]
          : []

    const normalizedParts = normalizeParts(parts, {
      dropReasoningParts,
      dropStepParts,
      dropToolStates,
      dropNonTextParts,
      sanitizePart,
    })

    if (dropEmptyMessages && normalizedParts.length === 0) continue

    const message: UIMessage = {
      id,
      role: role as UIMessage['role'],
      parts: normalizedParts,
    }

    if (rawMessage.metadata != null) {
      message.metadata = rawMessage.metadata as any
    }

    out.push(message)
  }

  return out
}
