import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Badge, Button } from 'ui'

import ShimmerLine from 'components/ui/ShimmerLine'
import { invalidateProjectDetailsQuery, type Project } from 'data/projects/project-detail-query'
import { setProjectPostgrestStatus } from 'data/projects/projects-query'
import pingPostgrest from 'lib/pingPostgrest'
import { Loader, Monitor, Server, ExternalLink } from 'lucide-react'

export interface ConnectingStateProps {
  project: Project
}

const ConnectingState = ({ project }: ConnectingStateProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const checkProjectConnectionIntervalRef = useRef<number>()

  useEffect(() => {
    if (!project.restUrl) return

    // Check project connection status every 4 seconds
    // pingPostgrest timeouts in 2s, wait for another 2s before checking again
    checkProjectConnectionIntervalRef.current = window.setInterval(testProjectConnection, 4000)
    return () => {
      clearInterval(checkProjectConnectionIntervalRef.current)
    }
  }, [project])

  const testProjectConnection = async () => {
    const result = await pingPostgrest(project.ref)
    if (result) {
      clearInterval(checkProjectConnectionIntervalRef.current)
      setProjectPostgrestStatus(queryClient, project.ref, 'ONLINE')
      await invalidateProjectDetailsQuery(queryClient, project.ref)
    }
  }

  return (
    <>
      <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
        <div className="mx-6 space-y-16">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
            <h1 className="text-3xl">{project.name}</h1>
            <div>
              <Badge variant="brand">
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin" size={12} />
                  <span>Connecting to project</span>
                </div>
              </Badge>
            </div>
          </div>
          <div className="flex h-[500px] items-center justify-center rounded border border-overlay bg-surface-100 p-8">
            <div className="w-[440px] space-y-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-md border">
                    <Monitor className="text-foreground-light" size={30} strokeWidth={1.5} />
                  </div>
                </div>
                <ShimmerLine active />
                <div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-md border">
                    <Server className="text-foreground-light" size={30} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-center">Connecting to {project.name}</p>
                <p className="text-center text-sm text-foreground-light">
                  If you are unable to connect after a few minutes, check your project's health to
                  verify if it's running into any resource constraints.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <Button asChild type="default">
                  <Link href={`/project/${ref}/settings/infrastructure`}>
                    Check database health
                  </Link>
                </Button>
                <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                  <Link
                    href={
                      'https://supabase.com/docs/guides/platform/troubleshooting#unable-to-connect-to-your-supabase-project'
                    }
                    className="translate-y-[1px]"
                  >
                    Troubleshooting
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConnectingState
