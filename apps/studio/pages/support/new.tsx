import { Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import SVG from 'react-inlinesvg'

import Success from 'components/interfaces/Support/Success'
import { SupportFormV2 } from 'components/interfaces/Support/SupportFormV2'
import { usePlatformStatusQuery } from 'data/platform/platform-status-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { Button, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

const SupportPage = () => {
  const [sentCategory, setSentCategory] = useState<string>()
  const [selectedProject, setSelectedProject] = useState<string>('no-project')
  const { data, isLoading } = usePlatformStatusQuery()
  const isHealthy = data?.isHealthy

  const { data: projectsData, isLoading: isLoadingProjects } = useProjectsQuery()

  return (
    <div className="relative flex overflow-y-auto overflow-x-hidden">
      <div className="mx-auto my-8 max-w-2xl w-full px-4 lg:px-6">
        <div className="space-y-12 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-2">
            <div className="flex items-center space-x-3">
              <SVG src={`${BASE_PATH}/img/supabase-logo.svg`} className="h-4 w-4" />
              <h1 className="m-0 text-lg">Supabase support</h1>
            </div>
            <div className="flex items-center gap-x-3">
              <Button asChild type="default" icon={<Wrench />}>
                <Link
                  href="https://supabase.com/docs/guides/platform/troubleshooting"
                  target="_blank"
                  rel="noreferrer"
                >
                  Troubleshooting
                </Link>
              </Button>
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <Button
                    asChild
                    type="default"
                    icon={
                      isLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : isHealthy ? (
                        <div className="h-2 w-2 bg-brand rounded-full" />
                      ) : (
                        <div className="h-2 w-2 bg-yellow-900 rounded-full" />
                      )
                    }
                  >
                    <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                      {isLoading
                        ? 'Checking status'
                        : isHealthy
                          ? 'All systems operational'
                          : 'Active incident ongoing'}
                    </Link>
                  </Button>
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="bottom" align="center">
                  Check Supabase status page
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
            </div>
          </div>

          <div
            className={[
              'min-w-full w-full space-y-12 rounded border bg-panel-body-light shadow-md',
              `${sentCategory === undefined ? 'py-8' : 'pt-8'}`,
              'border-default',
            ].join(' ')}
          >
            {sentCategory !== undefined ? (
              <Success
                sentCategory={sentCategory}
                selectedProject={selectedProject}
                projects={projectsData}
              />
            ) : (
              <SupportFormV2
                setSentCategory={setSentCategory}
                setSelectedProject={setSelectedProject}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(SupportPage, { useHighestAAL: false })
