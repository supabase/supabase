import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, PropsWithChildren, useCallback } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { prefetchSchemas } from 'data/database/schemas-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { prefetchEntityTypes } from 'data/entity-types/entity-types-infinite-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useFlag } from 'hooks/ui/useFlag'

export function usePrefetchEditorIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const tableEditorPrefetchingEnabled = useFlag('tableEditorPrefetching')

  const [entityTypesSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  return useCallback(() => {
    if (!tableEditorPrefetchingEnabled || !project) return

    // Prefetch code
    router.prefetch(`/project/${project.ref}/editor`)

    // Prefetch data
    prefetchSchemas(queryClient, {
      projectRef: project.ref,
      connectionString: project.connectionString,
    }).catch(() => {
      // eat prefetching errors as they are not critical
    })
    prefetchEntityTypes(queryClient, {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sort: entityTypesSort,
      filterTypes: Object.values(ENTITY_TYPE),
    }).catch(() => {
      // eat prefetching errors as they are not critical
    })
  }, [entityTypesSort, project, queryClient, router])
}

type LinkProps = ComponentProps<typeof Link>

interface EditorIndexPageLinkProps extends Omit<LinkProps, 'href'> {
  projectRef?: string
  href?: LinkProps['href']
}

export function EditorIndexPageLink({
  href,
  projectRef,
  children,
  ...props
}: PropsWithChildren<EditorIndexPageLinkProps>) {
  const prefetch = usePrefetchEditorIndexPage()

  return (
    <Link href={href || `/project/${projectRef}/editor`} onMouseEnter={prefetch} {...props}>
      {children}
    </Link>
  )
}
