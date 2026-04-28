import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'

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
  const projectRef =
    request.projectRef && request.projectRef !== NO_PROJECT_MARKER
      ? request.projectRef
      : 'No specific project selected'
  const organizationSlug =
    request.organizationSlug && request.organizationSlug !== NO_ORG_MARKER
      ? request.organizationSlug
      : 'No organization selected'

  return [
    '<support>',
    supportField(
      'assistant_context',
      'A support request has already been submitted to the Supabase Support team. Help the user troubleshoot while they wait for a support team member. Do not ask them to submit another support ticket for this same issue.'
    ),
    supportField('organization_slug', organizationSlug),
    supportField('project_ref', projectRef),
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
