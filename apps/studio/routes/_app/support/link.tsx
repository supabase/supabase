import { createFileRoute } from '@tanstack/react-router'

import LinkSupportTicketPageRoute from '@/pages/support/link'

export const Route = createFileRoute('/_app/support/link')({
  component: SupportLinkRoute,
})

function SupportLinkRoute() {
  return <LinkSupportTicketPageRoute dehydratedState={undefined} />
}
