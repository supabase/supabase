import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import {
  computeOverallRisk,
  PERMISSION_MODE_LABEL,
  selectionToScopes,
} from '../../AccessToken.permissions'
import {
  groupFailingResources,
  TOKEN_ROLE_LABEL,
  type TokenAccessEvaluation,
} from '../../AccessToken.roles'
import { useCapabilitySummary } from '../../hooks/useCapabilitySummary'
import { useOrgAndProjectData } from '../../hooks/useOrgAndProjectData'
import { failingResourceLine } from '../ExceedsRoleBadge'
import { McpUnsupportedWarning } from '../McpUnsupportedWarning'
import { CapabilityCategoryList, ResourceSummaryItem, RiskLevelSummary } from '../TokenSummaryRows'
import { EXPIRY_OPTIONS, type TokenFormValues } from './NewScopedTokenForm.utils'
import { PermissionScopeMap } from '@/data/scoped-access-tokens/permission-scope-map-query'

interface ReviewStepProps {
  values: TokenFormValues
  access: TokenAccessEvaluation
  permissionScopeMap: PermissionScopeMap | undefined
  /** Switches the form back to step one in legacy (account-wide) token mode. */
  onSelectLegacyToken: () => void
}

export const NewScopedTokenFormReview = ({
  values,
  access,
  permissionScopeMap,
  onSelectLegacyToken,
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
    () => computeOverallRisk(access.effectiveSelection, values.resourceAccess),
    [access.effectiveSelection, values.resourceAccess]
  )

  const resourceSummary = useMemo(() => {
    if (values.resourceAccess === 'project') {
      const selectedProjects = projects.filter((p) => values.projectRefs.includes(p.ref))
      return {
        title: 'Projects',
        items:
          selectedProjects.length > 0
            ? selectedProjects.map((p) => ({ key: p.ref, label: p.name, sublabel: p.ref }))
            : [{ key: 'none', label: '-', sublabel: undefined }],
      }
    }
    if (values.resourceAccess === 'organization') {
      const selectedOrganizations = organizations.filter((o) =>
        values.organizationSlugs.includes(o.slug)
      )
      return {
        title: 'Organizations',
        items:
          selectedOrganizations.length > 0
            ? selectedOrganizations.map((o) => ({ key: o.slug, label: o.name, sublabel: o.slug }))
            : [{ key: 'none', label: '-', sublabel: undefined }],
      }
    }
    return {
      title: 'Account',
      items: [{ key: 'account', label: 'Account-level access', sublabel: undefined }],
    }
  }, [values, projects, organizations])

  const expiresSummary = useMemo(() => {
    if (values.expiresAt === 'custom') {
      return values.customExpiryDate
        ? dayjs(values.customExpiryDate).format('DD MMM, YYYY')
        : 'Custom — no date set'
    }
    return EXPIRY_OPTIONS.find((o) => o.value === values.expiresAt)?.label ?? values.expiresAt
  }, [values])

  const hasCapabilities = grantedScopes.length > 0

  const { activeByCategory, mcpTools, capabilityGroups } = useCapabilitySummary({
    selection,
    grantedScopes,
    permissionScopeMap,
  })

  const rows: [string, React.ReactNode][] = [
    ['Name', values.tokenName || <span className="text-foreground-lighter">Untitled token</span>],
    ['Expires', expiresSummary],
    [
      'Resource access',
      <div key="resource-access" className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
          {resourceSummary.title}
        </p>
        <div className="divide-y">
          {resourceSummary.items.map((item) => (
            <ResourceSummaryItem key={item.key} label={item.label} sublabel={item.sublabel} />
          ))}
        </div>
      </div>,
    ],
    [
      'Capabilities',
      hasCapabilities ? (
        <CapabilityCategoryList categories={activeByCategory} accessEntries={access.entries} />
      ) : (
        <span className="text-foreground-lighter">No capabilities selected</span>
      ),
    ],
    [
      'Risk level',
      <RiskLevelSummary key="risk" risk={risk} showRoleCaveat={hasExceedingCapabilities} />,
    ],
  ]

  return (
    <div className="space-y-6 px-5 sm:px-6 py-6">
      {!hasCapabilities && (
        <Admonition
          type="warning"
          title="This token has no capabilities"
          description="Go back and grant at least one permission before creating it."
        />
      )}
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
        <h3 className="text-sm">Token summary</h3>
        <dl className="divide-y rounded-md border bg-surface-300">
          {rows.map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-sm text-foreground-lighter">{key}</dt>
              <dd className="col-span-2 text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {hasCapabilities && (
        <>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm">Management API endpoints enabled</h3>
            {capabilityGroups.length === 0 ? (
              <p className="text-xs text-foreground-light">
                No Management API endpoints are enabled by the selected capabilities.
              </p>
            ) : (
              capabilityGroups.map(({ entry, mode, endpoints }) => (
                <div key={entry.key} className="rounded-md border">
                  <div className="flex items-center justify-between border-b bg-surface-100 px-3 py-2">
                    <span className="text-xs text-foreground">{entry.name}</span>
                    <span className="text-[11px] font-mono uppercase text-foreground-lighter">
                      {PERMISSION_MODE_LABEL[mode]}
                    </span>
                  </div>
                  <div className="divide-y">
                    {endpoints.map(([method, path]) => (
                      <div
                        key={`${method} ${path}`}
                        className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs"
                      >
                        <span className="w-14 shrink-0 text-foreground-light">{method}</span>
                        <span className="text-foreground">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm">MCP tools</h3>
            <McpUnsupportedWarning onSelectLegacyToken={onSelectLegacyToken} />
            {mcpTools.length === 0 ? (
              <p className="text-xs text-foreground-light">
                No MCP tools are enabled by the selected capabilities.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mcpTools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded border bg-surface-100 px-2 py-1 font-mono text-xs text-foreground-light"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
