import { CheckCircle2 } from 'lucide-react'

import {
  parseSupportAssistantPrompt,
  type ParsedSupportAssistantPrompt,
} from '@/components/interfaces/Support/SupportAssistant.utils'

const SUPPORT_SUMMARY_FIELDS: Array<{
  key: keyof ParsedSupportAssistantPrompt
  label: string
}> = [
  { key: 'organization_slug', label: 'Organization' },
  { key: 'project_ref', label: 'Project' },
  { key: 'category', label: 'Category' },
  { key: 'severity', label: 'Severity' },
  { key: 'affected_services', label: 'Affected services' },
  { key: 'library', label: 'Client library' },
  { key: 'support_access', label: 'Support access' },
  { key: 'dashboard_logs', label: 'Dashboard logs' },
]

export function parseSupportRequestMessage(text: string) {
  return parseSupportAssistantPrompt(text)
}

export function SupportRequestMessage({ request }: { request: ParsedSupportAssistantPrompt }) {
  return (
    <div className="not-prose rounded-lg border bg-surface-75 p-4 text-sm text-foreground-light">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-200 text-brand">
          <CheckCircle2 size={16} />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Support request submitted</p>
            <p>
              Supabase Support already has this ticket. Assistant is reviewing the same request to
              help in the interim.
            </p>
          </div>

          <div className="space-y-2 rounded-md border bg-background p-3">
            {request.subject && (
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-muted">Subject</p>
                <p className="text-foreground">{request.subject}</p>
              </div>
            )}
            {request.message && (
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-muted">Message</p>
                <p className="whitespace-pre-wrap text-foreground-light">{request.message}</p>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUPPORT_SUMMARY_FIELDS.map(({ key, label }) => {
              const value = request[key]
              if (!value || value === 'Not provided') return null

              return (
                <div key={key} className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
                  <dd className="truncate text-foreground">{value}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </div>
  )
}
