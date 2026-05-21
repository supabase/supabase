// BISECT STUB: original body removed to isolate whether the new useChat
// consumer and AIAssistantPanel/Message import are what hangs the
// Vercel Turbopack build. See PR #46199 for context.

import type { SubmittedSupportRequest } from './SupportForm.state'

interface SupportAssistantSuccessCardProps {
  request: SubmittedSupportRequest
  className?: string
}

export function SupportAssistantSuccessCard(_props: SupportAssistantSuccessCardProps) {
  return null
}
