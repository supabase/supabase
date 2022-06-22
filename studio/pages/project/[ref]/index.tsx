import { observer } from 'mobx-react-lite'
import { Badge, IconPauseCircle, Typography } from '@supabase/ui'
import { useStore } from 'hooks'
import { ExampleProject, ClientLibrary } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { IS_PLATFORM } from 'lib/constants'
import { ProjectLayoutWithAuth } from 'components/layouts'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import { NextPageWithLayout } from 'types'
import { toJS } from 'mobx'
import ProjectPausedState from 'components/layouts/ProjectLayout/ProjectPausedState'

const Home: NextPageWithLayout = () => {
  const { ui } = useStore()

  const project = ui.selectedProject

  console.log('project ref:', toJS(project))

  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  return (
    <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
      <div className="mx-6 flex items-center space-x-6">
        <h1 className="text-3xl">{projectName}</h1>
        {project?.status == 'INACTIVE' && (
          <div className="mt-2">
            <Badge color="gray">
              <div className="flex items-center gap-2">
                <IconPauseCircle size={15} />
                <span>Project paused</span>
              </div>
            </Badge>
          </div>
        )}
      </div>

      {project && project?.status == 'INACTIVE' && <ProjectPausedState project={project} />}

      {IS_PLATFORM && project?.status !== 'INACTIVE' && <ProjectUsageSection />}

      <div className="space-y-8">
        <div className="mx-6">
          <Typography.Title level={4}>Client libraries</Typography.Title>
        </div>
        <div className="mx-6 mb-12 grid gap-12 md:grid-cols-3">
          {CLIENT_LIBRARIES.map((library) => (
            <ClientLibrary key={library.language} {...library} />
          ))}
        </div>
      </div>
      <div className="space-y-8">
        <div className="mx-6">
          <Typography.Title level={4}>Example projects</Typography.Title>
        </div>
        <div className="mx-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_PROJECTS.map((project) => (
            <ExampleProject key={project.url} {...project} />
          ))}
        </div>
      </div>
    </div>
  )
}

Home.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default observer(Home)
