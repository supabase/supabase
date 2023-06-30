import { useParams } from 'common/hooks'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { PROJECT_STATUS } from 'lib/constants'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { Project } from 'types'

type ProjectContextType = {
  project: Project | undefined
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType>({
  project: undefined,
  isLoading: true,
})

export default ProjectContext

export const useProjectContext = () => useContext(ProjectContext)

type ProjectContextProviderProps = {
  projectRef: string | undefined
}

export const ProjectContextProvider = ({
  projectRef,
  children,
}: PropsWithChildren<ProjectContextProviderProps>) => {
  const { data: selectedProject, isLoading } = useProjectDetailQuery({ ref: projectRef })

  const value = useMemo<ProjectContextType>(() => {
    return {
      project: selectedProject,
      isLoading: isLoading,
    }
  }, [selectedProject, isLoading])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export const ProjectContextFromParamsProvider = ({ children }: PropsWithChildren<{}>) => {
  const { ref: projectRef } = useParams()

  return <ProjectContextProvider projectRef={projectRef}>{children}</ProjectContextProvider>
}

export const useIsProjectActive = () => {
  const { project } = useProjectContext()
  return project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
}
