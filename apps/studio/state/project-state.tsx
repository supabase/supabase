import { PropsWithChildren, createContext, useCallback, useContext } from 'react'
import { proxy, snapshot, useSnapshot } from 'valtio'

import { useConstant } from 'common'

export function createProjectState() {
  const projectState = proxy({
    selectedDatabaseId: undefined as string | undefined,
    setSelectedDatabaseId: (id: string | undefined) => {
      projectState.selectedDatabaseId = id
    },
  })

  return projectState
}

export type ProjectState = ReturnType<typeof createProjectState>

export const ProjectStateContext = createContext<ProjectState>(createProjectState())

export const ProjectStateContextProvider = ({ children }: PropsWithChildren) => {
  const state = useConstant(createProjectState)

  return <ProjectStateContext.Provider value={state}>{children}</ProjectStateContext.Provider>
}

export function useProjectStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const projectState = useContext(ProjectStateContext)
  return useSnapshot(projectState, options)
}

// Helper methods
export function useGetSelectedDatabaseId() {
  const projectState = useContext(ProjectStateContext)
  return useCallback(() => snapshot(projectState).selectedDatabaseId, [projectState])
}
