import { Check, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, Card, CardContent, DialogSectionSeparator } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { LinkSupportTicketForm } from './LinkSupportTicketForm'

export function LinkSupportTicketPage() {
  return (
    <div className="mx-auto my-16 max-w-2xl w-full px-4 lg:px-6">
      <LinkSupportTicketPageContent />
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
    <Card className="min-w-full w-full">
      <CardContent className="space-y-12 border-none py-8 px-0">
        {isSuccess ? (
          <LinkSupportTicketSuccess />
        ) : (
          <LinkSupportTicketForm
            conversationId={conversationId}
            onSuccess={() => setIsSuccess(true)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function LinkSupportTicketSuccess() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center gap-y-4 py-8">
        <div className="relative">
          <Mail strokeWidth={1.5} size={60} className="text-brand" />
          <div className="h-6 w-6 rounded-full bg-brand absolute bottom-1 -right-1.5 flex items-center justify-center">
            <Check strokeWidth={4} size={16} className="text-contrast" />
          </div>
        </div>
        <div className="flex items-center flex-col gap-y-2 text-center">
          <h3 className="text-xl">Support ticket linked</h3>
          <p className="text-sm text-foreground-light">
            Your support conversation has been linked to your account.
          </p>
        </div>
      </div>
      <DialogSectionSeparator />
      <div className="w-full py-4 px-4 flex items-center justify-end">
        <Button asChild variant="default">
          <Link href="/">Finish</Link>
        </Button>
      </div>
    </div>
  )
}
