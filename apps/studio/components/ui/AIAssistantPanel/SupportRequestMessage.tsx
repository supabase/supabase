import { Mail } from 'lucide-react'

import {
  parseSupportAssistantPrompt,
  type ParsedSupportAssistantPrompt,
} from '@/components/interfaces/Support/SupportAssistant.utils'

export function parseSupportRequestMessage(text: string) {
  return parseSupportAssistantPrompt(text)
}

export function SupportRequestMessage({ request }: { request: ParsedSupportAssistantPrompt }) {
  return (
    <div className="not-prose rounded-lg border bg-surface-75 p-4 text-sm text-foreground-light">
      <div className="min-w-0 space-y-4">
        <div className="space-y-4">
          <Mail size={16} strokeWidth={1.5} className="text-foreground-muted" />
          <div className="space-y-1">
            <p className="heading-default text-foreground">Support request submitted</p>
            <p>
              Supabase Support already has this ticket. Assistant is reviewing the same request to
              help in the interim.
            </p>
          </div>
        </div>

        {request.subject && (
          <div>
            <p className="heading-meta text-foreground-light">Subject</p>
            <p className="text-foreground">{request.subject}</p>
          </div>
        )}
        {request.message && (
          <div>
            <p className="heading-meta text-foreground-light">Message</p>
            <p className="line-clamp-6 whitespace-pre-wrap break-words text-foreground">
              {request.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
