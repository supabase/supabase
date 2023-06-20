import { useParams } from 'common/hooks'
import { useSelectedProject } from 'hooks'
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
  const selectedProject = useSelectedProject()

  const value = useMemo<ProjectContextType>(() => {
    if (selectedProject?.ref === projectRef) {
      return {
        project: selectedProject,
        isLoading: false,
      }
    }

    return {
      project: undefined,
      isLoading: true,
    }
  }, [selectedProject, projectRef])

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
