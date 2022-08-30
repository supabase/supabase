import { FC } from 'react'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import HookList from './HookList'

interface Props {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const SchemaTable: FC<Props> = ({
  schema,
  filterString,
  editHook = () => {},
  deleteHook = () => {},
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
            <Table.th key="name" className="space-x-4">
              Name
            </Table.th>
            <Table.th key="table" className="hidden lg:table-cell">
              Table
            </Table.th>
            <Table.th key="events" className="hidden xl:table-cell">
              Events
            </Table.th>
            <Table.th key="webhook" className="hidden xl:table-cell">
              Webhook
            </Table.th>
            <Table.th key="buttons" className="w-1/6"></Table.th>
          </>
        }
        body={
          <HookList
            filterString={filterString}
            schema={schema}
            editHook={editHook}
            deleteHook={deleteHook}
          />
        }
      />
    </div>
  )
}

export default observer(SchemaTable)
