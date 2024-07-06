import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { useState } from 'react'
import SVG from 'react-inlinesvg'

import Success from 'components/interfaces/Support/Success'
import SupportForm from 'components/interfaces/Support/SupportForm'
import { usePlatformStatusQuery } from 'data/platform/platform-status-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { Button, IconLoader, IconTool } from 'ui'

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
            <div className="flex items-center space-x-3">
              <Button asChild type="default" icon={<IconTool />}>
                <Link
                  href="https://supabase.com/docs/guides/platform/troubleshooting"
                  target="_blank"
                  rel="noreferrer"
                >
                  Troubleshooting
                </Link>
              </Button>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button
                    asChild
                    type="default"
                    icon={
                      isLoading ? (
                        <IconLoader className="animate-spin" />
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
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">Check Supabase status page</span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
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
              <SupportForm
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
