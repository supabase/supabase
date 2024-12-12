import { PermissionAction } from '@supabase/shared-types/out/constants'
import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { PropsWithChildren, useMemo, useState } from 'react'
import { EditorBaseLayout } from '../editors/editor-base-layout'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import TableEditorMenu from './TableEditorMenu'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const [showOngoingQueries, setShowOngoingQueries] = useState(false)
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    // <EditorBaseLayout
    //   product="Table Editor"
    //   productMenu={<TableEditorMenu />}
    //   isBlocking={false}
    //   resizableSidebar
    // >
    <>
      {children}
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </>
    // </EditorBaseLayout>
  )
}

export default TableEditorLayout
