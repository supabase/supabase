import { FC } from 'react'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import TriggerList from './TriggerList'

interface Props {
  filterString: string
  schema: string
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const SchemaTable: FC<Props> = ({ filterString, schema, editTrigger, deleteTrigger }) => {
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
            <Table.th key="name" className="space-x-4">
              Name
            </Table.th>
            <Table.th key="table" className="hidden lg:table-cell">
              Table
            </Table.th>
            <Table.th key="function" className="hidden xl:table-cell">
              Function
            </Table.th>
            <Table.th key="rows" className="hidden xl:table-cell xl:w-1/3">
              Events
            </Table.th>
            <Table.th key="buttons" className="w-1/12"></Table.th>
          </>
        }
        body={
          <TriggerList
            filterString={filterString}
            schema={schema}
            editTrigger={editTrigger}
            deleteTrigger={deleteTrigger}
          />
        }
      />
    </div>
  )
}
export default observer(SchemaTable)
