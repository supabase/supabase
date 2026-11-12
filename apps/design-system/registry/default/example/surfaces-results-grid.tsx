'use client'

import { toast } from 'sonner'
import { QueryResultsGrid } from 'surfaces/query'

import { companies, companiesTable } from './surfaces-sample-data'

export default function SurfacesResultsGrid() {
  return (
    <div className="max-h-80 w-full overflow-auto rounded-md border">
      <QueryResultsGrid
        rows={companies}
        columns={companiesTable.columns.map((column) => column.name)}
        table={companiesTable}
        canEdit
        onEditRow={(row) => toast(`Edit ${row.name}`)}
      />
    </div>
  )
}
