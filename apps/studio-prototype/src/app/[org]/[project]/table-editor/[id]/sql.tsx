'use client'

import '@/src/styles/react-data-grid.css'
import 'react-data-grid/lib/styles.css'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import DataGrid, { Column } from 'react-data-grid'
import { Checkbox_Shadcn_ } from 'ui'
import FilterHeader from '../filter-header'
import Table from './table'
import SqlToolbar from './sql-toolbar'
import CodeSample from './code-sample'

// Define the type for your row data
interface Row {
  name: string
  company: string
  email: string
  phone: string
}

export default function Sql() {
  const rows: Row[] = [
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
    {
      name: 'Hines Fowler',
      company: 'BUZZNESS',
      email: 'hinesfowler@buzzness.com',
      phone: '+1 (869) 405-3127',
    },
  ]

  // Define the columns with proper types
  const columns: Column<Row>[] = [
    {
      key: 'id',
      name: '',
      width: 10,
      renderCell: ({ row }) => <Checkbox_Shadcn_ className="ml-1" />,
    },
    {
      key: 'name',
      name: 'Name',
      width: 200,
      //   renderCell: ({ row }) => <ColumnRender row={row} />,
    },
    {
      key: 'company',
      name: 'Company',
      width: 200,
      //   renderCell: ({ row }) => <ColumnRender row={row} />,
    },
    {
      key: 'email',
      name: 'Email',
      width: 200,
      //   renderCell: ({ row }) => <ColumnRender row={row} />,
    },
    {
      key: 'phone',
      name: 'Phone',
      width: 200,
      //   renderCell: ({ row }) => <ColumnRender row={row} />,
    },
  ]

  return (
    <ResizablePanelGroup direction="vertical" className="z-30">
      <ResizablePanel defaultSize={50} className="bg-surface-100">
        <CodeSample />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} className="flex flex-col">
        <SqlToolbar />
        <div className="grow h-full flex flex-col">
          <Table hideToolbar />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
