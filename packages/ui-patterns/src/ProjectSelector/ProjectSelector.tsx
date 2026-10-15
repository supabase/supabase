'use client'

import { Check } from 'lucide-react'
import * as React from 'react'
import {
  Badge,
  cn,
  ComboboxTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { SelectionListState } from '../SelectionListState'
import {
  getProjectSearchKeywords,
  groupProjectsByOrganization,
  isValidProjectRef,
  type ProjectSelectorOrganization,
  type ProjectSelectorProject,
} from './ProjectSelector.utils'

/**
 * - `loading`: the auth session is still resolving
 * - `authenticated`: the user is signed in, render the searchable project list
 * - `unauthenticated`: the user is signed out, fall back to a plain project ref input
 */
export type ProjectSelectorAuthState = 'loading' | 'authenticated' | 'unauthenticated'

type ProjectSelectorSize = React.ComponentPropsWithoutRef<typeof ComboboxTrigger>['size']

export interface ProjectSelectorProps {
  /** The selected value. By default this is the project ref. */
  value?: string
  onValueChange: (value: string, project?: ProjectSelectorProject) => void
  organizations: ProjectSelectorOrganization[]
  projects: ProjectSelectorProject[]
  /** Maps a project to the value passed to `onValueChange`. Defaults to the project ref. */
  getProjectValue?: (project: ProjectSelectorProject) => string
  authState?: ProjectSelectorAuthState
  /** Where the sign-in link in the signed-out hint points to */
  signInUrl?: string
  isLoading?: boolean
  /** When the project list fails to load, the selector falls back to a project ref input */
  isError?: boolean
  /** Let the user use a valid project ref typed in the search, even if it's not in the list */
  allowManualRef?: boolean
  /** Set to false when filtering server-side via `onSearchChange` */
  shouldFilter?: boolean
  onSearchChange?: (search: string) => void
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  size?: ProjectSelectorSize
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  onBlur?: React.FocusEventHandler<HTMLElement>
  'aria-invalid'?: React.AriaAttributes['aria-invalid']
  'aria-describedby'?: string
}

const defaultGetProjectValue = (project: ProjectSelectorProject) => project.ref

export const ProjectSelector = React.forwardRef<HTMLElement, ProjectSelectorProps>(
  (
    {
      value = '',
      onValueChange,
      organizations,
      projects,
      getProjectValue = defaultGetProjectValue,
      authState = 'authenticated',
      signInUrl,
      isLoading = false,
      isError = false,
      allowManualRef = true,
      shouldFilter = true,
      onSearchChange,
      onOpenChange,
      placeholder = 'Select a project',
      searchPlaceholder = 'Search projects or organizations...',
      emptyLabel = 'No projects found',
      size = 'small',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')

    const groups = React.useMemo(
      () => groupProjectsByOrganization(organizations, projects),
      [organizations, projects]
    )
    const selectedProject = projects.find((project) => getProjectValue(project) === value)

    const handleSearchChange = (nextSearch: string) => {
      setSearch(nextSearch)
      onSearchChange?.(nextSearch)
    }

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen && search.length > 0) handleSearchChange('')
    }

    const handleSelect = (nextValue: string, project?: ProjectSelectorProject) => {
      onValueChange(nextValue, project)
      handleOpenChange(false)
    }

    if (authState === 'unauthenticated' || isError) {
      return (
        <ProjectRefInput
          ref={ref as React.Ref<HTMLInputElement>}
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue)}
          reason={authState === 'unauthenticated' ? 'unauthenticated' : 'error'}
          signInUrl={signInUrl}
          size={size}
          disabled={disabled}
          className={className}
          {...props}
        />
      )
    }

    const trimmedSearch = search.trim()
    const showManualRefOption =
      allowManualRef &&
      isValidProjectRef(trimmedSearch) &&
      !projects.some((project) => project.ref === trimmedSearch)

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <ComboboxTrigger
            ref={ref as React.Ref<HTMLButtonElement>}
            aria-expanded={open}
            aria-haspopup="listbox"
            data-state={open ? 'open' : 'closed'}
            size={size}
            disabled={disabled || authState === 'loading'}
            className={cn(!value && 'text-foreground-lighter', className)}
            {...props}
          >
            {authState === 'loading' ? (
              'Loading projects...'
            ) : value ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-foreground">
                  {selectedProject ? (
                    selectedProject.name
                  ) : (
                    <span className="font-mono">{value}</span>
                  )}
                </span>
                {selectedProject && (
                  <span className="ml-auto shrink-0 font-mono text-foreground-lighter">
                    {selectedProject.ref}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </ComboboxTrigger>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          sameWidthAsTrigger
          className="p-0 min-w-72 overflow-hidden"
        >
          <Command shouldFilter={shouldFilter} label="Search projects">
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={handleSearchChange}
              showResetIcon={search.length > 0}
              handleReset={() => handleSearchChange('')}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <SelectionListState
                isLoading={isLoading}
                isEmpty={!isLoading && groups.length === 0 && !showManualRefOption}
                emptyLabel={emptyLabel}
                skeletonVariant="command"
                className="p-2"
              />
              {!isLoading && (
                <>
                  {groups.length > 0 && (
                    <CommandEmpty className="py-6 text-center text-xs text-foreground-muted">
                      {emptyLabel}
                    </CommandEmpty>
                  )}
                  {showManualRefOption && (
                    <CommandGroup forceMount>
                      <CommandItem
                        forceMount
                        value={`manual-ref-${trimmedSearch}`}
                        onSelect={() => handleSelect(trimmedSearch)}
                        className="cursor-pointer gap-2 text-foreground-light"
                      >
                        Use project ref
                        <span className="font-mono text-foreground">{trimmedSearch}</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {groups.map(({ organization, projects: orgProjects }) => (
                    <CommandGroup key={organization.slug} heading={organization.name}>
                      {orgProjects.map((project) => {
                        const projectValue = getProjectValue(project)
                        const isSelected = projectValue === value

                        return (
                          <CommandItem
                            key={project.ref}
                            value={`${organization.slug}/${project.ref}`}
                            keywords={getProjectSearchKeywords(project, organization)}
                            disabled={project.disabled}
                            onSelect={() => handleSelect(projectValue, project)}
                            className="cursor-pointer gap-2 text-foreground-light data-[selected=true]:text-foreground"
                          >
                            <Check
                              aria-hidden
                              size={14}
                              strokeWidth={2}
                              className={cn('shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                            />
                            <span className="truncate">{project.name}</span>
                            {project.status && (
                              <Badge className="shrink-0 normal-case">{project.status}</Badge>
                            )}
                            <span className="ml-auto shrink-0 font-mono text-foreground-lighter">
                              {project.ref}
                            </span>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

ProjectSelector.displayName = 'ProjectSelector'

interface ProjectRefInputProps extends Pick<
  ProjectSelectorProps,
  | 'signInUrl'
  | 'size'
  | 'disabled'
  | 'className'
  | 'id'
  | 'name'
  | 'onBlur'
  | 'aria-invalid'
  | 'aria-describedby'
> {
  value: string
  onValueChange: (value: string) => void
  reason: 'unauthenticated' | 'error'
}

/**
 * Fallback for when the user's projects can't be listed: a plain input for the project ref,
 * with a hint explaining why.
 */
const ProjectRefInput = React.forwardRef<HTMLInputElement, ProjectRefInputProps>(
  (
    {
      value,
      onValueChange,
      reason,
      signInUrl,
      size,
      className,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const hintId = React.useId()

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <Input
          ref={ref}
          type="text"
          size={size ?? undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="abcdefghijklmnopqrst"
          className="font-mono"
          value={value}
          onChange={(event) => onValueChange(event.target.value.trim())}
          aria-describedby={[ariaDescribedBy, hintId].filter(Boolean).join(' ')}
          {...props}
        />
        <p id={hintId} className="text-xs text-foreground-lighter">
          {reason === 'unauthenticated' ? (
            <>
              {signInUrl ? (
                <a
                  href={signInUrl}
                  className="text-foreground-light underline hover:text-foreground"
                >
                  Sign in
                </a>
              ) : (
                'Sign in'
              )}{' '}
              to choose from your projects, or enter a project ref. You can find it in your
              project&apos;s URL.
            </>
          ) : (
            "Couldn't load your projects. Enter a project ref instead. You can find it in your project's URL."
          )}
        </p>
      </div>
    )
  }
)

ProjectRefInput.displayName = 'ProjectRefInput'
