import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { TemporaryAccessOnboarding } from '@/components/interfaces/TemporaryAccess/TemporaryAccessOnboarding'
import { useOrgProjectsForTemporaryAccess } from '@/data/jit-db-access/use-my-temporary-access-grants-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'

const JoinTemporaryAccessOnboardingPage = () => {
  const router = useRouter()
  const slug = useMemo(() => {
    const querySlug = router.query.slug
    return typeof querySlug === 'string' ? querySlug : undefined
  }, [router.query.slug])
  const { data: organizations = [] } = useOrganizationsQuery()
  const organization = organizations.find((org) => org.slug === slug)
  const { grants, isLoading } = useOrgProjectsForTemporaryAccess({ slug })

  useEffect(() => {
    if (!isLoading && grants.length === 0) {
      router.replace('/organizations')
    }
  }, [grants.length, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (grants.length === 0) return null

  return (
    <TemporaryAccessOnboarding
      organizationName={organization?.name ?? 'your organization'}
      grants={grants}
    />
  )
}

export default withAuth(JoinTemporaryAccessOnboardingPage)
