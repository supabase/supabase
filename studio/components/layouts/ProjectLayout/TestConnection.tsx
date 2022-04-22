import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { FC, ReactNode, useEffect, useState } from 'react'

import { Project } from 'types'
import { get, head } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import BuildingState from './BuildingState'
import ConnectingState from './ConnectingState'

interface Props {
  project: Project
  children: ReactNode
}

/**
 * Check project.status to show building state or error state
 *
 * TODO: how can we test project connection properly?
 * ex: the status is ACTIVE_HEALTHY but the project instance is down.
 *
 * [Joshen] As of 210422: Current testing connection by pinging postgres
 * Ideally we'd have a more specific monitoring of the project such as during restarts
 * But that will come later: https://supabase.slack.com/archives/C01D6TWFFFW/p1650427619665549
 *
 * Just note that this logic does not differentiate between a "restarting" state and
 * a "something is wrong and can't connect to project" state.
 *
 * [TODO] Next iteration should scrape long polling and just listen to the project's status
 */
const TestConnection: FC<Props> = ({ project, children }) => {
  const router = useRouter()

  // [Joshen] I'm gonna default it to true for now so that it doesn't block the UI
  // Figured this could be more of a check in the background
  const [projectProps, setProjectProps] = useState<any>()
  const [isProjectOnline, setIsProjectOnline] = useState(true)

  const isBuilding = [PROJECT_STATUS.COMING_UP, PROJECT_STATUS.RESTORING].includes(project?.status)
  const isProjectActive = project.status === PROJECT_STATUS.ACTIVE_HEALTHY

  if (isBuilding && router.asPath !== `/project/${project.ref}/building`) {
    router.push(`/project/${project.ref}/building`, undefined, { shallow: true })
  }

  if (!isProjectOnline && router.asPath !== `/project/${project.ref}`) {
    router.push(`/project/${project.ref}`, undefined, { shallow: true })
  }

  useEffect(() => {
    testProjectConnection()
  }, [project.status])

  // Ping Postgrest to check if project's DB and KPS are both online
  const testProjectConnection = async () => {
    const projectProps = await get(`${API_URL}/props/project/${project.ref}/api`)
    setProjectProps(projectProps)

    const API_KEY = projectProps?.autoApiService?.internalApiKey
    const swaggerUrl = projectProps?.autoApiService?.restUrl

    const headers: any = { apikey: API_KEY }
    if (API_KEY?.length > 40) headers['Authorization'] = `Bearer ${API_KEY}`

    const { error } = await head(swaggerUrl, [], { headers, credentials: 'omit' })
    setIsProjectOnline(error === undefined)
  }

  return (
    <>
      {!isProjectOnline ? (
        <ConnectingState project={project} />
      ) : isProjectActive ? (
        children
      ) : isBuilding ? (
        <BuildingState project={project} />
      ) : (
        <div className="w-full h-full m-4 flex flex-col items-center justify-center">
          <p className="text-scale-1100">{`Invalid project status: ${project.status}`}</p>
          <p className="text-scale-1100">
            Try refreshing your browser, or reach out to us at support@supabase.io
          </p>
        </div>
      )}
    </>
  )
}

export default observer(TestConnection)
