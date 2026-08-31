import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { Footer } from '@/components/grid/components/footer/Footer'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { useTableDefinitionQuery } from '@/data/database/table-definition-query'
import { useViewDefinitionQuery } from '@/data/database/view-definition-query'
import { Entity, isTableLike, isViewLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'

export interface TableDefinitionProps {
  entity?: Entity
}

export const TableDefinition = ({ entity }: TableDefinitionProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const viewResult = useViewDefinitionQuery(
    {
      id: entity?.id,
      includeCreateStatement: true,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isViewLike(entity),
    }
  )

  const tableResult = useTableDefinitionQuery(
    {
      id: entity?.id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isTableLike(entity),
    }
  )

  const { data: definition, isLoading } = isViewLike(entity) ? viewResult : tableResult

  const formattedDefinition = useMemo(
    () => (definition ? formatSql(definition) : undefined),
    [definition]
  )

  if (isLoading) {
    return (
      <div className="h-full grid">
        <div className="p-4">
          <GenericSkeletonLoader />
        </div>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grow overflow-y-auto border-t border-muted relative">
        <Button asChild variant="default" className="absolute top-2 right-5 z-10">
          <Link
            href={`/project/${ref}/sql/new?content=${encodeURIComponent(
              formattedDefinition ?? ''
            )}`}
          >
            Open in SQL Editor
          </Link>
        </Button>

        <CodeEditor isReadOnly language="pgsql" value={formattedDefinition} />
      </div>

      <Footer />
    </>
  )
}
