'use client'

import '@/src/styles/react-data-grid.css'
import 'react-data-grid/lib/styles.css'

import DataGrid, { Column } from 'react-data-grid'
import { Checkbox_Shadcn_ } from 'ui'
import FilterHeader from '../filter-header'

// Define the type for your row data
interface Row {
  name: string
  company: string
  email: string
  phone: string
}

export default function Table({ hideToolbar }: { hideToolbar?: boolean }) {
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
    <>
      {!hideToolbar && <FilterHeader />}
      <DataGrid
        className="grow"
        columns={columns}
        rows={rows}
        rowHeight={24}
        headerRowHeight={32}
        //   onColumnResize={onColumnResize}
        renderers={{
          renderCheckbox: () => <input type="checkbox" />,
        }}
      />
    </>
  )
}
