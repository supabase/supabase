import { useIntersectionObserver } from '@uidotdev/usehooks'
import { components } from 'api-types'
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

export const MAX_SELECTED_PROJECTS = 10

export interface ProjectMultiSelectProps {
  projects: components['schemas']['OrganizationProjectsResponse_Output']['projects']
  selectedProjectRefs: string[]
  selectedProjects: components['schemas']['OrganizationProjectsResponse_Output']['projects']
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
  selectedProjectRefs,
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
        <h2
          id={labelId}
          className={cn('text-sm font-medium', hasFlagged ? 'text-destructive' : 'text-foreground')}
        >
          Projects
        </h2>
        {!allProjectsSelected && showCounter && (
          <p className="text-xs text-foreground-lighter">
            {selectedProjectRefs.length}/{maxSelected}
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
          <label
            htmlFor={`${labelId}-all`}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <RadioGroupItem id={`${labelId}-all`} value="all" />
            All current and future projects
          </label>
          <label
            htmlFor={`${labelId}-selected`}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <RadioGroupItem id={`${labelId}-selected`} value="selected" />
            Selected projects only
          </label>
        </RadioGroup>
      )}

      {!allProjectsSelected && (
        <>
          <MultiSelector
            values={selectedProjectRefs}
            onValuesChange={handleValuesChange}
            onSearchChange={onSearchChange}
          >
            <MultiSelectorTrigger
              id="projects"
              aria-labelledby={labelId}
              aria-describedby="projects-description"
              label="Select projects..."
              badgeLimit={2}
              deletableBadge
              renderValue={(value) =>
                selectedProjects.find((project) => project.ref === value)?.name ?? value
              }
            />
            <MultiSelectorContent>
              <MultiSelectorInput placeholder="Search projects" showResetIcon />
              <MultiSelectorList emptyLabel="No projects found">
                {projects.map((project) => {
                  const isSelected = selectedProjectRefs.some((ref) => ref === project.ref)
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
        </>
      )}

      <div id="projects-description" aria-live="polite">
        {hasFlagged && (
          <p className="text-xs text-destructive">
            {`${flaggedRefs.length} of ${selectedProjectRefs.length} ${selectedProjectRefs.length === 1 ? 'project' : 'projects'} unavailable`}
          </p>
        )}
        {atCap && (
          <p className="text-xs text-foreground-lighter">
            Maximum reached. Deselect a project to choose a different one.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
