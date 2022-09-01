import { FC } from 'react'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import FunctionList from './FunctionList'

interface Props {
  schema: string
  filterString: string
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const SchemaTable: FC<Props> = ({
  schema,
  filterString,
  editFunction = () => {},
  deleteFunction = () => {},
}) => {
  return (
    <div key={schema} className="">
      <div className="sticky top-0 backdrop-blur backdrop-filter">
        <div className="flex items-baseline space-x-1 py-2 px-6">
          <h5 className="text-scale-1000">schema</h5>
          <h4>{schema}</h4>
        </div>
      </div>
      <Table
        className="table-fixed px-6"
        head={
          <>
            <Table.th key="name" className="w-1/3 space-x-4">
              Name
            </Table.th>
            <Table.th key="arguments" className="hidden md:table-cell">
              Arguments
            </Table.th>
            <Table.th key="return_type" className="hidden lg:table-cell">
              Return type
            </Table.th>
            <Table.th key="buttons" className="w-1/6"></Table.th>
          </>
        }
        body={
          <FunctionList
            schema={schema}
            filterString={filterString}
            editFunction={editFunction}
            deleteFunction={deleteFunction}
          />
        }
      />
    </div>
  )
}

export default observer(SchemaTable)
