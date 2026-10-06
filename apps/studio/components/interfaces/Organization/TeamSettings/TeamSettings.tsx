import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Admonition } from 'ui-patterns/Admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection } from 'ui-patterns/PageSection'

import { InviteMemberButton } from './InviteMemberButton'
import { MembersView } from './MembersView'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainer,
  ScaffoldFilterAndContent,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from '@/components/layouts/Scaffold'
import { DocsButton } from '@/components/ui/DocsButton'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL } from '@/lib/constants'

export const TeamSettings = () => {
  const { slug } = useParams()
  const [searchString, setSearchString] = useState('')

  const debouncedSearch = useDebounce(searchString, 500)

  const { data: roles } = useOrganizationRolesV2Query({ slug })
  const hasProjectScopedRoles = (roles?.project_scoped_roles ?? []).length > 0

  const { data } = useOrgProjectsInfiniteQuery({ slug })
  const totalCount = data?.pages[0].pagination.count ?? 0
  const threshold = 1000

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Team</PageHeaderTitle>
            <PageHeaderDescription>Manage team members and invitations</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="default">
        <PageSection className="pt-4 last:pb-0">
          <ScaffoldFilterAndContent>
            <ScaffoldActionsContainer className="w-full flex-col md:flex-row gap-2 justify-between">
              <Input
                size="tiny"
                autoComplete="off"
                icon={<Search />}
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                name="email"
                id="email"
                placeholder="Filter members"
              />
              <ScaffoldActionsGroup className="w-full md:w-auto">
                <DocsButton href={`${DOCS_URL}/guides/platform/access-control`} />
                <InviteMemberButton />
              </ScaffoldActionsGroup>
            </ScaffoldActionsContainer>

            {hasProjectScopedRoles && totalCount > threshold && (
              <Admonition
                type="warning"
                title="This page may not render properly due to the number of projects your account has access to"
                description="We're actively looking into optimizing this page and will make things available as soon as we can!"
              />
            )}

            <ScaffoldSectionContent className="w-full">
              <MembersView
                searchString={searchString.length === 0 ? searchString : debouncedSearch}
              />
            </ScaffoldSectionContent>
          </ScaffoldFilterAndContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
