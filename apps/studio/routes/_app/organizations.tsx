import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, Skeleton } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection } from 'ui-patterns/PageSection'

import { NoOrganizationsState } from '@/components/interfaces/Home/ProjectList/EmptyStates'
import { OrganizationCard } from '@/components/interfaces/Organization/OrganizationCard'
import { AlertError } from '@/components/ui/AlertError'
import { NoSearchResults } from '@/components/ui/NoSearchResults'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/_app/organizations')({
  component: Organizations,
  staticData: {
    defaultLayoutHeaderTitle: 'Organizations',
    hideMobileMenu: true,
  },
})

function Organizations() {
  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Your organizations</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <OrganizationsPageWithAuth />
    </>
  )
}

function OrganizationsPage() {
  const { appTitle } = useCustomContent(['app:title'])
  const [search, setSearch] = useState('')
  const pageTitle = buildStudioPageTitle({
    section: 'Organizations',
    brand: appTitle || 'Supabase',
  })

  const {
    data: organizations = [],
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const searchTerm = search.trim().toLowerCase()
  const filteredOrganizations =
    searchTerm.length === 0
      ? organizations
      : organizations?.filter(
          (x) =>
            x.name.toLowerCase().includes(searchTerm) || x.slug.toLowerCase().includes(searchTerm)
        )

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content="Supabase Studio" />
      <PageContainer>
        <PageSection className="gap-y-4 last:pb-6">
          {organizations.length > 0 && (
            <div className="flex items-center justify-between gap-x-2 md:gap-x-3">
              <Input
                size="tiny"
                placeholder="Search for an organization"
                icon={<SearchIcon />}
                className="w-full flex-1 md:w-64"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {organizationCreationEnabled && (
                <Button asChild icon={<PlusIcon />} variant="primary" className="w-min">
                  <Link to="/new">New organization</Link>
                </Button>
              )}
            </div>
          )}

          {isSuccess && organizations.length === 0 && !isError && <NoOrganizationsState />}

          {searchTerm.length > 0 && filteredOrganizations.length === 0 && (
            <NoSearchResults searchString={search.trim()} />
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && (
              <>
                <Skeleton className="h-[70px] rounded-md" />
                <Skeleton className="h-[70px] rounded-md" />
                <Skeleton className="h-[70px] rounded-md" />
              </>
            )}
            {isError && <AlertError error={error} subject="Failed to load organizations" />}
            {isSuccess &&
              filteredOrganizations.map((org) => (
                <OrganizationCard key={org.id} organization={org} />
              ))}
          </div>
        </PageSection>
      </PageContainer>
    </>
  )
}

const OrganizationsPageWithAuth = withAuth(OrganizationsPage)
