import { ChevronDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger, SuccessCheck } from 'ui'

import {
  CreateOrganizationCard,
  OrganizationCard,
} from '@/components/interfaces/Organization/OrganizationCard'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import type { Organization } from '@/types'

const VISIBLE_ORGANIZATIONS_LIMIT = 3
const CONNECT_DISCLOSURE_TRIGGER_CLASSNAME = cn(
  'mx-auto flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2',
  'text-xs text-foreground-lighter transition-colors',
  'hover:bg-surface-200 hover:text-foreground',
  '[&[data-state=open]>svg]:-rotate-180!'
)

export const OrganizationSelector = ({
  organizations,
  unavailableOrganizations = [],
  selectedSlug,
  disabled = false,
  description,
  createLabel,
  createHrefParams,
  onCreate,
  onSelect,
  getOrganizationDescription,
  getUnavailableOrganizationDescription,
  unavailableReason,
}: {
  organizations: Organization[]
  unavailableOrganizations?: Organization[]
  selectedSlug?: string | null
  disabled?: boolean
  description?: ReactNode
  createLabel?: string
  createHrefParams?: { [key: string]: string }
  onCreate?: () => void
  onSelect: (slug: string) => void
  getOrganizationDescription?: (organization: Organization) => ReactNode
  getUnavailableOrganizationDescription?: (organization: Organization) => ReactNode
  unavailableReason?: ReactNode
}) => {
  const [showMore, setShowMore] = useState(false)
  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const { visibleOrganizations, overflowOrganizations } = useMemo(() => {
    const lastVisitedOrg = organizations.find(({ slug }) => slug === lastVisitedOrganization)
    const selectedIndex = organizations.findIndex(({ slug }) => slug === selectedSlug)
    const selectedInOverflow = selectedIndex >= VISIBLE_ORGANIZATIONS_LIMIT

    if (!!lastVisitedOrg) {
      const withoutLastVisited = organizations.filter(
        ({ slug }) => slug !== lastVisitedOrganization
      )
      return {
        visibleOrganizations: [
          lastVisitedOrg,
          ...withoutLastVisited.slice(0, VISIBLE_ORGANIZATIONS_LIMIT - 1),
        ],
        overflowOrganizations: withoutLastVisited.slice(VISIBLE_ORGANIZATIONS_LIMIT - 1),
      }
    }

    if (!selectedInOverflow || !selectedSlug) {
      return {
        visibleOrganizations: organizations.slice(0, VISIBLE_ORGANIZATIONS_LIMIT),
        overflowOrganizations: organizations.slice(VISIBLE_ORGANIZATIONS_LIMIT),
      }
    }

    const selected = organizations[selectedIndex]
    const withoutSelected = organizations.filter(({ slug }) => slug !== selectedSlug)

    return {
      visibleOrganizations: [
        ...withoutSelected.slice(0, VISIBLE_ORGANIZATIONS_LIMIT - 1),
        selected,
      ],
      overflowOrganizations: withoutSelected.slice(VISIBLE_ORGANIZATIONS_LIMIT - 1),
    }
  }, [lastVisitedOrganization, organizations, selectedSlug])

  const hasOverflow = overflowOrganizations.length > 0
  const hasUnavailableOrganizations = unavailableOrganizations.length > 0

  return (
    <section className="space-y-2" aria-label="Organizations">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
          Organization
        </p>
        {description && <p className="text-xs text-foreground-lighter pr-4">{description}</p>}
      </div>
      <div className="space-y-2">
        {visibleOrganizations.map((organization) => (
          <ConnectOrganizationButton
            key={organization.slug}
            organization={organization}
            selected={selectedSlug === organization.slug}
            disabled={disabled}
            onClick={() => onSelect(organization.slug)}
            description={
              getOrganizationDescription?.(organization) ?? getPlanDescription(organization)
            }
          />
        ))}

        {!!createLabel && (!!createHrefParams || !!onCreate) && (
          <CreateOrganizationCard
            params={createHrefParams}
            label={createLabel}
            disabled={disabled}
            onClick={onCreate}
          />
        )}

        {hasOverflow && (
          <Collapsible open={showMore} onOpenChange={setShowMore}>
            <CollapsibleTrigger className={CONNECT_DISCLOSURE_TRIGGER_CLASSNAME}>
              <span>{showMore ? 'Show fewer' : `Show ${overflowOrganizations.length} more`}</span>
              <ChevronDown className="size-3.5 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
              <div className="space-y-2 pt-1">
                {overflowOrganizations.map((organization) => (
                  <ConnectOrganizationButton
                    key={organization.slug}
                    organization={organization}
                    selected={selectedSlug === organization.slug}
                    disabled={disabled}
                    onClick={() => onSelect(organization.slug)}
                    description={
                      getOrganizationDescription?.(organization) ?? getPlanDescription(organization)
                    }
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {hasUnavailableOrganizations && (
          <Collapsible>
            <CollapsibleTrigger className={CONNECT_DISCLOSURE_TRIGGER_CLASSNAME}>
              <span>Organizations that can't be linked</span>
              <ChevronDown className="size-3.5 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
              <div className="space-y-2 pt-1">
                {unavailableOrganizations.map((organization) => (
                  <ConnectOrganizationButton
                    key={organization.slug}
                    organization={organization}
                    disabled
                    description={
                      getUnavailableOrganizationDescription?.(organization) ??
                      getPlanDescription(organization)
                    }
                  />
                ))}
                {unavailableReason && (
                  <p className="mx-auto max-w-xs text-center text-xs text-foreground-lighter text-balance">
                    {unavailableReason}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </section>
  )
}

const getPlanDescription = (organization: Organization) => `${organization.plan.name} Plan`

const ConnectOrganizationButton = ({
  organization,
  selected,
  disabled,
  onClick,
  description,
}: {
  organization: Organization
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  description?: ReactNode
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'group relative block w-full cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-50',
      disabled && 'pointer-events-none'
    )}
  >
    <OrganizationCard
      isLink={false}
      organization={organization}
      description={description}
      className={cn(
        'pointer-events-none shadow-none transition-colors',
        !disabled && !selected && 'group-hover:border-default group-hover:bg-surface-200',
        selected &&
          'border-brand bg-brand-200/20 dark:bg-brand-300 pr-10 group-hover:border-brand group-hover:bg-brand-200/20'
      )}
    />
    {selected && (
      <SuccessCheck className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
    )}
  </button>
)
