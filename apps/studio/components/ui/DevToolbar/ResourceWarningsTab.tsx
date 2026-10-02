'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { cn, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import type { OverdueInvoicesResponse } from '@/data/invoices/invoices-overdue-query'
import { invoicesKeys } from '@/data/invoices/keys'
import { organizationKeys } from '@/data/organizations/keys'
import { usageKeys } from '@/data/usage/keys'
import type { ResourceWarning } from '@/data/usage/resource-warnings-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import type { Organization } from '@/types'

type Severity = 'warning' | 'critical' | null

const WARNING_TYPES = [
  { key: 'disk_io_exhaustion', label: 'Disk IO', hasCritical: true },
  { key: 'cpu_exhaustion', label: 'CPU', hasCritical: true },
  { key: 'memory_and_swap_exhaustion', label: 'Memory & Swap', hasCritical: true },
  { key: 'disk_space_exhaustion', label: 'Disk Space', hasCritical: true },
  { key: 'auth_rate_limit_exhaustion', label: 'Auth Rate Limit', hasCritical: false },
] as const

type WarningKey = (typeof WARNING_TYPES)[number]['key']
type WarningState = Record<WarningKey, Severity>

const INITIAL_STATE: WarningState = {
  disk_io_exhaustion: null,
  cpu_exhaustion: null,
  memory_and_swap_exhaustion: null,
  disk_space_exhaustion: null,
  auth_rate_limit_exhaustion: null,
}

export const ResourceWarningsTab = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { data: selectedOrg, isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const orgSlug = selectedOrg?.slug

  const [isReadOnly, setIsReadOnly] = useState(false)
  const [orgWarning, setOrgWarning] = useState<string>('none')
  const [severities, setSeverities] = useState<WarningState>(INITIAL_STATE)

  // Track latest ref/orgSlug so the unmount cleanup always invalidates the
  // correct cache keys, even when orgSlug was still loading at mount time.
  const latestValues = useRef({ ref, orgSlug })
  useEffect(() => {
    latestValues.current = { ref, orgSlug }
  })

  // Only invalidate on unmount if overrides were actually applied to avoid
  // unnecessary refetches when the user opens the toolbar but never uses
  // the Warnings tab.
  const hasOverridesRef = useRef(false)

  // Invalidate both cache keys on unmount so banners revert to real data
  // when the toolbar sheet closes (which unmounts this component).
  useEffect(() => {
    return () => {
      if (!hasOverridesRef.current) return
      const { ref: latestRef, orgSlug: latestOrgSlug } = latestValues.current
      queryClient.invalidateQueries({ queryKey: usageKeys.resourceWarnings(undefined, latestRef) })
      if (latestOrgSlug) {
        queryClient.invalidateQueries({
          queryKey: usageKeys.resourceWarnings(latestOrgSlug, undefined),
        })
      }
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() })
      queryClient.invalidateQueries({ queryKey: invoicesKeys.overdueInvoices() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When navigating to a different project: reset UI state and invalidate the
  // departing project's cache keys (the cleanup closure captures the old ref).
  // This component never unmounts during client-side navigation, so without
  // this project A's mocked banners would linger on project B.
  useEffect(() => {
    return () => {
      if (!hasOverridesRef.current) return
      queryClient.invalidateQueries({ queryKey: usageKeys.resourceWarnings(undefined, ref) })
      const { orgSlug: currentOrgSlug } = latestValues.current
      if (currentOrgSlug) {
        queryClient.invalidateQueries({
          queryKey: usageKeys.resourceWarnings(currentOrgSlug, undefined),
        })
        queryClient.invalidateQueries({ queryKey: organizationKeys.list() })
        queryClient.invalidateQueries({ queryKey: invoicesKeys.overdueInvoices() })
      }
      setSeverities(INITIAL_STATE)
      setIsReadOnly(false)
      setOrgWarning('none')
      hasOverridesRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  const applyOverrides = ({
    nextSeverities,
    nextIsReadOnly,
    nextOrgWarnings,
  }: {
    nextSeverities: WarningState
    nextIsReadOnly: boolean
    nextOrgWarnings?: string
  }) => {
    if (!orgSlug || !ref) return
    const mockWarning: ResourceWarning = {
      project: ref,
      is_readonly_mode_enabled: nextIsReadOnly,
      ...nextSeverities,
      auth_email_offender: null,
      auth_restricted_email_sending: null,
      need_pitr: null,
    }
    // Write to both cache keys: ref-based (ResourceExhaustionWarningBanner) and
    // slug-based (ProjectLayout, TopSection, ProjectList) consumers.
    queryClient.setQueryData(usageKeys.resourceWarnings(undefined, ref), [mockWarning])
    queryClient.setQueryData(usageKeys.resourceWarnings(orgSlug, undefined), [mockWarning])

    const effectiveOrgWarning = nextOrgWarnings ?? orgWarning
    const restrictionStatus: Organization['restriction_status'] =
      effectiveOrgWarning === 'grace_period' ||
      effectiveOrgWarning === 'grace_period_over' ||
      effectiveOrgWarning === 'restricted'
        ? effectiveOrgWarning
        : null

    queryClient.setQueryData<Organization[]>(organizationKeys.list(), (prev) =>
      prev?.map((org) =>
        org.slug === orgSlug
          ? {
              ...org,
              restriction_status: restrictionStatus,
              restriction_data:
                restrictionStatus === 'grace_period'
                  ? { grace_period_end: dayjs().add(7, 'day').toISOString() }
                  : null,
            }
          : org
      )
    )

    // Overdue invoices come from a separate, org-independent cache and are
    // distinguished by organization_id rather than a status enum, so they can't
    // be folded into the restriction_status patch above.
    const selectedOrgId = selectedOrg?.id
    const overdueInvoices: OverdueInvoicesResponse[] =
      selectedOrgId === undefined
        ? []
        : effectiveOrgWarning === 'overdue_invoices'
          ? [{ organization_id: selectedOrgId, overdue_invoice_count: 1 }]
          : effectiveOrgWarning === 'overdue_invoices_from_other_org'
            ? [{ organization_id: selectedOrgId + 1, overdue_invoice_count: 1 }]
            : []
    queryClient.setQueryData(invoicesKeys.overdueInvoices(), overdueInvoices)

    hasOverridesRef.current = true
  }

  const handleSeverityChange = (key: WarningKey, value: Severity) => {
    const next = { ...severities, [key]: value }
    setSeverities(next)
    applyOverrides({ nextSeverities: next, nextIsReadOnly: isReadOnly })
  }

  const handleReadOnlyChange = (value: boolean) => {
    setIsReadOnly(value)
    applyOverrides({ nextSeverities: severities, nextIsReadOnly: value })
  }

  const handleOrgWarningChange = (value: string) => {
    setOrgWarning(value)
    applyOverrides({
      nextSeverities: severities,
      nextIsReadOnly: isReadOnly,
      nextOrgWarnings: value,
    })
  }

  const handleReset = () => {
    setSeverities(INITIAL_STATE)
    setIsReadOnly(false)
    setOrgWarning('none')

    hasOverridesRef.current = false
    queryClient.invalidateQueries({ queryKey: usageKeys.resourceWarnings(undefined, ref) })
    if (orgSlug) {
      queryClient.invalidateQueries({ queryKey: usageKeys.resourceWarnings(orgSlug, undefined) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() })
      queryClient.invalidateQueries({ queryKey: invoicesKeys.overdueInvoices() })
    }
  }

  // Disabled when org is loading, org slug is unavailable, or we're not on a
  // project page (ref is undefined on org-level pages like /org/[slug]/settings).
  const isDisabled = isOrgLoading || !orgSlug || !ref

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-light">
          Override resource warning banners for the current organization or project.
        </p>
        <button
          onClick={handleReset}
          disabled={isDisabled}
          tabIndex={isDisabled ? -1 : 0}
          className="text-xs text-foreground-lighter hover:text-foreground transition underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to real data
        </button>
      </div>

      <div className="flex flex-col gap-y-1">
        <h4>Organization warnings</h4>
      </div>

      <div className={cn('space-y-3', isDisabled && 'opacity-50 pointer-events-none')}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-light">Restriction status</span>
          <Select value={orgWarning} onValueChange={handleOrgWarningChange}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="grace_period">Grace period</SelectItem>
              <SelectItem value="grace_period_over">Grace period over</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="overdue_invoices">Overdue invoices</SelectItem>
              <SelectItem value="overdue_invoices_from_other_org">
                Overdue invoices from other org
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-y-1">
        <h4>Project warnings</h4>
        {isDisabled && (
          <p className="text-xs text-foreground-muted">
            {!ref ? 'Navigate to a project page to use this tab.' : 'Loading org context...'}
          </p>
        )}
      </div>

      <div className={cn('space-y-3', isDisabled && 'opacity-50 pointer-events-none')}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-light flex items-center gap-x-2">
            <span>Read-only mode</span>
            <InfoTooltip side="right">Takes precedence above all other warnings</InfoTooltip>
          </p>
          <div className="flex gap-1">
            <SeverityButton
              active={!isReadOnly}
              variant="off"
              disabled={isDisabled}
              onClick={() => handleReadOnlyChange(false)}
            >
              Off
            </SeverityButton>
            <SeverityButton
              active={isReadOnly}
              variant="critical"
              disabled={isDisabled}
              onClick={() => handleReadOnlyChange(true)}
            >
              On
            </SeverityButton>
          </div>
        </div>

        {WARNING_TYPES.map(({ key, label, hasCritical }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-foreground-light">{label}</span>
            <div className="flex gap-1">
              <SeverityButton
                active={severities[key] === null}
                variant="off"
                disabled={isDisabled}
                onClick={() => handleSeverityChange(key, null)}
              >
                Off
              </SeverityButton>
              <SeverityButton
                active={severities[key] === 'warning'}
                variant="warning"
                disabled={isDisabled}
                onClick={() => handleSeverityChange(key, 'warning')}
              >
                Warn
              </SeverityButton>
              {hasCritical && (
                <SeverityButton
                  active={severities[key] === 'critical'}
                  variant="critical"
                  disabled={isDisabled}
                  onClick={() => handleSeverityChange(key, 'critical')}
                >
                  Crit
                </SeverityButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SeverityButtonProps {
  active: boolean
  variant: 'off' | 'warning' | 'critical'
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

const SeverityButton = ({ active, variant, disabled, onClick, children }: SeverityButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    tabIndex={disabled ? -1 : 0}
    className={cn(
      'px-1.5 py-0.5 rounded-sm text-xs font-mono transition border',
      active
        ? variant === 'off'
          ? 'bg-surface-300 text-foreground border-strong'
          : variant === 'warning'
            ? 'bg-warning/20 text-warning border-warning'
            : 'bg-destructive/20 text-destructive border-destructive'
        : 'bg-transparent text-foreground-muted border-transparent hover:border-border',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </button>
)
