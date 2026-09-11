import { useId } from 'react'
import { Checkbox, cn } from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import { CONSENT_COPY } from './OAuthAppsAuthorizeScreen.utils'
import type { OAuthAppsAuthorizeOrganizationProject } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'

export const MAX_SELECTED_PROJECTS = 10

export interface ProjectMultiSelectProps {
  projects: OAuthAppsAuthorizeOrganizationProject[]
  selectedRefs: string[]
  onChange: (selectedRefs: string[]) => void
  maxSelected?: number
  error?: string
  flaggedRefs?: string[]
  unavailableRefs?: string[]
  showAllProjectsOption?: boolean
  allProjectsSelected?: boolean
  onAllProjectsChange?: (selected: boolean) => void
}

export const ProjectMultiSelect = ({
  projects,
  selectedRefs,
  onChange,
  maxSelected = MAX_SELECTED_PROJECTS,
  error,
  flaggedRefs = [],
  unavailableRefs = [],
  showAllProjectsOption = false,
  allProjectsSelected = false,
  onAllProjectsChange,
}: ProjectMultiSelectProps) => {
  const labelId = useId()
  const hasFlagged = flaggedRefs.length > 0
  const atCap = selectedRefs.length >= maxSelected
  const showCounter = selectedRefs.length >= maxSelected - 2

  const handleValuesChange = (nextRefs: string[]) => {
    if (nextRefs.length > maxSelected) return
    onChange(nextRefs)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p
          id={labelId}
          className={cn('text-xs', hasFlagged ? 'text-destructive' : 'text-foreground')}
        >
          Projects
        </p>
        {!allProjectsSelected && showCounter && (
          <p className="text-xs text-foreground-lighter">
            {selectedRefs.length}/{maxSelected}
          </p>
        )}
      </div>

      {showAllProjectsOption && (
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-foreground">
          <Checkbox
            checked={allProjectsSelected}
            onCheckedChange={(checked) => onAllProjectsChange?.(checked === true)}
          />
          {CONSENT_COPY.allProjectsOption}
        </label>
      )}

      {!allProjectsSelected && (
        <>
          <MultiSelector values={selectedRefs} onValuesChange={handleValuesChange}>
            <MultiSelectorTrigger
              aria-labelledby={labelId}
              label="Select projects..."
              badgeLimit={1}
              deletableBadge
              renderValue={(value) =>
                projects.find((project) => project.ref === value)?.name ?? value
              }
            />
            <MultiSelectorContent>
              <MultiSelectorInput placeholder="Search projects" showResetIcon />
              <MultiSelectorList emptyLabel="No projects found">
                {projects.map((project) => (
                  <MultiSelectorItem
                    key={project.ref}
                    value={project.ref}
                    disabled={atCap && !selectedRefs.includes(project.ref)}
                  >
                    {project.name}
                    {unavailableRefs.includes(project.ref) && (
                      <span className="text-foreground-lighter"> - Unavailable</span>
                    )}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          {hasFlagged && (
            <p className="text-xs text-destructive">
              {flaggedRefs.length} of {selectedRefs.length}{' '}
              {selectedRefs.length === 1 ? 'project' : 'projects'} unavailable
            </p>
          )}
          {atCap && (
            <p className="text-xs text-foreground-lighter">{CONSENT_COPY.maxProjectsReached}</p>
          )}
          {error && <p className="text-xs text-foreground-light">{error}</p>}
        </>
      )}
    </div>
  )
}
