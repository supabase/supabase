import { Check, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { Button, cn, DialogSectionSeparator } from 'ui'
import { Admonition } from 'ui-patterns'
import { HighlightProjectRefProvider } from './HighlightContext'
import { LinkSupportTicketForm } from './LinkSupportTicketForm'

export function LinkSupportTicketPage() {
  return (
    <div className="h-full relative overflow-y-auto overflow-x-hidden">
      <div className="h-full flex flex-col gap-y-8 items-center justify-center mx-auto max-w-2xl w-full px-4 lg:px-6">
        <HighlightProjectRefProvider>
          <LinkSupportTicketPageContent />
        </HighlightProjectRefProvider>
      </div>
    </div>
  )
}

function LinkSupportTicketPageContent() {
  const router = useRouter()
  const conversationId = router.query.conversationId as string | undefined
  const [isSuccess, setIsSuccess] = useState(false)

  // Wait for router to be ready before checking for conversationId
  if (!router.isReady) {
    return null
  }

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
    <div
      className={cn(
        'min-w-full w-full space-y-12 rounded border bg-panel-body-light shadow-md border-default'
      )}
    >
      {isSuccess ? (
        <LinkSupportTicketSuccess />
      ) : (
        <LinkSupportTicketForm
          conversationId={conversationId}
          onSuccess={() => setIsSuccess(true)}
        />
      )}
    </div>
  )
}

function LinkSupportTicketSuccess() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center gap-y-4 py-8">
        <div className="relative">
          <Mail strokeWidth={1.5} size={60} className="text-brand" />
          <div className="h-6 w-6 rounded-full bg-brand absolute bottom-1 -right-1.5 flex items-center justify-center">
            <Check strokeWidth={4} size={18} />
          </div>
        </div>
        <div className="flex items-center flex-col gap-y-2 text-center">
          <h3 className="text-xl">Support ticket linked successfully!</h3>
          <p className="text-sm text-foreground-light">
            Your support conversation has been linked to your account.
          </p>
        </div>
      </div>
      <DialogSectionSeparator />
      <div className="w-full py-4 px-4 flex items-center justify-end">
        <Link href="/">
          <Button>Go back</Button>
        </Link>
      </div>
    </div>
  )
}
