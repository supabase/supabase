import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useEffect, useId } from 'react'
import { cn, RadioGroup, RadioGroupItem } from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import type {
  OAuthAppsAuthorizeOrganizationProject,
  OAuthAppsAuthorizeRequest,
} from '@/data/oauth-apps/types'

export const MAX_SELECTED_PROJECTS = 10

export interface ProjectMultiSelectProps {
  projects: OAuthAppsAuthorizeOrganizationProject[]
  selectedProjects: OAuthAppsAuthorizeOrganizationProject[]
  onChange: (selectedProjects: string[]) => void
  maxSelected?: number
  error?: string
  flaggedRefs?: string[]
  unavailableRefs?: string[]
  readinessIssues?: NonNullable<OAuthAppsAuthorizeRequest['databaseAccess']>['projectIssues']
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
  readinessIssues = {},
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

  const renderProjectName = (ref: string, name: string) => (
    <>
      {readinessIssues[ref] && (
        <>
          <span
            className={cn(
              'mr-1.5 inline-block size-1.5 rounded-full group-data-[state=open]:hidden',
              readinessIssues[ref] !== 'ssl_enforcement_required'
                ? 'bg-warning'
                : 'bg-foreground-muted'
            )}
            aria-hidden
          />
          <span className="sr-only">Database setup notice: </span>
        </>
      )}
      {name}
    </>
  )

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

      {onAllProjectsChange && (
        <RadioGroup
          aria-labelledby={labelId}
          value={allProjectsSelected ? 'all' : 'selected'}
          onValueChange={(value) => onAllProjectsChange(value === 'all')}
          className="gap-2 py-1"
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value="selected" />
            Selected projects only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value="all" />
            All current and future projects
          </label>
        </RadioGroup>
      )}

      {!allProjectsSelected && (
        <>
          <MultiSelector
            values={selectedProjects.map((p) => p.ref)}
            onValuesChange={handleValuesChange}
            onSearchChange={onSearchChange}
          >
            <MultiSelectorTrigger
              aria-labelledby={labelId}
              className="group"
              label="Select projects..."
              badgeLimit={2}
              deletableBadge
              renderValue={(value) =>
                renderProjectName(
                  value,
                  selectedProjects.find((project) => project.ref === value)?.name ?? value
                )
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
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span>
                          {project.name}
                          {unavailableRefs.includes(project.ref) && (
                            <span className="text-foreground-lighter"> - Unavailable</span>
                          )}
                        </span>
                        {readinessIssues[project.ref] &&
                          readinessIssues[project.ref] !== 'ssl_enforcement_required' && (
                            <>
                              <span
                                className="size-1.5 shrink-0 rounded-full bg-warning"
                                aria-hidden
                              />
                              <span className="sr-only">Blocks authorization</span>
                            </>
                          )}
                        {readinessIssues[project.ref] === 'ssl_enforcement_required' && (
                          <>
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-foreground-muted"
                              aria-hidden
                            />
                            <span className="sr-only">SSL enforcement will be enabled</span>
                          </>
                        )}
                      </span>
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
