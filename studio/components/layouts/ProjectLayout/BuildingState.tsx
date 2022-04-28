import Link from 'next/link'
import { FC, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconArrowRight, IconLoader, Button } from '@supabase/ui'
import ExampleProject from 'components/interfaces/Home/ExampleProject'
import ClientLibrary from 'components/interfaces/Home/ClientLibrary'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'

import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useStore } from 'hooks'
import { get, getWithTimeout } from 'lib/common/fetch'
import { Project } from 'types'
import { DisplayApiSettings, DisplayConfigSettings } from 'components/ui/ProjectSettings'

type ProjectBuildingState = { project: Project }
const ProjectBuildingState: FC<ProjectBuildingState> = ({ project }) => {
  const { app } = useStore()
  const checkServerInterval = useRef<number>()

  async function checkServer() {
    if (!project) return

    const projectStatus = await getWithTimeout(`${API_URL}/projects/${project.ref}/status`, {
      timeout: 2000,
    })

    if (projectStatus && !projectStatus.error) {
      const { status } = projectStatus
      if (status === PROJECT_STATUS.ACTIVE_HEALTHY) {
        clearInterval(checkServerInterval.current)

        const res = await get(`${API_URL}/props/project/${project.ref}/connection-string`)
        if (res && res.connectionString) {
          app.onProjectConnectionStringUpdated(project.id, res.connectionString)
        }
        app.onProjectStatusUpdated(project.id, status)
      }
    }
  }

  useEffect(() => {
    // check server status every 4s
    checkServerInterval.current = window.setInterval(checkServer, 4000)
    return () => {
      clearInterval(checkServerInterval.current)
    }
  }, [])

  return (
    <div className="mx-auto my-16 w-full max-w-6xl items-center justify-center">
      <div className="mx-6 flex flex-col space-y-16">
        <div className=" flex flex-col gap-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-scale-1200 text-3xl">{project?.name}</h1>
            <Badge color="brand">
              <div className="flex items-center gap-2">
                <IconLoader className="animate-spin" size={12} />
                <span>
                  {project.status === PROJECT_STATUS.RESTORING
                    ? 'Restoring project'
                    : 'Setting up project'}
                </span>
              </div>
            </Badge>
          </div>
          <div>
            <p className="text-scale-1100 text-sm">
              {' '}
              We are provisioning your database and API endpoints
            </p>
            <p className="text-scale-1100 text-sm"> This may take a few minutes</p>
          </div>
        </div>
        <div>
          <div className=" grid grid-cols-12 gap-12">
            <div className="col-span-12 space-y-12 lg:col-span-4">
              <div>
                <h4 className="text-scale-1200 text-base">While you wait</h4>

                <ChecklistItem
                  description={
                    <p className="text-scale-1100 text-sm">
                      Browse the Supabase{' '}
                      <Link href="https://supabase.com/docs">
                        <a
                          className="text-brand-900 hover:text-brand-1200 mb-0 transition-colors"
                          target="_blank"
                        >
                          documentation
                        </a>
                      </Link>
                      .
                    </p>
                  }
                />
              </div>
              <div>
                <h4 className="text-scale-1200 text-base">Not working?</h4>
                <ChecklistItem
                  description={
                    <p className="text-scale-1100 text-sm">
                      Try refreshing after a couple of minutes.
                    </p>
                  }
                />
                <ul>
                  <ChecklistItem
                    description={
                      <>
                        <p className="text-scale-1100 mb-4 text-sm">
                          If your dashboard hasn't connected within 2 minutes, you can open a
                          support ticket.
                        </p>
                        <Link href="/support/new">
                          <Button type="default">Contact support team</Button>
                        </Link>
                      </>
                    }
                  />
                </ul>
              </div>
            </div>
            <div className="col-span-12  lg:col-span-8">
              <DisplayApiSettings />
              <DisplayConfigSettings />
            </div>
          </div>
        </div>
      </div>
      {project.status === PROJECT_STATUS.COMING_UP && (
        <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
          <div className="space-y-8">
            <div className="mx-6">
              <h5>Client libraries</h5>
            </div>
            <div className="mx-6 mb-12 grid gap-12 md:grid-cols-3">
              {CLIENT_LIBRARIES.map((library) => (
                <ClientLibrary key={library.language} {...library} />
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="mx-6">
              <h5>Example projects</h5>
            </div>
            <div className="mx-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {EXAMPLE_PROJECTS.map((project) => (
                <ExampleProject key={project.url} {...project} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default observer(ProjectBuildingState)

const ChecklistItem = ({ description }: any) => {
  return (
    <li className="my-3 flex flex-wrap space-x-3">
      <div className="mt-0.5">
        <IconArrowRight className="text-scale-900" size="tiny" />
      </div>
      <div className="flex-1">{description}</div>
    </li>
  )
}
