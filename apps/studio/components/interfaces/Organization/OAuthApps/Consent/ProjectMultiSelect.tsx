import { useId } from 'react'
import { cn } from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import type { OAuthAppsAuthorizeOrganizationProject } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'

export const MAX_SELECTED_PROJECTS = 10
const SHOW_COUNTER_FROM = 8

export interface ProjectMultiSelectProps {
  projects: OAuthAppsAuthorizeOrganizationProject[]
  selectedRefs: string[]
  onChange: (selectedRefs: string[]) => void
  error?: string
  /**
   * Selected refs a post-submit role validation rejected — a subset of {@link selectedRefs}, so
   * it empties as they are deselected. Drives the count beneath the picker.
   */
  flaggedRefs?: string[]
  /**
   * Every ref the last validation rejected, whether or not it is still selected. Outlives
   * {@link flaggedRefs} on purpose: the dropdown has to keep marking these, or deselecting them
   * would leave nothing to stop the user picking the same projects straight back.
   */
  unavailableRefs?: string[]
}

export const ProjectMultiSelect = ({
  projects,
  selectedRefs,
  onChange,
  error,
  flaggedRefs = [],
  unavailableRefs = [],
}: ProjectMultiSelectProps) => {
  const labelId = useId()
  const hasFlagged = flaggedRefs.length > 0
  const atCap = selectedRefs.length >= MAX_SELECTED_PROJECTS
  const showCounter = selectedRefs.length >= SHOW_COUNTER_FROM

  const handleValuesChange = (nextRefs: string[]) => {
    if (nextRefs.length > MAX_SELECTED_PROJECTS) return
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
        {showCounter && (
          <p className="text-xs text-foreground-lighter">
            {selectedRefs.length}/{MAX_SELECTED_PROJECTS}
          </p>
        )}
      </div>

      <MultiSelector values={selectedRefs} onValuesChange={handleValuesChange}>
        <MultiSelectorTrigger
          aria-labelledby={labelId}
          label="Select projects..."
          badgeLimit={1}
          deletableBadge
          renderValue={(value) => projects.find((project) => project.ref === value)?.name ?? value}
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
        <p className="text-xs text-foreground-lighter">
          Maximum reached. Deselect a project to choose a different one.
        </p>
      )}
      {error && <p className="text-xs text-foreground-light">{error}</p>}
    </div>
  )
}
