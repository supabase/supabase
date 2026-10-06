import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Search } from 'lucide-react'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useState } from 'react'
import { cn, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui'
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
import { MFA_FILTER_OPTIONS, type MfaFilter } from './MembersList.constants'
import { MembersView } from './MembersView'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from '@/components/layouts/Scaffold'
import { DocsButton } from '@/components/ui/DocsButton'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL } from '@/lib/constants'

export const TeamSettings = () => {
  const { slug } = useParams()
  const [searchString, setSearchString] = useState('')
  const [mfaFilter, setMfaFilter] = useQueryState(
    'mfa',
    parseAsStringEnum<MfaFilter>(MFA_FILTER_OPTIONS.map((option) => option.value)).withDefault(
      'all'
    )
  )

  const mfaFilterLabel =
    mfaFilter === 'all'
      ? 'MFA status'
      : MFA_FILTER_OPTIONS.find((option) => option.value === mfaFilter)?.label

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
              <div className="flex items-center gap-x-2">
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
                <Select
                  value={mfaFilter}
                  onValueChange={(value) => setMfaFilter(value as MfaFilter)}
                >
                  <SelectTrigger
                    size="tiny"
                    aria-label="Filter by MFA status"
                    className={cn('w-32 bg-transparent!', mfaFilter === 'all' && 'border-dashed')}
                  >
                    <SelectValue>{mfaFilterLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {MFA_FILTER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
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
                mfaFilter={mfaFilter}
              />
            </ScaffoldSectionContent>
          </ScaffoldFilterAndContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
