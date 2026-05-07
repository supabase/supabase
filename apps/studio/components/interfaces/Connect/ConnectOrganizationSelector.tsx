import { ChevronDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'

import { OrganizationCard } from '@/components/interfaces/Organization/OrganizationCard'
import type { Organization } from '@/types'

const VISIBLE_ORGANIZATIONS_LIMIT = 3

export const ConnectOrganizationSelector = ({
  organizations,
  unavailableOrganizations = [],
  selectedSlug,
  onSelect,
  disabled = false,
  unavailableReason,
  getOrganizationDescription,
  getUnavailableOrganizationDescription,
  createLabel,
  createDescription,
  onCreate,
}: {
  organizations: Organization[]
  unavailableOrganizations?: Organization[]
  selectedSlug?: string | null
  onSelect: (slug: string) => void
  disabled?: boolean
  unavailableReason?: ReactNode
  getOrganizationDescription?: (organization: Organization) => ReactNode
  getUnavailableOrganizationDescription?: (organization: Organization) => ReactNode
  createLabel?: string
  createDescription?: string
  onCreate?: () => void
}) => {
  const [showMore, setShowMore] = useState(false)
  const [showUnavailable, setShowUnavailable] = useState(false)

  const { visibleOrganizations, overflowOrganizations } = useMemo(() => {
    const selectedIndex = organizations.findIndex(({ slug }) => slug === selectedSlug)
    const selectedInOverflow = selectedIndex >= VISIBLE_ORGANIZATIONS_LIMIT

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
  }, [organizations, selectedSlug])

  const hasOverflow = overflowOrganizations.length > 0
  const hasUnavailable = unavailableOrganizations.length > 0

  return (
    <section className="space-y-2" aria-label="Organizations">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
        Organization
      </p>
      <div className="space-y-2">
        {visibleOrganizations.map((organization) => (
          <ConnectOrganizationButton
            key={organization.slug}
            organization={organization}
            selected={selectedSlug === organization.slug}
            disabled={disabled}
            onClick={() => onSelect(organization.slug)}
            description={getOrganizationDescription?.(organization)}
          />
        ))}

        {createLabel && onCreate && (
          <button
            type="button"
            disabled={disabled}
            onClick={onCreate}
            className={cn(
              'group block w-full text-left disabled:cursor-not-allowed disabled:opacity-50',
              disabled && 'pointer-events-none'
            )}
          >
            <OrganizationCard
              isLink={false}
              organization={createOrganizationCardModel(createLabel)}
              description={createDescription}
              className="pointer-events-none border-dashed shadow-none"
            />
          </button>
        )}

        {hasOverflow && (
          <Collapsible_Shadcn_ open={showMore} onOpenChange={setShowMore}>
            <CollapsibleTrigger_Shadcn_ className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-foreground-light transition hover:text-foreground">
              <span>{showMore ? 'Show fewer' : `Show ${overflowOrganizations.length} more`}</span>
              <ChevronDown
                className={cn('size-3.5 transition-transform', showMore && 'rotate-180')}
              />
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
              <div className="space-y-2 pt-1">
                {overflowOrganizations.map((organization) => (
                  <ConnectOrganizationButton
                    key={organization.slug}
                    organization={organization}
                    selected={selectedSlug === organization.slug}
                    disabled={disabled}
                    onClick={() => onSelect(organization.slug)}
                    description={getOrganizationDescription?.(organization)}
                  />
                ))}
              </div>
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
        )}

        {hasUnavailable && (
          <Collapsible_Shadcn_ open={showUnavailable} onOpenChange={setShowUnavailable}>
            <CollapsibleTrigger_Shadcn_ className="flex w-full items-center justify-between py-2 text-sm text-foreground-light transition hover:text-foreground">
              <span>Organizations that can't be linked</span>
              <ChevronDown
                className={cn('size-4 transition-transform', showUnavailable && 'rotate-180')}
              />
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
              <div className="space-y-3 pt-1">
                {unavailableReason && (
                  <p className="text-xs text-foreground-light">{unavailableReason}</p>
                )}
                <div className="space-y-2">
                  {unavailableOrganizations.map((organization) => (
                    <ConnectOrganizationButton
                      key={organization.slug}
                      organization={organization}
                      disabled
                      description={getUnavailableOrganizationDescription?.(organization)}
                    />
                  ))}
                </div>
              </div>
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
        )}
      </div>
    </section>
  )
}

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
      'block w-full text-left disabled:cursor-not-allowed disabled:opacity-50',
      disabled && 'pointer-events-none'
    )}
  >
    <OrganizationCard
      isLink={false}
      organization={organization}
      description={description}
      className={cn(
        'pointer-events-none shadow-none',
        selected && 'border-brand bg-brand-200/20 hover:border-brand hover:bg-brand-200/20'
      )}
    />
  </button>
)

const createOrganizationCardModel = (name: string): Organization => ({
  id: -1,
  name,
  slug: 'create-new-organization',
  plan: { id: 'free', name: 'Free' },
  managed_by: 'supabase',
  is_owner: true,
  billing_email: null,
  billing_partner: null,
  integration_source: null,
  usage_billing_enabled: true,
  stripe_customer_id: null,
  subscription_id: null,
  organization_requires_mfa: false,
  opt_in_tags: [],
  restriction_status: null,
  restriction_data: null,
  organization_missing_address: false,
  organization_missing_tax_id: false,
})
