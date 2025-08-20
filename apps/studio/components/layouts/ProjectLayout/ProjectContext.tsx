import { PropsWithChildren } from 'react'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { AiAssistantStateContextProvider } from 'state/ai-assistant-state'
import { DatabaseSelectorStateContextProvider } from 'state/database-selector'
import { RoleImpersonationStateContextProvider } from 'state/role-impersonation-state'
import { StorageExplorerStateContextProvider } from 'state/storage-explorer'
import { TableEditorStateContextProvider } from 'state/table-editor'
import { TabsStateContextProvider } from 'state/tabs'

type ProjectContextProviderProps = {
  projectRef: string | undefined
}

export const ProjectContextProvider = ({
  projectRef,
  children,
}: PropsWithChildren<ProjectContextProviderProps>) => {
  return (
    <TableEditorStateContextProvider key={`table-editor-state-${projectRef}`}>
      <TabsStateContextProvider key={`tabs-state-${projectRef}`}>
        <AiAssistantStateContextProvider key={`ai-assistant-state-${projectRef}`}>
          <StorageExplorerStateContextProvider key={`storage-explorer-state-${projectRef}`}>
            <DatabaseSelectorStateContextProvider key={`database-selector-state-${projectRef}`}>
              <RoleImpersonationStateContextProvider key={`role-impersonation-state-${projectRef}`}>
                {children}
              </RoleImpersonationStateContextProvider>
            </DatabaseSelectorStateContextProvider>
          </StorageExplorerStateContextProvider>
        </AiAssistantStateContextProvider>
      </TabsStateContextProvider>
    </TableEditorStateContextProvider>
  )
}

export const useIsProjectActive = () => {
  const { data: project } = useSelectedProjectQuery()
  return project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
}
