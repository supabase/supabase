import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  Header,
  LoadingCardView,
  NoOrganizationsState,
} from 'components/interfaces/Home/ProjectList/EmptyStates'
import { ProjectList } from 'components/interfaces/Home/ProjectList/ProjectList'
import { HomePageActions } from 'components/interfaces/HomePageActions'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { withAuth } from 'hooks/misc/withAuth'
import { AlertTriangleIcon } from 'lucide-react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

// [Joshen] I'd say we don't do route validation here, this page will act more
// like a proxy to the project specific pages, and we let those pages handle
// any route validation logic instead

const GenericProjectPage: NextPage = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { routeSlug, ...queryParams } = router.query

  const [lastVisitedOrgSlug] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const {
    data: organizations = [],
    isSuccess: isSuccessOrganizations,
    isPending: isLoadingOrganizations,
    isError: isErrorOrganizations,
  } = useOrganizationsQuery({
    enabled: IS_PLATFORM,
  })

  const [selectedSlug, setSlug] = useState<string>(
    slug || lastVisitedOrgSlug || organizations[0]?.slug
  )
  const selectedOrganization = organizations.find((x) => x.slug === selectedSlug)

  const query = Object.keys(queryParams).length
    ? `?${new URLSearchParams(queryParams as Record<string, string>)}`
    : undefined

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (projectRef: string) => {
      const hash = location.hash

      if (!Array.isArray(slug)) {
        return [`/project/${projectRef}`, query, hash].filter(Boolean).join('')
      }

      const slugPath = slug.join('/')
      return [`/project/${projectRef}/${slugPath}`, query, hash].filter(Boolean).join('')
    }
  }

  useEffect(() => {
    if (!!lastVisitedOrgSlug) {
      setSlug(lastVisitedOrgSlug)
    } else if (isSuccessOrganizations) {
      setSlug(organizations[0]?.slug)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastVisitedOrgSlug, isSuccessOrganizations])

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <PageLayout className="flex-grow min-h-0" title="Select a project to continue">
        <ScaffoldContainer className="flex-grow flex flex-col">
          {organizations.length > 0 && (
            <ScaffoldSection isFullWidth>
              <div className="flex items-center gap-x-2">
                <Select_Shadcn_ value={selectedSlug} onValueChange={setSlug}>
                  <SelectTrigger_Shadcn_ size="tiny" className="w-60 truncate">
                    <div className="flex items-center gap-x-2">
                      <p className="text-xs text-foreground-light">Organization:</p>
                      <SelectValue_Shadcn_ placeholder="Select an organization" />
                    </div>
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_ className="col-span-8">
                    {organizations.map((org) => (
                      <SelectItem_Shadcn_ key={org.slug} value={org.slug} className="text-xs">
                        {org.name}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
                <HomePageActions hideNewProject />
              </div>
            </ScaffoldSection>
          )}
          <ScaffoldSection isFullWidth className="flex-grow pt-0 flex flex-col gap-y-4 h-px">
            {isLoadingOrganizations ? (
              <LoadingCardView />
            ) : isErrorOrganizations ? (
              <Alert_Shadcn_ variant="warning">
                <AlertTriangleIcon />
                <AlertTitle_Shadcn_>Failed to load your Supabase organizations</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>Try refreshing the page</AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : organizations.length === 0 ? (
              <NoOrganizationsState />
            ) : !!selectedOrganization ? (
              <ProjectList
                organization={selectedOrganization}
                rewriteHref={urlRewriterFactory(routeSlug)}
              />
            ) : null}
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>
    </div>
  )
}

export default withAuth(GenericProjectPage)
