import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import ClientLibrary from 'components/interfaces/Home/ClientLibrary'
import { ExampleProject } from 'components/interfaces/Home/ExampleProject'
import { EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { DisplayApiSettings, DisplayConfigSettings } from 'components/ui/ProjectSettings'
import { invalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { useProjectStatusQuery } from 'data/projects/project-status-query'
import { invalidateProjectsQuery } from 'data/projects/projects-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from 'lib/constants'
import { Badge, Button, Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

const BuildingState = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const queryClient = useQueryClient()

  const showExamples = useIsFeatureEnabled('project_homepage:show_examples')

  const { projectHomepageClientLibraries: clientLibraries } = useCustomContent([
    'project_homepage:client_libraries',
  ])

  // Check if project startup is stalled (taking longer than 5 minutes)
  // inserted_at is stored as UTC without timezone indicator, so we need to parse it as UTC
  const minutesSinceInserted = project?.inserted_at
    ? dayjs().diff(dayjs.utc(project.inserted_at), 'minute')
    : 0
  const comingupStalled =
    project?.status === PROJECT_STATUS.COMING_UP && project?.inserted_at && minutesSinceInserted > 5

  useProjectStatusQuery(
    { projectRef: ref },
    {
      enabled: project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY,
      refetchInterval: (res) => {
        return res?.status === PROJECT_STATUS.ACTIVE_HEALTHY ? false : 4000
      },
      onSuccess: async (res) => {
        if (res.status === PROJECT_STATUS.ACTIVE_HEALTHY) {
          if (ref) invalidateProjectDetailsQuery(queryClient, ref)
          invalidateProjectsQuery(queryClient)
        }
      },
    }
  )

  if (project === undefined) return null

  return (
    <div className="mx-auto my-8 md:my-16 w-full md:max-w-7xl items-center justify-center">
      <div className="px-4 md:px-6 flex flex-col space-y-16">
        <div className="w-full flex flex-col gap-4">
          <div className="w-full flex flex-col md:flex-row items-start md:items-center gap-3">
            <h1 className="text-3xl">{project?.name}</h1>
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
          {project.status === PROJECT_STATUS.COMING_UP ? (
            <>
              {comingupStalled ? (
                <Alert_Shadcn_ className=" rounded-none mb-0 border-b border-t" variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>
                    This process is taking longer than expected.
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    <p className="text-sm text-foreground-light"></p>
                    <p className="text-sm text-foreground-light">
                      Please check our{' '}
                      <Link
                        href="https://status.supabase.com"
                        className="text-brand transition-colors hover:text-brand-600"
                        target="_blank"
                        rel="noreferrer"
                      >
                        incident page
                      </Link>{' '}
                      for any ongoing issues, or{' '}
                      <Link
                        href="/support/new?subject=Project%20setup%20stalled"
                        className="text-brand transition-colors hover:text-brand-600"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Contact support
                      </Link>{' '}
                      if the issue persists.
                    </p>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              ) : (
                <div>
                  <p className="text-sm text-foreground-light">
                    We are provisioning your database and API endpoints
                  </p>
                  <p className="text-sm text-foreground-light"> This may take a few minutes</p>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm text-foreground-light">
                We are provisioning your database and API endpoints
              </p>
              <p className="text-sm text-foreground-light"> This may take a few minutes</p>
            </div>
          )}
        </div>
        <div>
          <div className="w-full grid grid-cols-12 gap-12">
            <div className="w-full col-span-12 space-y-12 lg:col-span-4">
              <div>
                <h4 className="text-base text-foreground">While you wait</h4>

                <ChecklistItem
                  description={
                    <p className="text-sm text-foreground-light">
                      Browse the Supabase{' '}
                      <Link
                        href={`${DOCS_URL}`}
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
            <div className="col-span-12  lg:col-span-8 flex flex-col gap-8">
              <DisplayApiSettings showLegacyText={false} />
              <DisplayConfigSettings />
            </div>
          </div>
        </div>
      </div>
      {project.status === PROJECT_STATUS.COMING_UP && (
        <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
          <div className="space-y-8">
            <div className="mx-6">
              <h4 className="text-lg">Client libraries</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:gap-12 mx-6 mb-12 md:grid-cols-3">
              {clientLibraries!.map((library) => (
                <ClientLibrary key={library.language} {...library} />
              ))}
            </div>
          </div>
          {showExamples && (
            <div className="space-y-8">
              <div className="mx-6">
                <h5>Example projects</h5>
              </div>
              <div className="mx-6 grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {EXAMPLE_PROJECTS.map((project) => (
                  <ExampleProject key={project.url} {...project} />
                ))}
              </div>
            </div>
          )}
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
