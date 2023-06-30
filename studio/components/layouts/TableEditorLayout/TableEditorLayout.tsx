import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useParams } from 'common/hooks'
import Connecting from 'components/ui/Loading/Loading'
import NoPermission from 'components/ui/NoPermission'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { Entity } from 'data/entity-types/entity-type-query'
import { useCheckPermissions, useSelectedProject, useStore } from 'hooks'
import useEntityType from 'hooks/misc/useEntityType'
import useLatest from 'hooks/misc/useLatest'
import { useIsTableLoaded, useTableEditorStateSnapshot } from 'state/table-editor'
import ProjectLayout from '../'
import useTableRowsPrefetchWrapper from './TableEditorLayout.utils'
import TableEditorMenu from './TableEditorMenu'

export interface TableEditorLayoutProps {
  selectedSchema?: string
  selectedTable?: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: Entity) => void
  onDeleteTable: (table: Entity) => void
  onDuplicateTable: (table: Entity) => void
}

const TableEditorLayout = ({
  selectedSchema,
  selectedTable,
  onSelectSchema = noop,
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
  onDuplicateTable = noop,
  children,
}: PropsWithChildren<TableEditorLayoutProps>) => {
  const { ui, vault, meta } = useStore()
  const selectedProject = useSelectedProject()
  const router = useRouter()
  const { ref, id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const snap = useTableEditorStateSnapshot()
  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.schemas.load()
      meta.types.load()
      meta.policies.load()
      meta.publications.load()
      meta.extensions.load()
    }
  }, [ui.selectedProjectRef])

  const isLoaded = useIsTableLoaded(ref, id)

  const entity = useEntityType(id, function onNotFound(id) {
    if (ref) snap.addLoadedId(ref, id)
  })

  const prefetch = useLatest(useTableRowsPrefetchWrapper())

  useEffect(() => {
    let mounted = true

    function loadTable() {
      if (entity?.type) {
        switch (entity.type) {
          case ENTITY_TYPE.MATERIALIZED_VIEW:
            return meta.materializedViews.loadById(entity.id)

          case ENTITY_TYPE.VIEW:
            return meta.views.loadById(entity.id)

          case ENTITY_TYPE.FOREIGN_TABLE:
            return meta.foreignTables.loadById(entity.id)

          default:
            return meta.tables.loadById(entity.id)
        }
      }
    }

    loadTable()
      ?.then(async (entity: any) => {
        await prefetch.current(entity)
        return entity
      })
      .then((entity: any) => {
        if (mounted && ref) {
          snap.addLoadedId(ref, entity.id)
        }
      })
      .catch(() => {
        if (mounted && entity?.id && ref) {
          snap.addLoadedId(ref, entity.id)
        }
      })

    return () => {
      mounted = false
    }
  }, [entity?.id])

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [selectedProject?.ref, isVaultEnabled])

  if (!canReadTables) {
    return (
      <ProjectLayout>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      product="Table editor"
      selectedTable={selectedTable}
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
      {router.isReady && id !== undefined ? isLoaded ? children : <Connecting /> : children}
    </ProjectLayout>
  )
}

export default observer(TableEditorLayout)
