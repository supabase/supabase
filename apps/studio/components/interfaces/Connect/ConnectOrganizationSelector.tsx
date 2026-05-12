import { Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import { cn, Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_ } from 'ui'

import { OrganizationCard } from '@/components/interfaces/Organization/OrganizationCard'
import type { Organization } from '@/types'

const VISIBLE_ORGANIZATIONS_LIMIT = 3
const CREATE_ORGANIZATION_CARD_CLASSNAME =
  'pointer-events-none border-dashed shadow-none transition-colors group-hover:border-default group-hover:bg-surface-200'

export const ConnectOrganizationSelector = ({
  organizations,
  unavailableOrganizations = [],
  selectedSlug,
  onSelect,
  disabled = false,
  unavailableReason,
  description,
  getOrganizationDescription,
  getUnavailableOrganizationDescription,
  createLabel,
  createDescription,
  createHref,
  onCreate,
}: {
  organizations: Organization[]
  unavailableOrganizations?: Organization[]
  selectedSlug?: string | null
  onSelect: (slug: string) => void
  disabled?: boolean
  unavailableReason?: ReactNode
  description?: ReactNode
  getOrganizationDescription?: (organization: Organization) => ReactNode
  getUnavailableOrganizationDescription?: (organization: Organization) => ReactNode
  createLabel?: string
  createDescription?: string
  createHref?: string
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

        {createLabel &&
          (createHref ? (
            <Link
              href={createHref}
              className={cn(
                'group block w-full cursor-pointer text-left',
                disabled && 'pointer-events-none opacity-50'
              )}
              aria-disabled={disabled}
            >
              <OrganizationCard
                isLink={false}
                organization={createOrganizationCardModel(createLabel)}
                description={createDescription ?? null}
                className={CREATE_ORGANIZATION_CARD_CLASSNAME}
              />
            </Link>
          ) : onCreate ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onCreate}
              className={cn(
                'group block w-full cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-50',
                disabled && 'pointer-events-none'
              )}
            >
              <OrganizationCard
                isLink={false}
                organization={createOrganizationCardModel(createLabel)}
                description={createDescription ?? null}
                className={CREATE_ORGANIZATION_CARD_CLASSNAME}
              />
            </button>
          ) : null)}

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
                    description={
                      getOrganizationDescription?.(organization) ?? getPlanDescription(organization)
                    }
                  />
                ))}
              </div>
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
        )}

        {hasUnavailable && (
          <Collapsible_Shadcn_ open={showUnavailable} onOpenChange={setShowUnavailable}>
            <CollapsibleTrigger_Shadcn_ className="flex w-full items-center justify-start gap-1.5 py-2 text-left text-xs text-foreground-lighter transition hover:text-foreground-light">
              <span>Organizations that can't be linked</span>
              <ChevronDown
                className={cn('size-3.5 transition-transform', showUnavailable && 'rotate-180')}
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
      <span className="pointer-events-none absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500 dark:bg-brand-200 text-white dark:text-brand">
        <Check className="size-3.5" strokeWidth={2} />
      </span>
    )}
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
