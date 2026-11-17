import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const Route = createFileRoute('/project/$ref/settings/billing/usage')({
  component: ProjectBillingUsage,
  staticData: { settingsLayoutTitle: 'Usage' },
})

function ProjectBillingUsage() {
  // This component is only used for redirects, as a server-side redirect can't read the hash
  const navigate = useNavigate()
  const { ref } = Route.useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { hash } = useLocation()

  useEffect(() => {
    if (!organization) return

    if (['cpu', 'ram', 'disk_io'].includes(hash)) {
      void navigate({ to: '/project/$ref/settings/infrastructure', params: { ref }, hash })
    } else {
      void navigate({
        to: '/org/$slug/usage',
        params: { slug: organization.slug },
        search: { projectRef: ref },
      })
    }
  }, [hash, organization, ref, navigate])

  return null
}
