import { NextPage } from 'next'
import { useRouter } from 'next/router'

import {
  Header,
  LoadingCardView,
  NoOrganizationsState,
} from 'components/interfaces/Home/ProjectList/EmptyStates'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import CardButton from 'components/ui/CardButton'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import { cn } from 'ui'

// [Joshen] Thinking we can deprecate this page in favor of /organizations
const GenericOrganizationPage: NextPage = () => {
  const router = useRouter()

  const { data: organizations, isLoading } = useOrganizationsQuery()
  const { routeSlug, ...queryParams } = router.query
  const queryString =
    Object.keys(queryParams).length > 0
      ? new URLSearchParams(queryParams as Record<string, string>).toString()
      : ''

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (orgSlug: string) => {
      if (!Array.isArray(slug)) {
        return `/org/${orgSlug}/general?${queryString}`
      } else {
        const slugPath = slug.reduce((a: string, b: string) => `${a}/${b}`, '').slice(1)
        return `/org/${orgSlug}/${slugPath}?${queryString}`
      }
    }
  }

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
                    {organizations?.map((organization) => (
                      <li key={organization.slug} className="col-span-1">
                        <CardButton
                          linkHref={urlRewriterFactory(routeSlug)(organization.slug)}
                          title={
                            <div className="flex w-full flex-row justify-between gap-1">
                              <span className="flex-shrink truncate">{organization.name}</span>
                            </div>
                          }
                          footer={
                            <div className="flex items-end justify-between">
                              <span className="text-sm lowercase text-foreground-light">
                                {organization.slug}
                              </span>
                            </div>
                          }
                        />
                      </li>
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
