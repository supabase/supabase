import { Users } from 'lucide-react'
import DataGrid, { Column } from 'react-data-grid'

import 'react-data-grid/lib/styles.css'

import { cn } from 'ui'

/**
 * Renders a DataGrid configured to display an empty "no users" state.
 *
 * The grid includes three columns (Display name, Email, Phone) and no rows, and supplies a centered overlay with an icon and explanatory text when there are no rows.
 *
 * @returns A React element containing the configured DataGrid with an empty-state fallback UI.
 */
export default function DataGridEmptyState() {
  const columns: Column<{ id: string; name: string; email: string }>[] = [
    { key: 'name', name: 'Display name', minWidth: 200, resizable: true },
    { key: 'email', name: 'Email', minWidth: 250, resizable: true },
    { key: 'phone', name: 'Phone', minWidth: 150, resizable: true },
  ]

  const rows: { id: string; name: string; email: string }[] = []

  return (
    <div className="h-full w-full flex flex-col relative min-h-[400px] rounded-md border overflow-hidden">
      <DataGrid
        className="flex-grow border-t-0 bg-dash-canvas"
        rowHeight={44}
        headerRowHeight={36}
        columns={columns}
        rows={rows}
        rowKeyGetter={(row: { id: string; name: string; email: string }) => row.id}
        rowClass={() => {
          return cn(
            'bg-surface-200 cursor-pointer',
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-8'
          )
        }}
        renderers={{
          noRowsFallback: (
            <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
              <Users className="text-foreground-lighter" strokeWidth={1} />
              <div className="text-center">
                <p className="text-foreground">No users in your project</p>
                <p className="text-foreground-light">
                  There are currently no users who signed up to your project
                </p>
              </div>
            </div>
          ),
        }}
      />
    </div>
  )
}
