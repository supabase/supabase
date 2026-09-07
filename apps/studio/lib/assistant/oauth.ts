import { z } from 'zod'

import { getAssistantApiUrl } from './backend'

const codeSchema = z.object({
  type: z.literal('assistant-oauth-code'),
  state: z.string(),
  code: z.string(),
})

export function assistantApiOrigin(apiUrl = getAssistantApiUrl()): string | undefined {
  if (!apiUrl) return undefined
  try {
    return new URL(apiUrl).origin
  } catch {
    return undefined
  }
}

export function readAssistantOAuthCode(
  event: { origin: string; source: unknown; data: unknown },
  expected: { origin: string | undefined; popup: unknown; state: string }
): string | undefined {
  if (!expected.origin || event.origin !== expected.origin || event.source !== expected.popup)
    return
  const parsed = codeSchema.safeParse(event.data)
  if (parsed.success && parsed.data.state === expected.state) return parsed.data.code
}
