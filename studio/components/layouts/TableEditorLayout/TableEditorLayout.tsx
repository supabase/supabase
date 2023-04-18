import { PropsWithChildren, useEffect } from 'react'
import { useRouter } from 'next/router'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { Entity } from 'data/entity-types/entity-type-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useIsTableLoaded, useTableEditorStateSnapshot } from 'state/table-editor'
import ProjectLayout from '../'
import TableEditorMenu from './TableEditorMenu'
import NoPermission from 'components/ui/NoPermission'
import useEntityType from 'hooks/misc/useEntityType'
import Connecting from 'components/ui/Loading/Loading'
import useLatest from 'hooks/misc/useLatest'
import useTableRowsPrefetchWrapper from './TableEditorLayout.utils'

export interface TableEditorLayoutProps {
  selectedSchema?: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: Entity) => void
  onDeleteTable: (table: Entity) => void
  onDuplicateTable: (table: Entity) => void
}

const TableEditorLayout = ({
  selectedSchema,
  onSelectSchema = noop,
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
  onDuplicateTable = noop,
  children,
}: PropsWithChildren<TableEditorLayoutProps>) => {
  const { vault, meta, ui } = useStore()
  const router = useRouter()
  const { ref, id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const snap = useTableEditorStateSnapshot()
  const canReadTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.schemas.load()
      meta.types.load()
      meta.policies.load()
      meta.publications.load()
      meta.extensions.load()
    }
  }, [ui.selectedProject?.ref])

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
  }, [ui.selectedProject?.ref, isVaultEnabled])

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
