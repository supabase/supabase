import Link from 'next/link'
import { FC, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconLoader, IconMonitor, IconServer } from '@supabase/ui'

import { Project } from 'types'
import { headWithTimeout } from 'lib/common/fetch'
import { useStore } from 'hooks'
import ShimmerLine from 'components/ui/ShimmerLine'

interface Props {
  project: Project
}

const ProjectRestartingState: FC<Props> = ({ project }) => {
  const { app } = useStore()
  const checkProjectConnectionIntervalRef = useRef<number>()

  useEffect(() => {
    if (!project.restUrl || !project.internalApiKey) return

    // Check project connection status every 4 seconds
    checkProjectConnectionIntervalRef.current = window.setInterval(testProjectConnection, 4000)
    return () => {
      clearInterval(checkProjectConnectionIntervalRef.current)
    }
  }, [project])

  const testProjectConnection = async () => {
    const headers = {
      apikey: project.internalApiKey,
      Authorization: `Bearer ${project.internalApiKey}`,
    }
    const { error } = await headWithTimeout(project.restUrl!, [], {
      headers,
      credentials: 'omit',
      timeout: 2000,
    })
    if (error === undefined) {
      clearInterval(checkProjectConnectionIntervalRef.current)
      app.onProjectPostgrestStatusUpdated(project.id, 'ONLINE')
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full my-16 space-y-16">
      <div className="mx-6 space-y-16">
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:space-x-6 lg:items-center">
          <h1 className="text-3xl">{project.name}</h1>
          <div>
            <Badge color="brand">
              <div className="flex items-center gap-2">
                <IconLoader className="animate-spin" size={12} />
                <span>Connecting to project</span>
              </div>
            </Badge>
          </div>
        </div>
        <div className="rounded bg-scale-300 border border-scale-400 p-8 flex items-center justify-center h-[500px]">
          <div className="w-[420px] space-y-4">
            <div className="max-w-[300px] mx-auto flex items-center justify-center space-x-4 lg:space-x-8">
              <IconMonitor className="text-scale-1100" size={50} strokeWidth={1.5} />
              <ShimmerLine active />
              <IconServer className="text-scale-1100" size={50} strokeWidth={1.5} />
            </div>
            <p className="text-center">Connecting to {project.name}</p>
            <p className="text-center text-scale-1100 text-sm">
              This may take a few minutes, but if your dashboard hasn't connected within 2 minutes,
              you can open a support ticket{' '}
              <span className="text-green-1000">
                <Link href={`/support/new?ref=${project.ref}`}>here</Link>
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(ProjectRestartingState)
