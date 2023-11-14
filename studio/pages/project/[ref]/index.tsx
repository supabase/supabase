import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import ServiceStatus from 'components/interfaces/Home/ServiceStatus'
import { ProjectLayoutWithAuth } from 'components/layouts'
import ProjectPausedState from 'components/layouts/ProjectLayout/ProjectPausedState'
import ProjectUpgradeFailedBanner from 'components/ui/ProjectUpgradeFailedBanner'
import { useSelectedProject } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { NextPageWithLayout } from 'types'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'

const Home: NextPageWithLayout = () => {
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
        <h1 className="text-3xl">{projectName}</h1>
        {IS_PLATFORM && project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && <ServiceStatus />}
      </div>

      <div className="mx-6">
        {/* [Joshen TODO] Temporarily hidden until usage endpoint is sorted out */}
        {/* {projectTier !== undefined && <OveragesBanner minimal tier={projectTier} />} */}
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
            <div className="grid gap-8 mx-6 md:grid-cols-2 lg:grid-cols-3">
              {EXAMPLE_PROJECTS.sort((a, b) => a.title.localeCompare(b.title)).map((project) => (
                <ExampleProject key={project.url} {...project} />
              ))}
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
