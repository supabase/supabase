import { useState } from 'react'
import DataGrid, { Column, useRowSelection } from 'react-data-grid'

import 'react-data-grid/lib/styles.css'

import { Checkbox_Shadcn_, cn } from 'ui'

type User = {
  id: string
  name: string
  email: string
  phone: string
}

/**
 * Render a data grid demo with selectable rows and sample user data.
 *
 * Renders a DataGrid configured with a checkbox column for per-row selection, columns for display name,
 * email, and phone, and ten hard-coded sample users. Selection state is managed internally and applied
 * to row styling.
 *
 * @returns A React element that renders the configured DataGrid with row selection and sample rows.
 */
export default function DataGridDemo() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const columns: Column<User>[] = [
    {
      key: 'checkbox',
      name: '',
      width: 50,
      resizable: false,
      headerCellClass: 'border-default border-r border-b',
      renderCell: ({ row }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isRowSelected, onRowSelectionChange] = useRowSelection()

        return (
          <div className="flex items-center justify-center h-full">
            <Checkbox_Shadcn_
              checked={isRowSelected}
              onClick={(e) => {
                e.stopPropagation()
                onRowSelectionChange({
                  row,
                  type: 'ROW',
                  checked: !isRowSelected,
                  isShiftClick: e.shiftKey,
                })
              }}
            />
          </div>
        )
      },
    },
    {
      key: 'name',
      name: 'Display name',
      minWidth: 200,
      resizable: true,
      headerCellClass: 'border-default border-r border-b',
    },
    {
      key: 'email',
      name: 'Email',
      minWidth: 250,
      resizable: true,
      headerCellClass: 'border-default border-r border-b',
    },
    {
      key: 'phone',
      name: 'Phone',
      minWidth: 150,
      resizable: true,
      headerCellClass: 'border-default border-b',
    },
  ]

  const rows: User[] = [
    {
      id: '1',
      name: 'Wallace',
      email: 'wallace@example.com',
      phone: '+44 1234 567890',
    },
    {
      id: '2',
      name: 'Gromit',
      email: 'gromit@example.com',
      phone: '+44 1234 567891',
    },
    {
      id: '3',
      name: 'Wendolene Ramsbottom',
      email: 'wendolene@example.com',
      phone: '+44 1234 567892',
    },
    {
      id: '4',
      name: 'Feathers McGraw',
      email: 'feathers@example.com',
      phone: '+44 1234 567893',
    },
    {
      id: '5',
      name: 'Preston',
      email: 'preston@example.com',
      phone: '+44 1234 567894',
    },
    {
      id: '6',
      name: 'Piella Bakewell',
      email: 'piella@example.com',
      phone: '+44 1234 567895',
    },
    {
      id: '7',
      name: 'Victor Quartermaine',
      email: 'victor@example.com',
      phone: '+44 1234 567896',
    },
    {
      id: '8',
      name: 'Lady Tottington',
      email: 'lady@example.com',
      phone: '+44 1234 567897',
    },
    {
      id: '9',
      name: 'Shaun',
      email: 'shaun@example.com',
      phone: '+44 1234 567898',
    },
    {
      id: '10',
      name: 'Hutch',
      email: 'hutch@example.com',
      phone: '+44 1234 567899',
    },
  ]

  return (
    <div className="h-full w-full flex flex-col relative min-h-[400px] rounded-md border overflow-hidden">
      <DataGrid
        className="flex-grow border-t-0 bg-dash-canvas"
        rowHeight={44}
        headerRowHeight={36}
        columns={columns}
        rows={rows}
        rowKeyGetter={(row: User) => row.id}
        rowClass={(row, idx) => {
          const isSelected = selectedRows.has(row.id)
          const isLastRow = idx === rows.length - 1
          return cn(
            'bg-surface-75',
            isSelected && 'bg-surface-200',
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell]:border-secondary [&>.rdg-cell:not(:last-child)]:border-r',
            !isLastRow && '[&>.rdg-cell]:border-b',
            '[&>.rdg-cell:nth-child(2)>div]:ml-8'
          )
        }}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
      />
    </div>
  )
}
