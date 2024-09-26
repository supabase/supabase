import { useQueryClient } from '@tanstack/react-query'
import ClientLibrary from 'components/interfaces/Home/ClientLibrary'
import ExampleProject from 'components/interfaces/Home/ExampleProject'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useParams } from 'common'
import { DisplayApiSettings, DisplayConfigSettings } from 'components/ui/ProjectSettings'
import { invalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { invalidateProjectsQuery } from 'data/projects/projects-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { getWithTimeout } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Badge, Button } from 'ui'

const BuildingState = () => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const queryClient = useQueryClient()
  const checkServerInterval = useRef<number>()

  // TODO: move to react-query
  async function checkServer() {
    if (!project) return

    const projectStatus = await getWithTimeout(`${API_URL}/projects/${project.ref}/status`, {
      timeout: 2000,
    })
    if (projectStatus && !projectStatus.error) {
      const { status } = projectStatus
      if (status === PROJECT_STATUS.ACTIVE_HEALTHY) {
        clearInterval(checkServerInterval.current)
        if (ref) await invalidateProjectDetailsQuery(queryClient, ref)
        await invalidateProjectsQuery(queryClient)
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

  if (project === undefined) return null

  return (
    <div className="mx-auto my-16 w-full max-w-7xl items-center justify-center">
      <div className="mx-6 flex flex-col space-y-16">
        <div className=" flex flex-col gap-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl text-foreground">{project?.name}</h1>
            <Badge variant="default" className="bg-surface-100 bg-opacity-100">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={12} />
                <span>
                  {project.status === PROJECT_STATUS.UNKNOWN
                    ? 'Initiating project set up'
                    : 'Setting up project'}
                </span>
              </div>
            </Badge>
          </div>
          <div>
            <p className="text-sm text-foreground-light">
              {' '}
              We are provisioning your database and API endpoints
            </p>
            <p className="text-sm text-foreground-light"> This may take a few minutes</p>
          </div>
        </div>
        <div>
          <div className=" grid grid-cols-12 gap-12">
            <div className="col-span-12 space-y-12 lg:col-span-4">
              <div>
                <h4 className="text-base text-foreground">While you wait</h4>

                <ChecklistItem
                  description={
                    <p className="text-sm text-foreground-light">
                      Browse the Supabase{' '}
                      <Link
                        href="https://supabase.com/docs"
                        className="mb-0 text-brand transition-colors hover:text-brand-600"
                        target="_blank"
                        rel="noreferrer"
                      >
                        documentation
                      </Link>
                      .
                    </p>
                  }
                />
              </div>
              <div>
                <h4 className="text-base text-foreground">Not working?</h4>
                <ChecklistItem
                  description={
                    <p className="text-sm text-foreground-light">
                      Try refreshing after a couple of minutes.
                    </p>
                  }
                />
                <ul>
                  <ChecklistItem
                    description={
                      <>
                        <p className="mb-4 text-sm text-foreground-light">
                          If your dashboard hasn't connected within 2 minutes, you can open a
                          support ticket.
                        </p>
                        <Button asChild type="default">
                          <Link href="/support/new">Contact support team</Link>
                        </Button>
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
export default BuildingState

const ChecklistItem = ({ description }: any) => {
  return (
    <li className="my-3 flex flex-wrap space-x-3">
      <div className="mt-0.5">
        <ArrowRight className="text-foreground-lighter" size={14} />
      </div>
      <div className="flex-1">{description}</div>
    </li>
  )
}
