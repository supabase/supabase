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
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-foreground-light">
          <Mail size={16} strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <p className="heading-default text-foreground">Support request submitted</p>
            <p>
              Supabase Support already has this ticket. Assistant is reviewing the same request to
              help in the interim.
            </p>
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
    </div>
  )
}
