import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { PageSectionTitle } from 'ui-patterns/PageSection'

import { TableDetailTablePreview } from '@/components/interfaces/Database/Tables/TableDetailTablePreview'
import {
  buildSqlEditorWarehouseUrl,
  getSourceTableKey,
  getWarehouseQualifiedTableName,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import { WarehouseTableDetailMetrics } from '@/components/interfaces/Database/Warehouse/WarehouseTableDetailMetrics'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface WarehouseTableDetailPageProps {
  table: TableLike
  tableEditorUrl: string
}

export function WarehouseTableDetailPage({ table, tableEditorUrl }: WarehouseTableDetailPageProps) {
  const { ref: projectRef } = useParams()
  const tableKey = getSourceTableKey(table.schema, table.name)
  const qualifiedName = getWarehouseQualifiedTableName(tableKey)
  const sqlEditorUrl =
    projectRef !== undefined ? buildSqlEditorWarehouseUrl(projectRef, tableKey) : undefined

  return (
    <div className="flex flex-col gap-8">
      <WarehouseTableDetailMetrics table={table} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageSectionTitle className="mb-0">Preview</PageSectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            {sqlEditorUrl && (
              <Button asChild variant="default" className="w-fit shrink-0">
                <Link href={sqlEditorUrl}>Query in SQL Editor</Link>
              </Button>
            )}
            <Button asChild variant="default" className="w-fit shrink-0">
              <Link href={tableEditorUrl}>View in Table Editor</Link>
            </Button>
          </div>
        </div>

        <TableDetailTablePreview table={table} qualifiedName={qualifiedName} />
      </div>
    </div>
  )
}
