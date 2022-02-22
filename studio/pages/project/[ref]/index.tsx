import useSWR from 'swr'
import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'
import { Typography, IconLoader } from '@supabase/ui'

import { get } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import BaseLayout from 'components/layouts'
import {
  ExampleProject,
  ClientLibrary,
  ProjectUsage,
  NewProjectPanel,
} from 'components/interfaces/Home'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'

const Home: NextPage = () => {
  const { ui } = useStore()

  const project = ui.selectedProject
  const projectName =
    project?.ref !== 'default'
      ? project?.name ?? 'Welcome to your project'
      : 'Welcome to your project'

  const { data: usage, error: usageError }: any = useSWR(
    `${API_URL}/projects/${project?.ref}/usage`,
    get
  )

  if (usageError) {
    return <Typography.Text type="danger">Error loading data {usageError.message}</Typography.Text>
  }

  const hasProjectData =
    usage && (usage?.bucketSize || (usage?.authUsers ?? '0') !== '0' || usage?.dbTables)
      ? true
      : false

  return (
    <BaseLayout>
      <div className="max-w-7xl mx-auto w-full my-16 space-y-16">
        <div className="mx-6 flex space-x-6 items-center">
          <Typography.Title level={2} className="m-0">
            {projectName}
          </Typography.Title>
        </div>
        {IS_PLATFORM && project && (
          <>
            {isUndefined(usage) ? (
              <div className="w-full flex justify-center items-center space-x-2">
                <IconLoader className="animate-spin" size={14} />
                <Typography.Text>Retrieving project usage statistics</Typography.Text>
              </div>
            ) : !usage.error && hasProjectData ? (
              <ProjectUsage project={project} />
            ) : (
              <NewProjectPanel />
            )}
          </>
        )}
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
