import Link from 'next/link'
import { Button } from 'ui'
import { PageSectionTitle } from 'ui-patterns/PageSection'

import { TableDetailOverviewMetrics } from '@/components/interfaces/Database/Tables/TableDetailOverviewMetrics'
import { TableDetailTablePreview } from '@/components/interfaces/Database/Tables/TableDetailTablePreview'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface TableDetailOverviewTabProps {
  table: TableLike
  tableEditorUrl: string
}

export function TableDetailOverviewTab({ table, tableEditorUrl }: TableDetailOverviewTabProps) {
  return (
    <div className="space-y-8">
      <TableDetailOverviewMetrics table={table} />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <PageSectionTitle className="mb-0">Preview</PageSectionTitle>
          <Button asChild variant="default" className="w-fit shrink-0">
            <Link href={tableEditorUrl}>View in Table Editor</Link>
          </Button>
        </div>

        <TableDetailTablePreview table={table} />
      </div>
    </div>
  )
}
