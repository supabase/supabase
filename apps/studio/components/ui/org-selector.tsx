import { ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, CardTitle, Input } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ButtonTooltip } from './ButtonTooltip'
import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
import { groupByOrganization } from '@/data/organizations/free-project-limit-check.utils'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import type { Organization } from '@/types'

export interface ProjectClaimChooseOrgProps {
  onSelect: (orgSlug: string) => void
  maxOrgsToShow?: number
  canCreateNewOrg: boolean
}

const OrganizationCard = ({
  org,
  onSelect,
}: {
  org: Organization
  onSelect: (orgSlug: string) => void
}) => {
  const isFreePlan = org.plan?.id === 'free'
  const { data: membersExceededLimit, isSuccess } = useFreeProjectLimitCheckQuery(
    { slug: org.slug },
    { enabled: isFreePlan }
  )
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const affectedOrganizations = groupByOrganization(membersExceededLimit ?? [])
  const freePlanWithExceedingLimits = isFreePlan && hasMembersExceedingFreeTierLimit

  return (
    <Card
      key={org.id}
      className="hover:bg-surface-200 rounded-none first:rounded-t-lg last:rounded-b-lg -mb-px"
    >
      <CardHeader className="flex flex-row justify-between border-none space-y-0 space-x-2">
        <CardTitle className="flex items-center gap-2 min-w-0 flex-1">
          <span className="truncate min-w-0" title={org.name}>
            {org.name}
          </span>
          <Badge className="shrink-0">{org.plan?.name}</Badge>
        </CardTitle>
        <ButtonTooltip
          tooltip={{
            content: {
              text:
                isSuccess && freePlanWithExceedingLimits ? (
                  <div className="space-y-3 w-96 p-2">
                    <p className="text-sm leading-normal">
                      Owners and administrators are limited in how many active Free Plan projects
                      they can have across all organizations. Members over the limit:
                    </p>
                    <ul className="space-y-2">
                      {affectedOrganizations.map((affectedOrg) => (
                        <li key={affectedOrg.slug}>
                          <span className="text-foreground">{affectedOrg.name}</span>
                          <ul className="pl-5 list-disc">
                            {affectedOrg.projects.map((project) => (
                              <li key={project.ref}>{project.name}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-foreground-lighter">
                            Members:{' '}
                            {affectedOrg.members
                              .map((member) => `${member.label} (limit: ${member.limit})`)
                              .join(', ')}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm leading-normal">
                      They will need to delete, pause, or upgrade one or more of these projects
                      before you can create a free project within this organization.
                    </p>
                  </div>
                ) : undefined,
            },
          }}
          size="small"
          onClick={() => {
            onSelect(org.slug)
          }}
          className="shrink-0"
          disabled={isSuccess && freePlanWithExceedingLimits}
        >
          Choose
        </ButtonTooltip>
      </CardHeader>
    </Card>
  )
}

export function OrganizationSelector({
  onSelect,
  maxOrgsToShow = 5,
  canCreateNewOrg,
}: ProjectClaimChooseOrgProps) {
  const {
    data: organizations = [],
    isPending: isLoadingOrgs,
    isSuccess: isSuccessOrgs,
    isError: isErrorOrgs,
  } = useOrganizationsQuery()

  const [search, setSearch] = useQueryState(
    'org',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )
  const [showAll, setShowAll] = useState(false)

  const filteredOrgs = useMemo(() => {
    if (!search) {
      return showAll ? organizations : organizations.slice(0, maxOrgsToShow)
    }
    return organizations.filter((org) => org.name.toLowerCase().includes(search.toLowerCase()))
  }, [organizations, search, showAll, maxOrgsToShow])

  const searchParams = new URLSearchParams(location.search)
  let pathname = location.pathname
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  if (basePath) {
    pathname = pathname.replace(basePath, '')
  }

  searchParams.set('returnTo', pathname)

  const onSelectOrg = (orgSlug: string) => {
    onSelect(orgSlug)
    setSearch('')
  }

  return (
    <div className="w-full flex flex-col gap-y-4">
      {isLoadingOrgs ? (
        <ShimmeringLoader />
      ) : isErrorOrgs ? (
        <div>Error</div>
      ) : isSuccessOrgs && organizations.length === 0 ? (
        <span className="text-sm text-foreground-light">
          It seems you don't have any organizations yet.
        </span>
      ) : (
        <>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
          <div>
            {filteredOrgs.length === 0 && (
              <div className="text-center text-foreground-light py-6">No organizations found.</div>
            )}
            {filteredOrgs.map((org) => (
              <OrganizationCard key={org.id} org={org} onSelect={onSelectOrg} />
            ))}
            {organizations.length > maxOrgsToShow && !showAll && !search && (
              <div className="flex justify-center py-2">
                <Button
                  icon={<ChevronDownIcon className="w-4 h-4" />}
                  size="tiny"
                  onClick={() => {
                    setSearch('')
                    setShowAll(true)
                  }}
                >
                  Show all organizations
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      {canCreateNewOrg && (
        <Card className="flex items-center justify-between border-dashed pr-6">
          <CardHeader className="border-none">
            <CardTitle>Need a new organization?</CardTitle>
          </CardHeader>
          <Button size="small" className="" asChild>
            <Link href={`/new?${searchParams.toString()}`}>New Organization</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
