import { FC, ReactNode, useState, useEffect } from 'react'
import { isUndefined } from 'lodash'
import { observer } from 'mobx-react-lite'
import { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import Error from 'components/ui/Error'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import TableEditorMenu from './TableEditorMenu'
import NoPermission from 'components/ui/NoPermission'

interface Props {
  selectedSchema?: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: PostgresTable) => void
  onDeleteTable: (table: PostgresTable) => void
  onDuplicateTable: (table: PostgresTable) => void
  children: ReactNode
}

const TableEditorLayout: FC<Props> = ({
  selectedSchema,
  onSelectSchema = () => {},
  onAddTable = () => {},
  onEditTable = () => {},
  onDeleteTable = () => {},
  onDuplicateTable = () => {},
  children,
}) => {
  const { meta, ui } = useStore()
  const { isInitialized, isLoading, error } = meta.tables

  const [loaded, setLoaded] = useState<boolean>(isInitialized)
  const canReadTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.schemas.load()
      meta.tables.load()
      meta.types.load()
      meta.policies.load()
      meta.publications.load()
    }
  }, [ui.selectedProject?.ref])

  useEffect(() => {
    let cancel = false
    if (!isLoading && !loaded) {
      if (!cancel) setLoaded(true)
    }
    return () => {
      cancel = true
    }
  }, [isLoading])

  if (!canReadTables) {
    return (
      <ProjectLayout>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayout>
    )
  }

  if (error) {
    return (
      <ProjectLayout>
        <Error error={error} />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      isLoading={!loaded || isUndefined(selectedSchema)}
      product="Table editor"
      productMenu={
        <TableEditorMenu
          selectedSchema={selectedSchema}
          onSelectSchema={onSelectSchema}
          onAddTable={onAddTable}
          onEditTable={onEditTable}
          onDeleteTable={onDeleteTable}
          onDuplicateTable={onDuplicateTable}
        />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default observer(TableEditorLayout)
