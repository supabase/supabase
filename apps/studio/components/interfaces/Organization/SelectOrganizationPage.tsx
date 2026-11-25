import { useLocation } from '@tanstack/react-router'
import { cn } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection } from 'ui-patterns/PageSection'

import {
  Header,
  LoadingCardView,
  NoOrganizationsState,
} from '@/components/interfaces/Home/ProjectList/EmptyStates'
import { buildOrgUrl } from '@/components/interfaces/Organization/Organization.utils'
import { OrganizationCard } from '@/components/interfaces/Organization/OrganizationCard'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

function SelectOrganization() {
  const { pathname, searchStr } = useLocation()
  // `/org/_/billing` → ['billing']; the splat route nests under the `/org/_` route,
  // which renders this page, so the trailing path is read from the location
  const trailingSegments = pathname
    .replace(/^\/org\/_\/?/, '')
    .split('/')
    .filter(Boolean)
  const routeSlug = trailingSegments.length > 0 ? trailingSegments : undefined
  const { appTitle } = useCustomContent(['app:title'])
  const queryString = searchStr.replace(/^\?/, '')

  const { data: organizations, isPending: isLoading } = useOrganizationsQuery()
  const pageTitle = buildStudioPageTitle({
    section: 'Select an organization',
    surface: 'Organizations',
    brand: appTitle || 'Supabase',
  })

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content="Supabase Studio" />
      <Header />
      <div className="flex w-full min-h-0 grow flex-col items-stretch">
        <PageHeader>
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Select an organization to continue</PageHeaderTitle>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>
        <PageContainer>
          <PageSection className="last:pb-6">
            <div
              className="grow overflow-y-auto"
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
          </PageSection>
        </PageContainer>
      </div>
    </>
  )
}

export const SelectOrganizationPage = withAuth(SelectOrganization)
