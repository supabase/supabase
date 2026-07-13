'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { cn, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import { projectKeys } from '@/data/projects/keys'
import { useSetProjectStatus, type Project } from '@/data/projects/project-detail-query'
import {
  clearPauseStatusOverride,
  getPauseStatusOverride,
  setPauseStatusOverride,
  type PauseStateOverride,
} from '@/data/projects/project-pause-status-override'
import {
  clearProjectStatusOverride,
  getProjectStatusOverride,
  setProjectStatusOverride,
} from '@/data/projects/project-status-override'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

type ProjectStatus = Project['status']

const STATUS_LABELS: Record<ProjectStatus, string> = {
  INACTIVE: 'Paused',
  ACTIVE_HEALTHY: 'Active (healthy)',
  ACTIVE_UNHEALTHY: 'Active (unhealthy)',
  COMING_UP: 'Coming up',
  UNKNOWN: 'Unknown',
  GOING_DOWN: 'Going down',
  INIT_FAILED: 'Init failed',
  REMOVED: 'Removed',
  RESTARTING: 'Restarting',
  RESTORING: 'Restoring',
  RESTORE_FAILED: 'Restore failed',
  UPGRADING: 'Upgrading',
  PAUSING: 'Pausing',
  PAUSE_FAILED: 'Pause failed',
  RESIZING: 'Resizing',
}

const STATUS_OPTIONS = Object.values(PROJECT_STATUS)

const PAUSE_STATE_VALUE_REAL = 'real'

const PAUSE_STATE_OPTIONS: {
  value: PauseStateOverride | typeof PAUSE_STATE_VALUE_REAL
  label: string
}[] = [
  { value: PAUSE_STATE_VALUE_REAL, label: 'Real data' },
  { value: 'restorable', label: 'Restorable (can resume)' },
  { value: 'restore-disabled', label: 'Restore disabled (90+ days)' },
]

export const ProjectStatusTab = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { setProjectStatus } = useSetProjectStatus()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const orgSlug = selectedOrg?.slug

  const [statusOverride, setStatusOverride] = useState<ProjectStatus | undefined>(undefined)
  const [pauseOverride, setPauseOverride] = useState<PauseStateOverride | undefined>(undefined)
  useEffect(() => {
    setStatusOverride(getProjectStatusOverride(ref))
    setPauseOverride(getPauseStatusOverride(ref))
  }, [ref])

  const currentStatus = statusOverride ?? project?.status
  const isPaused = currentStatus === PROJECT_STATUS.INACTIVE
  const hasOverride = statusOverride !== undefined || pauseOverride !== undefined

  const refetchProjectStatus = () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(ref) })
    queryClient.invalidateQueries({ queryKey: projectKeys.infiniteList() })
    if (orgSlug) {
      queryClient.invalidateQueries({ queryKey: projectKeys.infiniteListByOrg(orgSlug) })
    }
  }

  const handleStatusChange = (status: ProjectStatus) => {
    if (!ref) return
    setProjectStatusOverride(ref, status)
    setStatusOverride(status)
    setProjectStatus({ ref, slug: orgSlug, status })
  }

  const handlePauseStateChange = (value: PauseStateOverride | typeof PAUSE_STATE_VALUE_REAL) => {
    if (!ref) return
    if (value === PAUSE_STATE_VALUE_REAL) {
      clearPauseStatusOverride(ref)
      setPauseOverride(undefined)
    } else {
      setPauseStatusOverride(ref, value)
      setPauseOverride(value)
    }
    queryClient.invalidateQueries({ queryKey: projectKeys.pauseStatus(ref) })
  }

  const handleReset = () => {
    if (ref) {
      clearProjectStatusOverride(ref)
      clearPauseStatusOverride(ref)
    }
    setStatusOverride(undefined)
    setPauseOverride(undefined)
    refetchProjectStatus()
    queryClient.invalidateQueries({ queryKey: projectKeys.pauseStatus(ref) })
  }

  const isDisabled = !ref

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-light">
          Override the status of the current project. Overrides persist across refetches until
          reset.
        </p>
        <button
          onClick={handleReset}
          disabled={isDisabled || !hasOverride}
          className="text-xs text-foreground-lighter hover:text-foreground transition underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to real data
        </button>
      </div>

      {isDisabled && (
        <p className="text-xs text-foreground-muted">Navigate to a project page to use this tab.</p>
      )}

      <div className={cn('space-y-3', isDisabled && 'opacity-50 pointer-events-none')}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-light">Status</span>
          <Select
            value={currentStatus}
            onValueChange={(value) => handleStatusChange(value as ProjectStatus)}
          >
            <SelectTrigger className="w-64 text-xs">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status} className="text-xs">
                  {STATUS_LABELS[status]}
                  <span className="ml-1.5 font-mono text-foreground-lighter">{status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn('flex items-center justify-between', !isPaused && 'opacity-50')}>
          <div className="flex flex-col">
            <span className="text-sm text-foreground-light">Pause state</span>
            <span className="text-xs text-foreground-muted">Applies when status is Paused</span>
          </div>
          <Select
            value={pauseOverride ?? PAUSE_STATE_VALUE_REAL}
            onValueChange={(value) =>
              handlePauseStateChange(value as PauseStateOverride | typeof PAUSE_STATE_VALUE_REAL)
            }
          >
            <SelectTrigger className="w-64 text-xs">
              <SelectValue placeholder="Select a pause state" />
            </SelectTrigger>
            <SelectContent>
              {PAUSE_STATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
