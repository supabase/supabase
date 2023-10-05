import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import HookList from './HookList'

interface SchemaTableProps {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const SchemaTable = ({
  schema,
  filterString,
  editHook = noop,
  deleteHook = noop,
}: SchemaTableProps) => {
  return (
    <div key={schema} className="">
      <div className="sticky top-0 backdrop-blur backdrop-filter">
        <div className="flex items-baseline space-x-1 py-2">
          <h5 className="text-foreground-light">schema</h5>
          <h4>{schema}</h4>
        </div>
      </div>
      <Table
        className="table-fixed"
        head={
          <>
            <Table.th key="name" className="w-[20%]">
              <p className="translate-x-[36px]">Name</p>
            </Table.th>
            <Table.th key="table" className="w-[15%] hidden lg:table-cell">
              Table
            </Table.th>
            <Table.th key="events" className="w-[24%] hidden xl:table-cell">
              Events
            </Table.th>
            <Table.th key="webhook" className="hidden xl:table-cell">
              Webhook
            </Table.th>
            <Table.th key="buttons" className="w-[5%]"></Table.th>
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
