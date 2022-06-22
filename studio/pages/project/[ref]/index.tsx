import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'
import { useStore } from 'hooks'
import { ExampleProject, ClientLibrary } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { IS_PLATFORM } from 'lib/constants'
import { ProjectLayoutWithAuth } from 'components/layouts'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'
import { NextPageWithLayout } from 'types'

const Home: NextPageWithLayout = () => {
  const { ui } = useStore()

  const project = ui.selectedProject
  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  return (
    <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
      <div className="mx-6 flex items-center space-x-6">
        <h1 className="text-3xl">{projectName}</h1>
      </div>
      {IS_PLATFORM && <ProjectUsageSection />}
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
          {EXAMPLE_PROJECTS.sort((a, b) => a.title.localeCompare(b.title)).map((project) => (
            <ExampleProject key={project.url} {...project} />
          ))}
        </div>
      </div>
    </div>
  )
}

Home.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default observer(Home)
