import { SupportCategories } from '@supabase/shared-types/out/constants'
import { z } from 'zod'

import type { SubmittedSupportRequest } from './SupportForm.state'

const SUPPORT_ASSISTANT_FIELD_LABELS = {
  assistant_context: 'Assistant context',
  organization_slug: 'Organization',
  project_ref: 'Project',
  category: 'Category',
  severity: 'Severity',
  subject: 'Subject',
  message: 'Message',
  affected_services: 'Affected services',
  library: 'Client library',
  support_access: 'Support access',
  dashboard_logs: 'Dashboard logs',
} as const

export type ParsedSupportAssistantPrompt = Partial<
  Record<keyof typeof SUPPORT_ASSISTANT_FIELD_LABELS, string>
>

function escapeSupportTagValue(value: string | boolean | undefined) {
  if (value === undefined || value === '') return 'Not provided'

  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function unescapeSupportTagValue(value: string) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()
}

function supportField(
  name: keyof typeof SUPPORT_ASSISTANT_FIELD_LABELS,
  value: string | boolean | undefined
) {
  return `  <${name}>${escapeSupportTagValue(value)}</${name}>`
}

export function buildSupportAssistantPrompt(request: SubmittedSupportRequest) {
  return [
    '<support>',
    supportField(
      'assistant_context',
      'A support request has already been submitted and a human member of the Supabase Support team is already looking at it. Your role is to help the user troubleshoot in the interim while they wait for the human support response. Do not ask them to submit another support ticket for this same issue.'
    ),
    supportField('category', request.category),
    supportField('severity', request.severity),
    supportField('subject', request.subject),
    supportField('message', request.message),
    supportField('affected_services', request.affectedServices),
    supportField('library', request.library),
    supportField('support_access', request.allowSupportAccess ? 'Granted' : 'Not granted'),
    supportField('dashboard_logs', request.dashboardLogs ? 'Attached' : 'Not attached'),
    '</support>',
  ].join('\n')
}

export const ASSISTANT_HANDOFF_QUERY_PARAM = 'assistantHandoff'

// Not typed as z.ZodType<SubmittedSupportRequest>: zod always models "may be undefined"
// as an optional key, while SubmittedSupportRequest declares organizationSlug/projectRef
// as required keys whose value may be undefined — a distinction JSON can't carry anyway,
// since JSON.stringify drops undefined-valued keys entirely.
const AssistantHandoffSchema = z.object({
  organizationSlug: z.string().optional(),
  projectRef: z.string().optional(),
  category: z.union([
    z.nativeEnum(SupportCategories),
    z.literal('Plan_upgrade'),
    z.literal('Others'),
  ]),
  severity: z.string(),
  subject: z.string(),
  message: z.string(),
  affectedServices: z.string(),
  allowSupportAccess: z.boolean(),
  library: z.string().optional(),
  dashboardLogs: z.string().optional(),
  threadRef: z.string().optional(),
  frontConversationId: z.string().optional(),
})

const ASSISTANT_HANDOFF_STORAGE_PREFIX = 'assistant-handoff:'

// The handoff URL only ever carries an opaque token — the actual ticket content (subject,
// message, any attached log links) is kept out of the URL entirely (browser history,
// referrer headers, server logs, a copy-pasted link) by round-tripping it through
// sessionStorage instead, scoped to this one tab and gone once it's been read or the tab closes.
export function storeAssistantHandoff(token: string, request: SubmittedSupportRequest): void {
  try {
    sessionStorage.setItem(ASSISTANT_HANDOFF_STORAGE_PREFIX + token, JSON.stringify(request))
  } catch {
    // Handoff will just fail closed (no context) on the receiving end — not worth
    // surfacing an error for a private-browsing/storage-full edge case.
  }
}

export function consumeAssistantHandoff(token: string): SubmittedSupportRequest | null {
  const key = ASSISTANT_HANDOFF_STORAGE_PREFIX + token

  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null

    const parsed = AssistantHandoffSchema.safeParse(JSON.parse(raw))
    return parsed.success ? (parsed.data as SubmittedSupportRequest) : null
  } catch {
    return null
  } finally {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Best-effort cleanup — a failure here shouldn't override the value (or null)
      // already produced above.
    }
  }
}

export function parseSupportAssistantPrompt(text: string): ParsedSupportAssistantPrompt | null {
  const supportMatch = text.match(/<support>([\s\S]*?)<\/support>/i)
  if (!supportMatch) return null

  const parsed = Object.keys(SUPPORT_ASSISTANT_FIELD_LABELS).reduce<ParsedSupportAssistantPrompt>(
    (acc, field) => {
      const fieldMatch = supportMatch[1].match(
        new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`, 'i')
      )
      if (fieldMatch) {
        acc[field as keyof typeof SUPPORT_ASSISTANT_FIELD_LABELS] = unescapeSupportTagValue(
          fieldMatch[1]
        )
      }
      return acc
    },
    {}
  )

  return Object.keys(parsed).length > 0 ? parsed : null
}
