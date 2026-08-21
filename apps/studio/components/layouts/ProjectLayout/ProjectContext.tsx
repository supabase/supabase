import { PropsWithChildren } from 'react'

import { DatabaseSelectorStateContextProvider } from '@/state/database-selector'
import { RoleImpersonationStateContextProvider } from '@/state/role-impersonation-state'
import { SqlEditorSaveCoordinatorProvider } from '@/state/sql-editor/sql-editor-save-coordinator'
import { TableEditorStateContextProvider } from '@/state/table-editor'
import { TabsStateContextProvider } from '@/state/tabs'

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
        <DatabaseSelectorStateContextProvider key={`database-selector-state-${projectRef}`}>
          <RoleImpersonationStateContextProvider key={`role-impersonation-state-${projectRef}`}>
            <SqlEditorSaveCoordinatorProvider>{children}</SqlEditorSaveCoordinatorProvider>
          </RoleImpersonationStateContextProvider>
        </DatabaseSelectorStateContextProvider>
      </TabsStateContextProvider>
    </TableEditorStateContextProvider>
  )
}
