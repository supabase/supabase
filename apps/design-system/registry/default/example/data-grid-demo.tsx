import { Users } from 'lucide-react'
import DataGrid, { Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { cn } from 'ui'

type User = {
  id: string
  name: string
  email: string
  phone: string
}

export default function DataGridDemo() {
  const columns: Column<User>[] = [
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
        rowClass={() => {
          return cn(
            'bg-surface-75 cursor-pointer',
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell]:border-secondary [&>.rdg-cell:not(:last-child)]:border-r [&>.rdg-cell]:border-b',
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
