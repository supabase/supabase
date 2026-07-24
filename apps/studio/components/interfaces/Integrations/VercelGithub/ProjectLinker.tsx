import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  ActionButtons,
  ForeignProjectSelector,
  Panel,
  SupabaseProjectSelector,
} from './ProjectLinkerComponents'
import { Project, ProjectLinkerProps } from './VercelGithub.types'
import ShimmerLine from '@/components/ui/ShimmerLine'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { BASE_PATH } from '@/lib/constants'
import { EMPTY_ARR } from '@/lib/void'

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

  useEffect(() => {
    if (defaultSupabaseProject !== undefined && selectedSupabaseProject === undefined)
      setSelectedSupabaseProject(defaultSupabaseProject)
  }, [defaultSupabaseProject, selectedSupabaseProject])

  useEffect(() => {
    if (defaultForeignProjectId !== undefined && foreignProjectId === undefined)
      setForeignProjectId(defaultForeignProjectId)
  }, [defaultForeignProjectId, foreignProjectId])

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
              <SupabaseProjectSelector
                open={openProjectsDropdown}
                variant={variant}
                slug={slug}
                defaultSupabaseProject={defaultSupabaseProject}
                selectedSupabaseProject={selectedSupabaseProject}
                loadingSupabaseProjects={loadingSupabaseProjects}
                setOpen={setOpenProjectsDropdown}
                setSelectedSupabaseProject={setSelectedSupabaseProject}
              />
            </section>

            <section className="space-y-2" aria-label="Vercel project">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                Vercel project
              </p>
              <ForeignProjectSelector
                open={openForeignProjectsComboBox}
                mode={mode}
                variant={variant}
                choosePrompt={choosePrompt}
                selectedForeignProject={selectedForeignProject}
                loadingForeignProjects={loadingForeignProjects}
                foreignProjects={foreignProjects}
                integrationIcon={integrationIcon}
                setForeignProjectId={setForeignProjectId}
                onOpenChange={setOpenForeignProjectsComboBox}
                getForeignProjectIcon={getForeignProjectIcon}
              />
            </section>
          </>
        )}

        <ActionButtons
          slug={slug}
          mode={mode}
          variant={variant}
          showCreateProject={showNoEntitiesState && noSupabaseProjects}
          connectDisabled={connectDisabled}
          foreignProjectId={foreignProjectId}
          isLoading={isLoading}
          onCreateConnections={onCreateConnections}
          onSkip={onSkip}
        />
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

              <SupabaseProjectSelector
                open={openProjectsDropdown}
                variant={variant}
                slug={slug}
                defaultSupabaseProject={defaultSupabaseProject}
                selectedSupabaseProject={selectedSupabaseProject}
                loadingSupabaseProjects={loadingSupabaseProjects}
                setOpen={setOpenProjectsDropdown}
                setSelectedSupabaseProject={setSelectedSupabaseProject}
              />
            </Panel>

            <div className="border border-foreground-lighter h-px w-8 border-dashed self-end mb-4" />

            <Panel>
              <div className="bg-black shadow-sm rounded-sm p-1 w-12 h-12 flex justify-center items-center">
                {integrationIcon}
              </div>

              <ForeignProjectSelector
                open={openForeignProjectsComboBox}
                mode={mode}
                variant={variant}
                choosePrompt={choosePrompt}
                selectedForeignProject={selectedForeignProject}
                loadingForeignProjects={loadingForeignProjects}
                foreignProjects={foreignProjects}
                integrationIcon={integrationIcon}
                setForeignProjectId={setForeignProjectId}
                onOpenChange={setOpenForeignProjectsComboBox}
                getForeignProjectIcon={getForeignProjectIcon}
              />
            </Panel>
          </div>
        )}
      </div>

      <div className="flex w-full justify-end gap-2 p-4 bg-surface-75">
        <ActionButtons
          slug={slug}
          mode={mode}
          variant={variant}
          showCreateProject={showNoEntitiesState && noSupabaseProjects}
          connectDisabled={connectDisabled}
          foreignProjectId={foreignProjectId}
          isLoading={isLoading}
          onCreateConnections={onCreateConnections}
          onSkip={onSkip}
        />
      </div>
    </div>
  )
}
