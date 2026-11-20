import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { LinkSupportTicketPage } from '@/components/interfaces/Support/LinkSupportTicketPage'
import { withAuth } from '@/hooks/misc/withAuth'
import { IS_PLATFORM } from '@/lib/constants'

export const Route = createFileRoute('/_app/support/link')({
  component: SupportLinkRoute,
})

function SupportLinkRoute() {
  return <LinkSupportTicketPageRouteWithAuth />
}

function LinkSupportTicketPageRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!IS_PLATFORM) {
      void navigate({ href: '/404' })
    }
  }, [navigate])

  if (!IS_PLATFORM) {
    return null
  }

  return <LinkSupportTicketPage />
}

const LinkSupportTicketPageRouteWithAuth = withAuth(LinkSupportTicketPageRoute, {
  useHighestAAL: false,
})
