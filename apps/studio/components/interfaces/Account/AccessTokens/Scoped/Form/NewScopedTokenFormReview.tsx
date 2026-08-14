import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import { PERMISSION_MODE_LABEL, selectionToScopes } from '../../AccessToken.permissions'
import {
  groupFailingResources,
  TOKEN_ROLE_LABEL,
  type TokenAccessEvaluation,
} from '../../AccessToken.roles'
import { useCapabilitySummary } from '../../hooks/useCapabilitySummary'
import { useOrgAndProjectData } from '../../hooks/useOrgAndProjectData'
import { failingResourceLine } from '../ExceedsRoleBadge'
import { CapabilitiesSection } from '../TokenCapabilities/CapabilitiesSection'
import { CapabilityLevelToggle } from '../TokenCapabilities/CapabilityLevelToggle'
import { RiskBanner } from '../TokenCapabilities/RiskBanner'
import {
  computeRiskBanner,
  getCapabilityDensityTier,
  type CapabilityLevelFilter,
} from '../TokenCapabilities/TokenCapabilities.utils'
import {
  ResourceAccessPills,
  TokenSummaryList,
  type ResourceAccessPillItem,
  type TokenSummaryRow,
} from '../TokenSummaryList'
import { EXPIRY_OPTIONS, type TokenFormValues } from './NewScopedTokenForm.utils'
import { PermissionScopeMap } from '@/data/scoped-access-tokens/permission-scope-map-query'

interface ReviewStepProps {
  values: TokenFormValues
  access: TokenAccessEvaluation
  permissionScopeMap: PermissionScopeMap | undefined
}

/**
 * Mirrors the token view sheet (risk banner, summary, capability cards) so reviewing a token
 * before creating it looks identical to viewing it afterwards.
 */
export const NewScopedTokenFormReview = ({
  values,
  access,
  permissionScopeMap,
}: ReviewStepProps) => {
  const { organizations, projects } = useOrgAndProjectData()
  const selection = values.permissions
  const grantedScopes = useMemo(() => selectionToScopes(selection), [selection])

  const hasExceedingCapabilities = access.exceedingEntryKeys.length > 0

  // Exceeded permissions grouped by the resource where they fail, so the admonition reads per
  // org/project rather than as one flat permission list.
  const exceedingByResource = useMemo(
    () => groupFailingResources(access, selection),
    [access, selection]
  )

  const risk = useMemo(
    () =>
      computeRiskBanner({
        effectiveSelection: access.effectiveSelection,
        resourceAccess: values.resourceAccess,
        organizationSlugs: values.organizationSlugs,
        projectRefs: values.projectRefs,
      }),
    [access.effectiveSelection, values.resourceAccess, values.organizationSlugs, values.projectRefs]
  )

  // The classic (account) flow skips review entirely, so only org- and project-bound tokens land
  // here.
  const resourceItems = useMemo<ResourceAccessPillItem[]>(() => {
    if (values.resourceAccess === 'organization') {
      return organizations
        .filter((org) => values.organizationSlugs.includes(org.slug))
        .map((org) => ({ key: org.slug, label: org.name }))
    }
    return projects
      .filter((project) => values.projectRefs.includes(project.ref))
      .map((project) => ({ key: project.ref, label: project.name }))
  }, [values, projects, organizations])

  const expiresSummary = useMemo(() => {
    if (values.expiresAt === 'custom') {
      return values.customExpiryDate
        ? dayjs(values.customExpiryDate).format('DD MMM, YYYY')
        : 'Custom — no date set'
    }
    return EXPIRY_OPTIONS.find((o) => o.value === values.expiresAt)?.label ?? values.expiresAt
  }, [values])

  const { capabilities } = useCapabilitySummary({
    selection,
    grantedScopes,
    permissionScopeMap,
  })
  const capabilityTier = getCapabilityDensityTier(capabilities.length)
  const [levelFilter, setLevelFilter] = useState<CapabilityLevelFilter>('all')

  const rows: TokenSummaryRow[] = [
    {
      key: 'name',
      label: 'Name',
      value: values.tokenName || <span className="text-foreground-lighter">Untitled token</span>,
    },
    { key: 'expires', label: 'Expires', value: expiresSummary },
    {
      key: 'resource-access',
      label: 'Resource access',
      isWrappable: true,
      value: <ResourceAccessPills resourceAccess={values.resourceAccess} items={resourceItems} />,
    },
  ]

  return (
    <div className="space-y-6 px-5 sm:px-6 py-6">
      {hasExceedingCapabilities && (
        <Admonition
          type="warning"
          title="Some permissions exceed your current role for the selected resources"
          description={
            <div className="space-y-2">
              <p>
                A token only works with permissions you currently hold. Requests with these
                permissions will be denied until your role includes them:
              </p>
              {exceedingByResource.map((group) => (
                <div key={`${group.type}:${group.resource.id}`}>
                  <p className="font-medium">{failingResourceLine(group.resource)}</p>
                  <ul className="list-disc pl-4">
                    {group.entries.map((groupEntry) => (
                      <li key={groupEntry.key}>
                        {groupEntry.name} ({PERMISSION_MODE_LABEL[groupEntry.mode]}) — requires{' '}
                        {TOKEN_ROLE_LABEL[groupEntry.requiredRole]}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          }
        />
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm">Risk assessment</h3>
        <RiskBanner risk={risk} showRoleCaveat={hasExceedingCapabilities} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm">Token summary</h3>
        <TokenSummaryList rows={rows} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm">Capabilities</h3>
          {capabilityTier === 'dense' && (
            <CapabilityLevelToggle value={levelFilter} onChange={setLevelFilter} />
          )}
        </div>
        <CapabilitiesSection
          capabilities={capabilities}
          accessEntries={access.entries}
          levelFilter={levelFilter}
        />
      </div>
    </div>
  )
}
