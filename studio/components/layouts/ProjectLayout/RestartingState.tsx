import Link from 'next/link'
import { FC, useEffect, useRef } from 'react'
import { Badge, IconLoader, IconMonitor, IconServer } from '@supabase/ui'

import { Project } from 'types'
import { API_URL } from 'lib/constants'
import { get, head } from 'lib/common/fetch'
import ShimmerLine from 'components/ui/ShimmerLine'

interface Props {
  project: Project
  autoApiService: any
}

const ProjectRestartingState: FC<Props> = ({ project, autoApiService }) => {
  const checkProjectConnectionIntervalRef = useRef<number>()

  useEffect(() => {
    if (!autoApiService) return

    // Check project connection status every 4 seconds
    checkProjectConnectionIntervalRef.current = window.setInterval(testProjectConnection, 4000)
    return () => {
      clearInterval(checkProjectConnectionIntervalRef.current)
    }
  }, [autoApiService])

  const testProjectConnection = async () => {
    const API_KEY = autoApiService?.internalApiKey
    const swaggerUrl = autoApiService?.restUrl

    const headers: any = { apikey: API_KEY }
    if (API_KEY?.length > 40) headers['Authorization'] = `Bearer ${API_KEY}`

    const { error } = await head(swaggerUrl, [], { headers, credentials: 'omit' })
    if (error === undefined) {
      clearInterval(checkProjectConnectionIntervalRef.current)
      // We force a page refresh to retrigger TestConnection because
      // there's no specific state for "RESTARTING" that TestConnection can listen to yet
      window.location.replace(`/project/${project.ref}`)
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

export default ProjectRestartingState
