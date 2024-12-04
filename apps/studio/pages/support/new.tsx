import { ClipboardIcon, Loader2, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import SVG from 'react-inlinesvg'

import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/shadcn/ui/tooltip'
import Success from 'components/interfaces/Support/Success'
import { SupportFormV2 } from 'components/interfaces/Support/SupportFormV2'
import CopyButton from 'components/ui/CopyButton'
import InformationBox from 'components/ui/InformationBox'
import { usePlatformStatusQuery } from 'data/platform/platform-status-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { toast } from 'sonner'
import { Button, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

const SupportPage = () => {
  const [sentCategory, setSentCategory] = useState<string>()
  const [selectedProject, setSelectedProject] = useState<string>('no-project')
  const { data, isLoading } = usePlatformStatusQuery()
  const isHealthy = data?.isHealthy

  const { data: projectsData } = useProjectsQuery()

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
                  <Link
                    href="mailto:support@supabase.com"
                    className="p-1 font-mono rounded-md  text-foreground"
                  >
                    support@supabase.com
                  </Link>
                  <CopyButton
                    type="text"
                    text="support@supabase.com"
                    iconOnly
                    onClick={() => {
                      toast.success('Copied to clipboard')
                    }}
                  />
                </p>
                <p>
                  Please, make sure to{' '}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground underline">include your project ID</span>
                    </TooltipTrigger>
                    <TooltipContent className="px-0">
                      <ul className="p-2">
                        <li className="grid pb-1 grid-cols-2 px-2 text-foreground-lighter">
                          <span>Project name</span>
                          <span>ID</span>
                        </li>
                        {projectsData?.map((project) => (
                          <li key={project.id} className="cursor-default">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(project.ref)
                                toast.success('Copied to clipboard')
                              }}
                              className="w-full group py-1.5 px-2 gap-x-1 text-foreground hover:bg-muted grid grid-cols-2 text-left rounded-sm"
                            >
                              <span className="truncate max-w-40">{project.name}</span>
                              <span className="flex w-full gap-x-1 items-center font-mono">
                                {project.ref}
                                <ClipboardIcon
                                  size="14"
                                  className="text-foreground-lighter opacity-0 group-hover:opacity-100 transition-opacity"
                                />
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
