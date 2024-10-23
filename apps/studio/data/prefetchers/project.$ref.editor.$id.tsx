import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, PropsWithChildren, useCallback } from 'react'

import { loadTableEditorSortsAndFiltersFromLocalStorage } from 'components/grid/SupabaseGrid'
import {
  formatFilterURLParams,
  formatSortURLParams,
  getSupaTable,
} from 'components/grid/SupabaseGrid.utils'
import { Filter, Sort } from 'components/grid/types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ForeignKeyConstraintsData,
  prefetchForeignKeyConstraints,
} from 'data/database/foreign-key-constraints-query'
import { prefetchEncryptedColumns } from 'data/encrypted-columns/encrypted-columns-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { Entity, prefetchEntityType } from 'data/entity-types/entity-type-query'
import { ForeignTableData, prefetchForeignTable } from 'data/foreign-tables/foreign-table-query'
import {
  MaterializedViewData,
  prefetchMaterializedView,
} from 'data/materialized-views/materialized-view-query'
import { prefetchTableRows } from 'data/table-rows/table-rows-query'
import { prefetchTable, TableData } from 'data/tables/table-query'
import { prefetchView, ViewData } from 'data/views/view-query'
import { useFlag } from 'hooks/ui/useFlag'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE } from 'state/table-editor'

export function usePrefetchEditorTablePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const tableEditorPrefetchingEnabled = useFlag('tableEditorPrefetching')

  return useCallback(
    ({ id: _id, filters, sorts }: { id?: string; filters?: Filter[]; sorts?: Sort[] }) => {
      if (!tableEditorPrefetchingEnabled) return

      const id = _id ? Number(_id) : undefined
      if (!project || !id || isNaN(id)) return

      // Prefetch the code
      router.prefetch(`/project/${project.ref}/editor/${id}`)

      // Prefetch the data
      prefetchEntityType(queryClient, {
        projectRef: project.ref,
        connectionString: project.connectionString,
        id,
      })
        .then((entity) => {
          let promises: [
            Promise<Entity | null>,
            Promise<ForeignKeyConstraintsData>,
            Promise<string[]>,
            (
              | Promise<TableData | ViewData | MaterializedViewData | ForeignTableData | undefined>
              | undefined
            ),
          ] = [
            Promise.resolve(entity),
            prefetchForeignKeyConstraints(queryClient, {
              projectRef: project.ref,
              connectionString: project.connectionString,
              schema: entity?.schema,
            }),
            prefetchEncryptedColumns(queryClient, {
              projectRef: project.ref,
              connectionString: project.connectionString,
              schema: entity?.schema,
              tableName: entity?.name,
            }),
            undefined,
          ]

          switch (entity?.type) {
            case ENTITY_TYPE.TABLE:
            case ENTITY_TYPE.PARTITIONED_TABLE:
              promises[3] = prefetchTable(queryClient, {
                projectRef: project.ref,
                connectionString: project.connectionString,
                id,
              })
              break

            case ENTITY_TYPE.VIEW:
              promises[3] = prefetchView(queryClient, {
                projectRef: project.ref,
                connectionString: project.connectionString,
                id,
              })
              break

            case ENTITY_TYPE.MATERIALIZED_VIEW:
              promises[3] = prefetchMaterializedView(queryClient, {
                projectRef: project.ref,
                connectionString: project.connectionString,
                id,
              })
              break

            case ENTITY_TYPE.FOREIGN_TABLE:
              promises[3] = prefetchForeignTable(queryClient, {
                projectRef: project.ref,
                connectionString: project.connectionString,
                id,
              })
              break
          }

          return Promise.all(promises)
        })
        .then(([entity, foreignKeyConstraints, encryptedColumns, table]) => {
          if (entity && table) {
            const supaTable = getSupaTable({
              selectedTable: table,
              encryptedColumns,
              foreignKeyMeta: foreignKeyConstraints,
              entityType: entity.type,
            })

            const { sorts: localSorts = [], filters: localFilters = [] } =
              loadTableEditorSortsAndFiltersFromLocalStorage(
                project.ref,
                entity.name,
                entity.schema
              ) ?? {}

            prefetchTableRows(queryClient, {
              queryKey: [supaTable.schema, supaTable.name],
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              table: supaTable,
              sorts: sorts ?? formatSortURLParams(supaTable.name, localSorts),
              filters: filters ?? formatFilterURLParams(localFilters),
              page: 1,
              limit: TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE,
              impersonatedRole: roleImpersonationState.role,
            })
          }
        })
    },
    [project, queryClient, router]
  )
}

type LinkProps = ComponentProps<typeof Link>

interface EditorTablePageLinkProps extends Omit<LinkProps, 'href'> {
  projectRef?: string
  id?: string
  sorts?: Sort[]
  filters?: Filter[]
  href?: LinkProps['href']
}

export function EditorTablePageLink({
  projectRef,
  id,
  sorts,
  filters,
  href,
  children,
  ...props
}: PropsWithChildren<EditorTablePageLinkProps>) {
  const prefetch = usePrefetchEditorTablePage()

  return (
    <Link
      href={href || `/project/${projectRef}/editor/${id}`}
      onMouseEnter={() => prefetch({ id, sorts, filters })}
      {...props}
    >
      {children}
    </Link>
  )
}
