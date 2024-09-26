import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import Connect from 'components/interfaces/Home/Connect/Connect'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import { SecurityStatus } from 'components/interfaces/Home/SecurityStatus'
import ServiceStatus from 'components/interfaces/Home/ServiceStatus'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import ProjectUpgradeFailedBanner from 'components/ui/ProjectUpgradeFailedBanner'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

const Home: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const project = useSelectedProject()

  const snap = useAppStateSnapshot()
  const { enableBranching } = useParams()

  const hasShownEnableBranchingModalRef = useRef(false)
  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowEnableBranchingModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBranching])

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  return (
    <div className="w-full mx-auto my-16 space-y-16 max-w-7xl">
      <div className="flex items-center justify-between mx-6 space-x-6">
        <div className="flex flex-row items-center gap-3">
          <h1 className="text-3xl">{projectName}</h1>
          <ComputeBadgeWrapper
            project={{
              ref: project?.ref,
              organization_slug: organization?.slug,
              cloud_provider: project?.cloud_provider,
              infra_compute_size: project?.infra_compute_size,
            }}
          />
        </div>
        <div className="flex items-center gap-x-3">
          {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <SecurityStatus />}
          {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <ServiceStatus />}
          {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <Connect />}
        </div>
      </div>

      <div className="mx-6">
        <ProjectUpgradeFailedBanner />
      </div>
      {project?.status === PROJECT_STATUS.INACTIVE && <ProjectPausedState />}
      <div className="mx-6">
        {IS_PLATFORM && project?.status !== PROJECT_STATUS.INACTIVE && <ProjectUsageSection />}
      </div>

      {project?.status !== PROJECT_STATUS.INACTIVE && (
        <>
          <div className="space-y-8">
            <div className="mx-6">
              <h4 className="text-lg">Client libraries</h4>
            </div>
            <div className="grid gap-12 mx-6 mb-12 md:grid-cols-3">
              {CLIENT_LIBRARIES.map((library) => (
                <ClientLibrary key={library.language} {...library} />
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="mx-6">
              <h4 className="text-lg">Example projects</h4>
            </div>
            <div className="flex justify-center mx-6">
              <Tabs_Shadcn_ defaultValue="app">
                <TabsList_Shadcn_ className="flex gap-4">
                  <TabsTrigger_Shadcn_ value="app">App Frameworks</TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="mobile">Mobile Framework</TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_ value="app">
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {EXAMPLE_PROJECTS.filter((project) => project.type === 'app')
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((project) => (
                        <ExampleProject key={project.url} {...project} />
                      ))}
                  </div>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="mobile">
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {EXAMPLE_PROJECTS.filter((project) => project.type === 'mobile')
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((project) => (
                        <ExampleProject key={project.url} {...project} />
                      ))}
                  </div>
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

Home.getLayout = (page) => (
  <ProjectLayoutWithAuth>
    <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
      {page}
    </main>
  </ProjectLayoutWithAuth>
)

export default Home
