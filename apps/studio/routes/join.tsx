import { createFileRoute } from '@tanstack/react-router'

import { OrganizationInvite } from '@/components/interfaces/OrganizationInvite/OrganizationInvite'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/join')({
  component: JoinOrganizationPage,
})

const PAGE_TITLE = buildStudioPageTitle({ section: 'Join Organization', brand: 'Supabase' })

function JoinOrganizationPage() {
  return (
    <>
      <title>{PAGE_TITLE}</title>
      <OrganizationInvite />
    </>
  )
}
