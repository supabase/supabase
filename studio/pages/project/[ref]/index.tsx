import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import { ExampleProject, ClientLibrary } from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { IS_PLATFORM } from 'lib/constants'
import BaseLayout from 'components/layouts'
import ProjectUsageSection from 'components/interfaces/Home/ProjectUsageSection'

const Home: NextPage = () => {
  const { ui } = useStore()

  const project = ui.selectedProject
  const projectName =
    project?.ref !== 'default' && project?.name !== undefined
      ? project?.name
      : 'Welcome to your project'

  return (
    <BaseLayout>
      <div className="max-w-7xl mx-auto w-full my-16 space-y-16">
        <div className="mx-6 flex space-x-6 items-center">
          <h1 className="text-3xl">{projectName}</h1>
        </div>
        {IS_PLATFORM && <ProjectUsageSection />}
        <div className="space-y-8">
          <div className="mx-6">
            <Typography.Title level={4}>Client libraries</Typography.Title>
          </div>
          <div className="mx-6 grid md:grid-cols-3 gap-12 mb-12">
            {CLIENT_LIBRARIES.map((library) => (
              <ClientLibrary key={library.language} {...library} />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div className="mx-6">
            <Typography.Title level={4}>Example projects</Typography.Title>
          </div>
          <div className="mx-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {EXAMPLE_PROJECTS.map((project) => (
              <ExampleProject key={project.url} {...project} />
            ))}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}

export default withAuth(observer(Home))
