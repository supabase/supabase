import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useEffect, useId } from 'react'
import { Checkbox, cn } from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import type { OAuthAppsAuthorizeOrganizationProject } from '@/data/oauth-apps/types'

export const MAX_SELECTED_PROJECTS = 10

export interface ProjectMultiSelectProps {
  projects: OAuthAppsAuthorizeOrganizationProject[]
  selectedProjects: OAuthAppsAuthorizeOrganizationProject[]
  onChange: (selectedProjects: string[]) => void
  maxSelected?: number
  error?: string
  flaggedRefs?: string[]
  unavailableRefs?: string[]
  allProjectsSelected?: boolean
  onAllProjectsChange?: (selected: boolean) => void
  onSearchChange: (query: string) => void
  onLoadMore: () => void
}

export const ProjectMultiSelect = ({
  projects,
  selectedProjects,
  onChange,
  maxSelected = MAX_SELECTED_PROJECTS,
  error,
  flaggedRefs = [],
  unavailableRefs = [],
  allProjectsSelected = false,
  onAllProjectsChange,
  onSearchChange,
  onLoadMore,
}: ProjectMultiSelectProps) => {
  const labelId = useId()
  const hasFlagged = flaggedRefs.length > 0
  const atCap = selectedProjects.length >= maxSelected
  const showCounter = selectedProjects.length >= maxSelected - 2
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (entry?.isIntersecting) {
      onLoadMore?.()
    }
  }, [entry, onLoadMore])

  const handleValuesChange = (nextRefs: string[]) => {
    if (nextRefs.length > maxSelected) return
    onChange(nextRefs)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p
          id={labelId}
          className={cn('text-sm', hasFlagged ? 'text-destructive' : 'text-foreground')}
        >
          Projects
        </p>
        {!allProjectsSelected && showCounter && (
          <p className="text-xs text-foreground-lighter">
            {selectedProjects.length}/{maxSelected}
          </p>
        )}
      </div>

      <label
        htmlFor="select-all-projects"
        className="flex cursor-pointer items-center gap-2 py-1 text-sm text-foreground"
      >
        <Checkbox
          id="select-all-projects"
          checked={allProjectsSelected}
          onCheckedChange={(checked) => onAllProjectsChange?.(checked === true)}
        />
        All current and future projects
      </label>

      {!allProjectsSelected && (
        <>
          <MultiSelector
            values={selectedProjects.map((p) => p.ref)}
            onValuesChange={handleValuesChange}
            onSearchChange={onSearchChange}
          >
            <MultiSelectorTrigger
              aria-labelledby={labelId}
              label="Select projects..."
              badgeLimit={2}
              deletableBadge
              renderValue={(value) =>
                projects.find((project) => project.ref === value)?.name ?? value
              }
            />
            <MultiSelectorContent>
              <MultiSelectorInput placeholder="Search projects" showResetIcon />
              <MultiSelectorList emptyLabel="No projects found">
                {projects.map((project) => {
                  const isSelected = selectedProjects.some((p) => p.ref === project.ref)
                  return (
                    <MultiSelectorItem
                      key={project.ref}
                      value={project.ref}
                      disabled={atCap && !isSelected}
                    >
                      {project.name}
                      {unavailableRefs.includes(project.ref) && (
                        <span className="text-foreground-lighter"> - Unavailable</span>
                      )}
                    </MultiSelectorItem>
                  )
                })}
                <span ref={sentinelRef} />
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          {hasFlagged && (
            <p className="text-xs text-destructive">
              {`${flaggedRefs.length} of ${selectedProjects.length} ${selectedProjects.length === 1 ? 'project' : 'projects'} unavailable`}
            </p>
          )}
          {atCap && (
            <p className="text-xs text-foreground-lighter">
              Maximum reached. Deselect a project to choose a different one.
            </p>
          )}
          {error && <p className="text-xs text-foreground-light">{error}</p>}
        </>
      )}
    </div>
  )
}
