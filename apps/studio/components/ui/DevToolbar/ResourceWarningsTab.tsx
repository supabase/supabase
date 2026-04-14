'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { cn } from 'ui'

import { usageKeys } from '@/data/usage/keys'
import type { ResourceWarning } from '@/data/usage/resource-warnings-query'

type Severity = 'warning' | 'critical' | null

const WARNING_TYPES = [
  { key: 'disk_io_exhaustion', label: 'Disk IO', hasCritical: true },
  { key: 'cpu_exhaustion', label: 'CPU', hasCritical: true },
  { key: 'memory_and_swap_exhaustion', label: 'Memory & Swap', hasCritical: true },
  { key: 'disk_space_exhaustion', label: 'Disk Space', hasCritical: true },
  { key: 'auth_rate_limit_exhaustion', label: 'Auth Rate Limit', hasCritical: false },
] as const

type WarningKey = (typeof WARNING_TYPES)[number]['key']

const INITIAL_STATE: Record<WarningKey, Severity> = {
  disk_io_exhaustion: null,
  cpu_exhaustion: null,
  memory_and_swap_exhaustion: null,
  disk_space_exhaustion: null,
  auth_rate_limit_exhaustion: null,
}

export const ResourceWarningsTab = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [severities, setSeverities] = useState<Record<WarningKey, Severity>>(INITIAL_STATE)

  const applyOverrides = (
    nextSeverities: Record<WarningKey, Severity>,
    nextIsReadOnly: boolean
  ) => {
    const mockWarning: ResourceWarning = {
      project: ref ?? '',
      is_readonly_mode_enabled: nextIsReadOnly,
      ...nextSeverities,
      auth_email_offender: null,
      auth_restricted_email_sending: null,
      need_pitr: null,
    }
    queryClient.setQueryData(usageKeys.resourceWarnings(undefined, ref), [mockWarning])
  }

  const handleSeverityChange = (key: WarningKey, value: Severity) => {
    const next = { ...severities, [key]: value }
    setSeverities(next)
    applyOverrides(next, isReadOnly)
  }

  const handleReadOnlyChange = (value: boolean) => {
    setIsReadOnly(value)
    applyOverrides(severities, value)
  }

  const handleReset = () => {
    setSeverities(INITIAL_STATE)
    setIsReadOnly(false)
    queryClient.invalidateQueries({ queryKey: usageKeys.resourceWarnings(undefined, ref) })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-light">
          Override resource warning banners for the current project.
        </p>
        <button
          onClick={handleReset}
          className="text-xs text-foreground-lighter hover:text-foreground transition underline"
        >
          Reset to real data
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-overlay">
          <span className="text-sm font-medium">Read-only mode</span>
          <div className="flex gap-1">
            <SeverityButton
              active={!isReadOnly}
              variant="off"
              onClick={() => handleReadOnlyChange(false)}
            >
              Off
            </SeverityButton>
            <SeverityButton
              active={isReadOnly}
              variant="critical"
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
                onClick={() => handleSeverityChange(key, null)}
              >
                Off
              </SeverityButton>
              <SeverityButton
                active={severities[key] === 'warning'}
                variant="warning"
                onClick={() => handleSeverityChange(key, 'warning')}
              >
                Warn
              </SeverityButton>
              {hasCritical && (
                <SeverityButton
                  active={severities[key] === 'critical'}
                  variant="critical"
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
  onClick: () => void
  children: React.ReactNode
}

const SeverityButton = ({ active, variant, onClick, children }: SeverityButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      'px-1.5 py-0.5 rounded text-xs font-mono transition border',
      active
        ? variant === 'off'
          ? 'bg-surface-300 text-foreground border-strong'
          : variant === 'warning'
            ? 'bg-warning/20 text-warning border-warning'
            : 'bg-destructive/20 text-destructive border-destructive'
        : 'bg-transparent text-foreground-muted border-transparent hover:border-border'
    )}
  >
    {children}
  </button>
)
