'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'

import { usageKeys } from '@/data/usage/keys'
import type { ResourceWarning } from '@/data/usage/resource-warnings-query'

type Severity = 'warning' | 'critical' | null

const WARNING_TYPES = [
  { key: 'disk_io_exhaustion', label: 'Disk IO' },
  { key: 'cpu_exhaustion', label: 'CPU' },
  { key: 'memory_and_swap_exhaustion', label: 'Memory & Swap' },
  { key: 'disk_space_exhaustion', label: 'Disk Space' },
  { key: 'auth_rate_limit_exhaustion', label: 'Auth Rate Limit' },
] as const

type WarningKey = (typeof WARNING_TYPES)[number]['key']

const INITIAL_STATE: Record<WarningKey, Severity> = {
  disk_io_exhaustion: null,
  cpu_exhaustion: null,
  memory_and_swap_exhaustion: null,
  disk_space_exhaustion: null,
  auth_rate_limit_exhaustion: null,
}

export const SupabaseDevToolbar = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [severities, setSeverities] = useState<Record<WarningKey, Severity>>(INITIAL_STATE)

  const hasActiveOverrides = isReadOnly || Object.values(severities).some((v) => v !== null)

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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-0">
      {open && (
        <div className="mb-0 w-72 rounded-t-lg border border-b-0 border-overlay bg-surface-100 shadow-xl text-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-overlay">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <AlertTriangle size={13} className="text-warning" />
              Resource Warnings
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="text-foreground-lighter hover:text-foreground transition p-1 rounded"
                title="Reset to real data"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground-lighter hover:text-foreground transition p-1 rounded"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground-light">Read-only mode</span>
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

            <div className="border-t border-overlay pt-2 space-y-2">
              {WARNING_TYPES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-foreground-light">{label}</span>
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
                    <SeverityButton
                      active={severities[key] === 'critical'}
                      variant="critical"
                      onClick={() => handleSeverityChange(key, 'critical')}
                    >
                      Crit
                    </SeverityButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button
        type="default"
        onClick={() => setOpen((v) => !v)}
        icon={<AlertTriangle size={13} />}
        className={cn(
          'rounded-b-none shadow-md font-mono text-xs h-7 px-2',
          hasActiveOverrides && 'border-warning text-warning'
        )}
      >
        warnings{hasActiveOverrides ? ' •' : ''}
      </Button>
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
