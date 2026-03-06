import {
  Header,
  LoadingCardView,
  NoOrganizationsState,
} from 'components/interfaces/Home/ProjectList/EmptyStates'
import { buildOrgUrl } from 'components/interfaces/Organization/Organization.utils'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { cn } from 'ui'

import { OrganizationCard } from '@/components/interfaces/Organization/OrganizationCard'

const GenericOrganizationPage: NextPage = () => {
  const router = useRouter()
  const { routeSlug, ...queryParams } = router.query
  const queryString =
    Object.keys(queryParams).length > 0
      ? new URLSearchParams(queryParams as Record<string, string>).toString()
      : ''

  const { data: organizations, isPending: isLoading } = useOrganizationsQuery()

  return (
    <>
      <Header />
      <PageLayout className="flex-grow min-h-0" title="Select an organization to continue">
        <ScaffoldContainer>
          <ScaffoldSection isFullWidth>
            <div
              className="flex-grow overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 49px - 64px)' }}
            >
              <div className="w-full mx-auto flex flex-col gap-y-8">
                {isLoading ? (
                  <LoadingCardView />
                ) : organizations?.length === 0 ? (
                  <NoOrganizationsState />
                ) : (
                  <ul
                    className={cn(
                      'w-full mx-auto grid grid-cols-1 gap-4',
                      'sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                    )}
                  >
                    {organizations?.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        organization={org}
                        href={buildOrgUrl({ slug: routeSlug, orgSlug: org.slug, queryString })}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>
    </>
  )
}

export default withAuth(GenericOrganizationPage)
