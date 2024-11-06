import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, PropsWithChildren, useCallback } from 'react'

import { loadTableEditorSortsAndFiltersFromLocalStorage } from 'components/grid/SupabaseGrid'
import {
  formatFilterURLParams,
  formatSortURLParams,
  parseSupaTable,
} from 'components/grid/SupabaseGrid.utils'
import { Filter, Sort } from 'components/grid/types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { prefetchTableRows } from 'data/table-rows/table-rows-query'
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
      prefetchTableEditor(queryClient, {
        projectRef: project.ref,
        connectionString: project.connectionString,
        id,
      }).then((entity) => {
        if (entity) {
          const supaTable = parseSupaTable(entity)

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
    [project, queryClient, roleImpersonationState.role, router, tableEditorPrefetchingEnabled]
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
