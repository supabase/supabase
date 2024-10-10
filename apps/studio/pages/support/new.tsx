import { ClipboardIcon, Loader2, Wrench } from 'lucide-react'
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
import InformationBox from 'components/ui/InformationBox'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/shadcn/ui/tooltip'

const SupportPage = () => {
  const [sentCategory, setSentCategory] = useState<string>()
  const [selectedProject, setSelectedProject] = useState<string>('no-project')
  const { data, isLoading } = usePlatformStatusQuery()
  const isHealthy = data?.isHealthy
  const router = useRouter()
  const { ref } = router.query

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

          <InformationBox
            title="Having trouble submitting the form?"
            description={
              <div className="space-y-4">
                <p className="flex items-center gap-x-1">
                  Email us directly at{' '}
                  <button
                    className="p-1 font-mono flex gap-1 items-center rounded-md hover:bg-background-alternative-200 text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText('support@supabase.com')
                      toast.success('Copied to clipboard')
                    }}
                  >
                    support@supabase.com
                    <ClipboardIcon size="14" className="text-foreground-lighter" />
                  </button>
                </p>
                <p>
                  Please, make sure to{' '}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground underline">include your project ID</span>
                    </TooltipTrigger>
                    <TooltipContent className="px-0">
                      <ul>
                        <li className="px-2">Your projects</li>
                        {projectsData?.map((project) => (
                          <li key={project.id} className="cursor-default">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${project.name} - ${project.ref}`)
                                toast.success('Copied to clipboard')
                              }}
                              className="py-1.5 px-2 gap-x-1 text-foreground grid grid-cols-2 hover:bg-background-alternative-200"
                            >
                              <span className="max-w-40 truncate">{project.name}</span>
                              <span className="flex gap-x-1 items-center">
                                {project.ref}
                                <ClipboardIcon size="14" className="text-foreground-lighter" />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>{' '}
                  and as much information as possible.
                </p>
              </div>
            }
            defaultVisibility={true}
            hideCollapse={true}
          />
        </div>
      </div>
    </div>
  )
}

export default withAuth(SupportPage, { useHighestAAL: false })
