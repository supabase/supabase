import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { FC, useEffect, ReactNode } from 'react'
import { isUndefined } from 'lodash'
import { Typography } from '@supabase/ui'

import { Project } from 'types'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import Loading from 'components/ui/Loading'
import BuildingState from 'components/to-be-cleaned/BuildingState'

interface Props {
  project: Project
  children: ReactNode
}

const TestConnection: FC<Props> = ({ project, children }) => {
  const router = useRouter()
  const { app } = useStore()

  const FETCH_PROJECT_URL = `${API_URL}/props/project/${project!.ref}`
  const { data: projectRealtime, error }: any = useSWR(FETCH_PROJECT_URL, get)

  const isBuilding = project && !['ACTIVE_HEALTHY', 'RESTORING'].includes(project.status)
  const isWaitingForConnection =
    !isBuilding && !isUndefined(error) && projectRealtime?.project?.status !== 'ACTIVE_HEALTHY'
  const isActive = !isBuilding && !isWaitingForConnection

  if (isActive) app.onProjectUpdated(projectRealtime)

  useEffect(() => {
    if (isBuilding && router.asPath !== `/project/${project.ref}/building`) {
      router.push(`/project/${project.ref}/building`)
    }
  }, [])

  useEffect(() => {
    // mutate project info cached. To ensure realtime project info is latest.
    mutate(FETCH_PROJECT_URL)
  }, [project])

  if (isWaitingForConnection) {
    return (
      <div className="w-full h-full m-4 flex flex-col items-center justify-center">
        <div className="w-32 flex items-center justify-center">
          <Loading />
        </div>
        <Typography.Text>
          {project.status === 'RESTORING' ? 'Restoring...' : 'Connecting...'}
        </Typography.Text>
      </div>
    )
  }

  if (isBuilding) return <BuildingState />

  return <>{children}</>
}

export default observer(TestConnection)
