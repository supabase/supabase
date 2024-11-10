import { PermissionAction } from '@supabase/shared-types/out/constants'
import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { ReactNode, useMemo, useState } from 'react'
import { Button, Separator, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import TableEditorMenu from './TableEditorMenu'
import { SQLEditorMenu } from './SQLEditorMenu'
import { ExplorerTabs } from '../tabs/explorer-tabs'
import { SQLStatementsViewer } from './sql-statements-viewer'

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
      <>
        <TableEditorMenu />
        <Separator />
        <SQLEditorMenu
          key="sql-editor-menu"
          onViewOngoingQueries={() => setShowOngoingQueries(true)}
        />
        <div className="p-4 border-t sticky bottom-0 bg-studio">
          <Button block type="default" onClick={() => setShowOngoingQueries(true)}>
            View running queries
          </Button>
        </div>
      </>
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
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70}>
            <div className="h-full">{children}</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30}>
            <div className="bg-black h-full">
              <SQLStatementsViewer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </ProjectLayoutWithAuth>
  )
}
