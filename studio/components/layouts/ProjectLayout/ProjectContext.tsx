import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
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

export const ProjectContextProvider = observer(
  ({ projectRef, children }: PropsWithChildren<ProjectContextProviderProps>) => {
    // TODO(alaister): This will eventually be replaced with a react-query query
    // once we remove mobx
    const { ui } = useStore()

    const value = useMemo<ProjectContextType>(() => {
      if (ui.selectedProject?.ref === projectRef) {
        return {
          project: ui.selectedProject,
          isLoading: false,
        }
      }

      return {
        project: undefined,
        isLoading: true,
      }
    }, [ui.selectedProject?.ref, projectRef])

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  }
)
