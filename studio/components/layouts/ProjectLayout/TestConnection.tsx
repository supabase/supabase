import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { FC, ReactNode } from 'react'
import { Project } from 'types'
import BuildingState from 'components/to-be-cleaned/BuildingState'

interface Props {
  project: Project
  children: ReactNode
}

/**
 * Check project.status to show building state or error state
 *
 * TODO: how can we test project connection properly?
 * ex: the status is ACTIVE_HEALTHY but the project instance is down.
 */
const TestConnection: FC<Props> = ({ project, children }) => {
  const router = useRouter()
  const isBuilding = ['COMING_UP', 'RESTORING'].includes(project?.status)
  const isProjectActive = project.status === 'ACTIVE_HEALTHY'

  if (isBuilding && router.asPath !== `/project/${project.ref}/building`) {
    router.push(`/project/${project.ref}/building`, undefined, { shallow: true })
  }

  return (
    <>
      {isProjectActive ? (
        children
      ) : isBuilding ? (
        <BuildingState project={project} />
      ) : (
        <div className="w-full h-full m-4 flex flex-col items-center justify-center">
          <p>{`Invalid project status: ${project.status}`}</p>
          <p>Try refreshing your browser, or reach out to us at support@supabase.io</p>
        </div>
      )}
    </>
  )
}

export default observer(TestConnection)
