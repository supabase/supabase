import { observer } from 'mobx-react-lite'

import { useParams, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ProjectLayoutWithAuth } from 'components/layouts'
import { ExampleProject, ClientLibrary } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import ProjectPausedState from 'components/layouts/ProjectLayout/ProjectPausedState'
import OveragesBanner from 'components/ui/OveragesBanner/OveragesBanner'

const Home: NextPageWithLayout = () => {
  const { ui } = useStore()
  const { ref } = useParams()

  const project = ui.selectedProject
  const projectTier = ui.selectedProject?.subscription_tier

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  return (
    <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
      <div className="mx-6 flex items-center space-x-6">
        <h1 className="text-3xl">{projectName}</h1>
      </div>

      <div className="mx-6">
        {/* [Joshen TODO] Temporarily hidden until usage endpoint is sorted out */}
        {/* {projectTier !== undefined && <OveragesBanner minimal tier={projectTier} />} */}
      </div>

      {project?.status === PROJECT_STATUS.INACTIVE && <ProjectPausedState project={project} />}

      <div className="mx-6">
        {IS_PLATFORM && project?.status !== PROJECT_STATUS.INACTIVE && <ProjectUsageSection />}
      </div>

      <div className="space-y-8">
        <div className="mx-6">
          <h4 className="text-lg">Client libraries</h4>
        </div>
        <div className="mx-6 mb-12 grid gap-12 md:grid-cols-3">
          {CLIENT_LIBRARIES.map((library) => (
            <ClientLibrary key={library.language} {...library} />
          ))}
        </div>
      </div>
      <div className="space-y-8">
        <div className="mx-6">
          <h4 className="text-lg">Example projects</h4>
        </div>
        <div className="mx-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_PROJECTS.sort((a, b) => a.title.localeCompare(b.title)).map((project) => (
            <ExampleProject key={project.url} {...project} />
          ))}
        </div>
      </div>
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

export default observer(Home)
