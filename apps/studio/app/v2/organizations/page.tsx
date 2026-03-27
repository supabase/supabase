'use client'

import { OrganizationsHomeContent } from 'components/interfaces/Organization/OrganizationsHomeContent'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { withAuth } from 'hooks/misc/withAuth'
import { buildStudioPageTitle } from 'lib/page-title'
import { useEffect } from 'react'

function V2OrganizationsPage() {
  const { appTitle } = useCustomContent(['app:title'])

  useEffect(() => {
    document.title = buildStudioPageTitle({
      section: 'Organizations',
      brand: appTitle || 'Supabase',
    })
  }, [appTitle])

  return <OrganizationsHomeContent organizationHref={(org) => `/v2/org/${org.slug}`} />
}

export default withAuth(V2OrganizationsPage)
