'use client'

import { OrganizationProjectsHomeContent } from 'components/interfaces/Organization/OrganizationProjectsHomeContent'

export default function V2OrgProjectsPage() {
  return (
    <OrganizationProjectsHomeContent
      rewriteProjectHref={(projectRef) => `/v2/project/${projectRef}`}
    />
  )
}
