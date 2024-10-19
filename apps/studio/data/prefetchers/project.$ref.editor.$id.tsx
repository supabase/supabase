import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ComponentProps, PropsWithChildren, useCallback } from 'react'

import { getSupaTable } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ForeignKeyConstraintsData,
  prefetchForeignKeyConstraints,
} from 'data/database/foreign-key-constraints-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { Entity, prefetchEntityType } from 'data/entity-types/entity-type-query'
import { prefetchTableRows } from 'data/table-rows/table-rows-query'
import { prefetchTable, TableData } from 'data/tables/table-query'
import { useRouter } from 'next/router'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE } from 'state/table-editor'
import { prefetchEncryptedColumns } from 'data/encrypted-columns/encrypted-columns-query'

export function usePrefetchEditorTablePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  return useCallback(
    ({ id }: { id?: string }) => {
      if (!project || !id) return

      // Prefetch the code
      router.prefetch(`/project/${project.ref}/editor/${id}`)

      // Prefetch the data
      prefetchEntityType(queryClient, {
        projectRef: project.ref,
        connectionString: project.connectionString,
        id: Number(id),
      })
        .then((entity) => {
          let promises: [
            Promise<Entity | null>,
            Promise<ForeignKeyConstraintsData>,
            Promise<string[]>,
            Promise<TableData | undefined> | undefined,
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

          if (entity?.type === ENTITY_TYPE.TABLE) {
            promises[3] = prefetchTable(queryClient, {
              projectRef: project.ref,
              connectionString: project.connectionString,
              id: Number(id),
            })
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

            prefetchTableRows(queryClient, {
              queryKey: [supaTable.schema, supaTable.name],
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              table: supaTable,
              // TODO(alaister): Can these be pulled from local storage?
              sorts: [],
              filters: [],
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
  href?: LinkProps['href']
}

export function EditorTablePageLink({
  projectRef,
  id,
  children,
  href,
  ...props
}: PropsWithChildren<EditorTablePageLinkProps>) {
  const prefetch = usePrefetchEditorTablePage()

  return (
    <Link
      href={href || `/project/${projectRef}/editor/${id}`}
      onMouseEnter={() => prefetch({ id })}
      {...props}
    >
      {children}
    </Link>
  )
}
