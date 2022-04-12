import Link from 'next/link'
import { FC, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconArrowRight, IconLoader, Button } from '@supabase/ui'
import {
  DisplayApiSettings,
  DisplayConfigSettings,
} from 'components/to-be-cleaned/DisplayProjectSettings'
import ExampleProject from 'components/interfaces/Home/ExampleProject'
import ClientLibrary from 'components/interfaces/Home/ClientLibrary'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'

import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { Project } from 'types'

type ProjectBuildingState = { project: Project }
const ProjectBuildingState: FC<ProjectBuildingState> = ({ project }) => {
  const { app } = useStore()
  const checkServerInterval = useRef<number>()

  async function checkServer() {
    if (!project) return

    const projectStatus = await get(`${API_URL}/projects/${project.ref}/status`)
    if (projectStatus && !projectStatus.error) {
      const { status } = projectStatus
      if (status === PROJECT_STATUS.ACTIVE_HEALTHY) {
        const res = await get(`${API_URL}/props/project/${project.ref}/connection-string`)
        if (res && res.connectionString) {
          app.onProjectConnectionStringUpdated(project.id, res.connectionString)
        }
        app.onProjectStatusUpdated(project.id, status)
        clearInterval(checkServerInterval.current)
      }
    }
  }

  useEffect(() => {
    // check server status every 2s
    checkServerInterval.current = window.setInterval(checkServer, 2000)
    return () => {
      clearInterval(checkServerInterval.current)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto w-full items-center justify-center my-16">
      <div className="flex flex-col space-y-16 mx-6">
        <div className=" flex flex-col gap-4">
          <div className="space-x-3 flex items-center">
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
            <div className="col-span-12 lg:col-span-4 space-y-12">
              <div>
                <h4 className="text-scale-1200 text-base">While you wait</h4>

                <ChecklistItem
                  description={
                    <p className="text-scale-1100 text-sm">
                      Browse the Supabase{' '}
                      <Link href="https://supabase.com/docs">
                        <a
                          className="text-brand-900 hover:text-brand-1200 transition-colors mb-0"
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
                        <p className="text-scale-1100 text-sm mb-4">
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
      <div className="max-w-7xl mx-auto w-full my-16 space-y-16">
        <div className="space-y-8">
          <div className="mx-6">
            <h5>Client libraries</h5>
          </div>
          <div className="mx-6 grid md:grid-cols-3 gap-12 mb-12">
            {CLIENT_LIBRARIES.map((library) => (
              <ClientLibrary key={library.language} {...library} />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div className="mx-6">
            <h5>Example projects</h5>
          </div>
          <div className="mx-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {EXAMPLE_PROJECTS.map((project) => (
              <ExampleProject key={project.url} {...project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default observer(ProjectBuildingState)

const ChecklistItem = ({ description }: any) => {
  return (
    <li className="flex flex-wrap my-3 space-x-3">
      <div className="mt-0.5">
        <IconArrowRight className="text-scale-900" size="tiny" />
      </div>
      <div className="flex-1">{description}</div>
    </li>
  )
}
