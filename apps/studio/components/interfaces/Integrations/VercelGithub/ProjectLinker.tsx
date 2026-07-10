import { Check, ChevronDown, Plus, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { HTMLAttributes, ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'
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

import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import ShimmerLine from '@/components/ui/ShimmerLine'
import {
  IntegrationConnectionsCreateVariables,
  IntegrationProjectConnection,
} from '@/data/integrations/integrations.types'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { BASE_PATH } from '@/lib/constants'
import { openInstallGitHubIntegrationWindow } from '@/lib/github'
import { EMPTY_ARR } from '@/lib/void'

interface Project {
  name: string
  ref: string
}

export interface ForeignProject {
  id: string
  name: string
  installation_id?: number
}

const Panel = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
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

interface ProjectLinkerProps {
  slug?: string
  organizationIntegrationId?: string
  foreignProjects: ForeignProject[]
  onCreateConnections: (variables: IntegrationConnectionsCreateVariables) => void
  installedConnections?: IntegrationProjectConnection[]
  isLoading?: boolean
  integrationIcon: ReactNode
  getForeignProjectIcon?: (project: ForeignProject) => ReactNode
  choosePrompt?: string
  onSkip?: () => void
  loadingForeignProjects?: boolean
  showNoEntitiesState?: boolean
  defaultSupabaseProject?: Project
  defaultForeignProjectId?: string
  mode: 'Vercel' | 'GitHub'
  variant?: 'default' | 'interstitial'
}

export const ProjectLinker = ({
  slug,
  organizationIntegrationId,
  foreignProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = EMPTY_ARR,
  isLoading,
  integrationIcon,
  getForeignProjectIcon,
  choosePrompt = 'Choose a project',
  onSkip,
  loadingForeignProjects,
  showNoEntitiesState = true,
  defaultSupabaseProject,
  defaultForeignProjectId,
  mode,
  variant = 'default',
}: ProjectLinkerProps) => {
  const router = useRouter()
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const [openProjectsDropdown, setOpenProjectsDropdown] = useState(false)
  const [openForeignProjectsComboBox, setOpenForeignProjectsComboBox] = useState(false)
  const [foreignProjectId, setForeignProjectId] = useState<string | undefined>(
    defaultForeignProjectId
  )
  const [selectedSupabaseProject, setSelectedSupabaseProject] = useState<Project>()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: orgProjects, isPending: loadingSupabaseProjects } = useOrgProjectsInfiniteQuery({
    slug,
  })
  const numProjects = orgProjects?.pages[0].pagination.count ?? 0

  useEffect(() => {
    if (defaultSupabaseProject !== undefined && selectedSupabaseProject === undefined)
      setSelectedSupabaseProject(defaultSupabaseProject)
  }, [defaultSupabaseProject, selectedSupabaseProject])

  useEffect(() => {
    if (defaultForeignProjectId !== undefined && foreignProjectId === undefined)
      setForeignProjectId(defaultForeignProjectId)
  }, [defaultForeignProjectId, foreignProjectId])

  // create a flat array of foreign project ids. ie, ["prj_MlkO6AiLG5ofS9ojKrkS3PhhlY3f", ..]
  const flatInstalledConnectionsIds = new Set(installedConnections.map((x) => x.foreign_project_id))

  const selectedForeignProject = foreignProjectId
    ? foreignProjects.find((x) => x.id?.toLowerCase() === foreignProjectId?.toLowerCase())
    : undefined

  function onCreateConnections() {
    const projectDetails = selectedForeignProject

    if (!selectedForeignProject?.id) return console.error('No Foreign project ID set')
    if (!selectedSupabaseProject?.ref) return console.error('No Supabase project ref set')

    const alreadyInstalled = flatInstalledConnectionsIds.has(foreignProjectId ?? '')
    if (alreadyInstalled) {
      return toast.error(
        `Unable to connect to ${selectedForeignProject.name}: Selected repository already has an installed connection to a project`
      )
    }

    _onCreateConnections({
      organizationIntegrationId: organizationIntegrationId!,
      connection: {
        foreign_project_id: selectedForeignProject?.id,
        supabase_project_ref: selectedSupabaseProject?.ref,
        integration_id: '0',
        metadata: {
          ...projectDetails,
        },
      },
      orgSlug: selectedOrganization?.slug,
      new: {
        installation_id: selectedForeignProject.installation_id!,
        project_ref: selectedSupabaseProject.ref,
        repository_id: Number(selectedForeignProject.id),
      },
    })
  }

  const noSupabaseProjects = numProjects === 0
  const noForeignProjects = foreignProjects.length === 0
  const missingEntity = noSupabaseProjects ? 'Supabase' : mode
  const oppositeMissingEntity = noSupabaseProjects ? mode : 'Supabase'

  const connectDisabled =
    loadingForeignProjects ||
    loadingSupabaseProjects ||
    isLoading ||
    !selectedSupabaseProject ||
    !selectedForeignProject

  const supabaseProjectSelector = (
    <OrganizationProjectSelector
      sameWidthAsTrigger
      open={openProjectsDropdown}
      setOpen={setOpenProjectsDropdown}
      slug={slug}
      selectedRef={selectedSupabaseProject?.ref}
      onSelect={(project) => {
        setSelectedSupabaseProject(project)
        setOpenProjectsDropdown(false)
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
                  setOpenProjectsDropdown(false)
                  router.push(`/new/${selectedOrganization?.slug}`)
                }}
                onClick={() => setOpenProjectsDropdown(false)}
              >
                <Link
                  href={`/new/${selectedOrganization?.slug}`}
                  onClick={() => {
                    setOpenProjectsDropdown(false)
                  }}
                  className="w-full flex items-center gap-2"
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

  const foreignProjectSelector = (
    <Popover open={openForeignProjectsComboBox} onOpenChange={setOpenForeignProjectsComboBox}>
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
                      setOpenForeignProjectsComboBox(false)
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

  const actionButtons = (
    <div
      className={cn('flex w-full gap-2', variant === 'interstitial' ? 'flex-col' : 'justify-end')}
    >
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

  if (variant === 'interstitial') {
    return (
      <div className="flex flex-col gap-5">
        {loadingForeignProjects || loadingSupabaseProjects ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground-light">Loading projects</p>
            <ShimmerLine active />
          </div>
        ) : showNoEntitiesState && (noSupabaseProjects || noForeignProjects) ? (
          <div className="text-sm text-foreground-lighter text-balance">
            No {missingEntity} projects found. Create a {missingEntity} project to link to a{' '}
            {oppositeMissingEntity} project, or skip and connect later.
          </div>
        ) : (
          <>
            <section className="space-y-2" aria-label="Supabase project">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                Supabase project
              </p>
              {supabaseProjectSelector}
            </section>

            <section className="space-y-2" aria-label="Vercel project">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                Vercel project
              </p>
              {foreignProjectSelector}
            </section>
          </>
        )}

        {actionButtons}
      </div>
    )
  }

  return (
    <div className="flex flex-col bg border shadow-sm rounded-lg overflow-hidden">
      <div className="relative p-12 border-b border-muted">
        <div
          className="absolute inset-0 bg-grid-black/5 mask-[linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:mask-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          style={{ backgroundPosition: '10px 10px' }}
        />

        {loadingForeignProjects ? (
          <div className="w-1/2 mx-auto space-y-2 py-4">
            <p className="text-sm text-foreground text-center">Loading projects</p>
            <ShimmerLine active />
          </div>
        ) : showNoEntitiesState && (noSupabaseProjects || noForeignProjects) ? (
          <div className="text-center">
            <h5 className="text-foreground">No {missingEntity} Projects found</h5>
            <p className="text-foreground-light text-sm">
              You will need to create a {missingEntity} Project to link to a {oppositeMissingEntity}{' '}
              Project.
              <br />
              You can skip this and create a Project Connection later.
            </p>
          </div>
        ) : (
          <div className="flex justify-center gap-0 w-full relative">
            <Panel>
              <div className="bg-white shadow-sm border rounded-sm p-1 w-12 h-12 flex justify-center items-center">
                <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-6" />
              </div>

              {supabaseProjectSelector}
            </Panel>

            <div className="border border-foreground-lighter h-px w-8 border-dashed self-end mb-4" />

            <Panel>
              <div className="bg-black shadow-sm rounded-sm p-1 w-12 h-12 flex justify-center items-center">
                {integrationIcon}
              </div>

              {foreignProjectSelector}
            </Panel>
          </div>
        )}
      </div>

      <div className="flex w-full justify-end gap-2 p-4 bg-surface-75">{actionButtons}</div>
    </div>
  )
}
