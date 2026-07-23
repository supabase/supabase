import { useParams } from 'common'
import { Check, ChevronDown, Plus, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { HTMLAttributes } from 'react'
import {
  Badge,
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { Project, type ForeignProject, type ProjectLinkerProps } from './VercelGithub.types'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { BASE_PATH } from '@/lib/constants'
import { openInstallGitHubIntegrationWindow } from '@/lib/github'

export const Panel = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex-1 min-w-0 flex flex-col grow gap-6 px-5 mx-auto w-full justify-center items-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const ForeignProjectSelector = ({
  open,
  mode,
  variant,
  choosePrompt,
  selectedForeignProject,
  loadingForeignProjects,
  foreignProjects,
  integrationIcon,
  onOpenChange,
  setForeignProjectId,
  getForeignProjectIcon,
}: {
  open: boolean
  selectedForeignProject?: ForeignProject
  setForeignProjectId: (id: string) => void
  onOpenChange: (val: boolean) => void
} & Pick<
  ProjectLinkerProps,
  | 'mode'
  | 'variant'
  | 'choosePrompt'
  | 'loadingForeignProjects'
  | 'foreignProjects'
  | 'getForeignProjectIcon'
  | 'integrationIcon'
>) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          block
          disabled={loadingForeignProjects}
          loading={loadingForeignProjects}
          className={cn(
            variant === 'interstitial' ? 'h-[34px] justify-between' : 'justify-start h-[34px]'
          )}
          icon={
            variant === 'default' ? (
              <div>
                {selectedForeignProject
                  ? (getForeignProjectIcon?.(selectedForeignProject) ?? integrationIcon)
                  : integrationIcon}
              </div>
            ) : undefined
          }
          iconRight={
            <span className="grow flex justify-end">
              <ChevronDown />
            </span>
          }
        >
          <span className="truncate">
            {(selectedForeignProject && selectedForeignProject.name) ?? choosePrompt}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="bottom" align="center" sameWidthAsTrigger>
        <Command>
          <CommandInput placeholder="Search for a project" />
          <CommandList className="max-h-[170px]!">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {foreignProjects.map((project, i) => {
                return (
                  <CommandItem
                    key={project.id}
                    value={`${project.name.replaceAll('"', '')}-${i}`}
                    className="flex gap-2 items-center"
                    onSelect={() => {
                      if (project.id) setForeignProjectId(project.id)
                      onOpenChange(false)
                    }}
                  >
                    <div>{getForeignProjectIcon?.(project) ?? integrationIcon}</div>
                    <span className="truncate" title={project.name}>
                      {project.name}
                    </span>
                  </CommandItem>
                )
              })}
              {foreignProjects.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
            </CommandGroup>
            {mode === 'GitHub' && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="flex gap-2 items-center cursor-pointer"
                    onSelect={() => openInstallGitHubIntegrationWindow('install')}
                  >
                    <PlusIcon size={16} />
                    Add GitHub Repositories
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const SupabaseProjectSelector = ({
  open,
  variant,
  slug,
  defaultSupabaseProject,
  selectedSupabaseProject,
  loadingSupabaseProjects,
  setOpen,
  setSelectedSupabaseProject,
}: {
  open: boolean
  selectedSupabaseProject?: Project
  loadingSupabaseProjects: boolean
  setOpen: (val: boolean) => void
  setSelectedSupabaseProject: (project: Project) => void
} & Pick<ProjectLinkerProps, 'slug' | 'variant' | 'defaultSupabaseProject'>) => {
  const router = useRouter()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  return (
    <OrganizationProjectSelector
      sameWidthAsTrigger
      open={open}
      setOpen={setOpen}
      slug={slug}
      selectedRef={selectedSupabaseProject?.ref}
      onSelect={(project) => {
        setSelectedSupabaseProject(project)
        setOpen(false)
      }}
      renderRow={(project) => {
        return (
          <div className={cn('w-full flex items-center justify-between')}>
            <div className="flex items-center gap-x-2">
              {variant === 'default' && (
                <div className="bg-white shadow-sm border rounded-sm p-1 w-6 h-6 flex justify-center items-center">
                  <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-4" />
                </div>
              )}
              <p>{project.name}</p>
              {project.status === 'INACTIVE' && <Badge>Paused</Badge>}
              {project.status === 'GOING_DOWN' && <Badge>Pausing</Badge>}
            </div>
            {project.ref === selectedSupabaseProject?.ref && <Check size={16} />}
          </div>
        )
      }}
      renderTrigger={() => {
        return (
          <Button
            variant="default"
            block
            disabled={defaultSupabaseProject !== undefined || loadingSupabaseProjects}
            loading={loadingSupabaseProjects}
            className="justify-between h-[34px]"
            iconRight={
              defaultSupabaseProject === undefined ? (
                <span className="grow flex justify-end">
                  <ChevronDown />
                </span>
              ) : null
            }
          >
            <div className="flex items-center gap-x-2">
              {variant === 'default' && (
                <div className="bg-white shadow-sm border rounded-sm p-1 w-6 h-6 flex justify-center items-center">
                  <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-4" />
                </div>
              )}
              <span className="truncate">
                {selectedSupabaseProject ? selectedSupabaseProject.name : 'Choose Supabase project'}
              </span>
            </div>
          </Button>
        )
      }}
      renderActions={() => {
        return (
          projectCreationEnabled && (
            <CommandGroup>
              <CommandItem
                className="cursor-pointer w-full"
                onSelect={() => {
                  setOpen(false)
                  router.push(`/new/${selectedOrganization?.slug}`)
                }}
                onClick={() => setOpen(false)}
              >
                <Link
                  href={`/new/${selectedOrganization?.slug}`}
                  className="w-full flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  <Plus size={14} strokeWidth={1.5} />
                  <p>Create a new project</p>
                </Link>
              </CommandItem>
            </CommandGroup>
          )
        )
      }}
    />
  )
}

export const ActionButtons = ({
  slug,
  mode,
  variant,
  showCreateProject,
  connectDisabled,
  isLoading,
  foreignProjectId,
  onCreateConnections,
  onSkip,
}: {
  showCreateProject: boolean
  connectDisabled: boolean
  foreignProjectId: string | undefined
  onCreateConnections: () => void
} & Pick<ProjectLinkerProps, 'slug' | 'variant' | 'mode' | 'onSkip' | 'isLoading'>) => {
  const { next, externalId, currentProjectId } = useParams()
  const organizationSlug = slug
  const vercelProjectId = foreignProjectId ?? currentProjectId
  // Deploy-button create is only for the install interstitial; settings side panels use /new.
  const newProjectURL =
    mode === 'Vercel' && variant === 'interstitial' && organizationSlug
      ? `/integrations/vercel/${organizationSlug}/deploy-button/new-project?${new URLSearchParams({
          ...(next ? { next } : {}),
          ...(vercelProjectId ? { currentProjectId: vercelProjectId } : {}),
          ...(externalId ? { externalId } : {}),
        })}`
      : `/new/${organizationSlug}`

  return (
    <div
      className={cn('flex w-full gap-2', variant === 'interstitial' ? 'flex-col' : 'justify-end')}
    >
      {showCreateProject ? (
        <Button
          asChild
          size={variant === 'interstitial' ? undefined : 'medium'}
          variant={variant === 'interstitial' ? 'primary' : 'default'}
          block={variant === 'interstitial'}
          className={variant === 'default' ? 'self-end' : undefined}
          loading={isLoading}
        >
          <Link href={newProjectURL}>Create project</Link>
        </Button>
      ) : (
        <Button
          size={variant === 'interstitial' ? undefined : 'medium'}
          variant={variant === 'interstitial' ? 'primary' : 'default'}
          block={variant === 'interstitial'}
          className={variant === 'default' ? 'self-end' : undefined}
          onClick={onCreateConnections}
          loading={isLoading}
          disabled={connectDisabled}
        >
          Connect project
        </Button>
      )}
      {onSkip !== undefined && (
        <Button
          size={variant === 'interstitial' ? undefined : 'medium'}
          variant={variant === 'interstitial' ? 'text' : 'default'}
          block={variant === 'interstitial'}
          onClick={() => {
            onSkip()
          }}
        >
          Skip
        </Button>
      )}
    </div>
  )
}
