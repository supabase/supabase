import { PermissionAction } from '@supabase/shared-types/out/constants'
import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { ReactNode, useMemo, useState } from 'react'
import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup, Separator } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { ExplorerTabs } from '../tabs/explorer-tabs'
import { SQLEditorMenu } from './SQLEditorMenu'
import TableEditorMenu from './TableEditorMenu'

export interface ExplorerLayoutProps {
  children: ReactNode
  hideTabs?: boolean
}

export const ExplorerLayout = ({ children, hideTabs = false }: ExplorerLayoutProps) => {
  const [showOngoingQueries, setShowOngoingQueries] = useState(false)

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const productMenu = useMemo(
    () => (
      <ResizablePanelGroup direction="vertical" autoSaveId="explorer-side-panel">
        <ResizablePanel defaultSize={40}>
          <TableEditorMenu />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40}>
          <SQLEditorMenu
            key="sql-editor-menu"
            onViewOngoingQueries={() => setShowOngoingQueries(true)}
          />
        </ResizablePanel>
        <ResizableHandle />

        <div className="p-4 border-t sticky bottom-0 bg-studio">
          <Button block type="default" onClick={() => setShowOngoingQueries(true)}>
            View running queries
          </Button>
        </div>
      </ResizablePanelGroup>
    ),
    []
  )

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    <ProjectLayoutWithAuth
      product="SQL Editor"
      productMenu={productMenu}
      isBlocking={false}
      resizableSidebar
    >
      <div className="flex flex-col h-full">
        {!hideTabs && <ExplorerTabs storeKey="explorer" />}
        <div className="h-full">{children}</div>
      </div>
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </ProjectLayoutWithAuth>
  )
}
