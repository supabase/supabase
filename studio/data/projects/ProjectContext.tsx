import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { Project } from 'types'
import { ProjectError, useProjectQuery } from './useProjectQuery'

type ProjectContextType = {
  project: Project | undefined
  error: ProjectError | null
  isLoading: boolean
  isError: boolean
}

const ProjectContext = createContext<ProjectContextType>({
  project: undefined,
  error: null,
  isLoading: true,
  isError: false,
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
  const { data, isLoading, isError, error } = useProjectQuery(projectRef)

  const value = useMemo<ProjectContextType>(
    () => ({
      project: data?.project,
      isLoading,
      isError,
      error,
    }),
    [data, isLoading, isError]
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
