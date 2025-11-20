import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { Admonition } from 'ui-patterns'
import { LinkSupportTicketForm } from './LinkSupportTicketForm'

export function LinkSupportTicketPage() {
  return (
    <LinkSupportTicketPageWrapper>
      <LinkSupportTicketPageContent />
    </LinkSupportTicketPageWrapper>
  )
}

function LinkSupportTicketPageContent() {
  const router = useRouter()
  const conversationId = router.query.conversationId as string | undefined

  if (!conversationId) {
    return (
      <Admonition
        type="warning"
        title="Missing conversation ID"
        description="Please provide a conversationId in the URL to link your support ticket."
      />
    )
  }

  return (
    <div className="min-w-full w-full space-y-12 rounded border bg-panel-body-light shadow-md py-8 border-default">
      <LinkSupportTicketForm conversationId={conversationId} />
    </div>
  )
}

function LinkSupportTicketPageWrapper({ children }: PropsWithChildren) {
  return (
    <div className="relative overflow-y-auto overflow-x-hidden">
      <div className="mx-auto my-16 max-w-2xl w-full px-4 lg:px-6">
        <div className="flex flex-col gap-y-8">{children}</div>
      </div>
    </div>
  )
}
