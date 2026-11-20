import { Card, Table, TableBody } from 'ui'

import { HookList } from './HookList'
import { HooksTableHeader } from './HooksTableHeader'

interface SchemaTableProps {
  schema: string
  filterString: string
}

export const SchemaTable = ({ schema, filterString }: SchemaTableProps) => {
  return (
    <div key={schema}>
      <div className="sticky top-0 backdrop-blur-sm backdrop-filter">
        <div className="flex items-baseline space-x-1 py-2">
          <p className="text-sm text-foreground-light">schema</p>
          <p className="text-sm">{schema}</p>
        </div>
      </div>
      <Card>
        <Table className="table-fixed">
          <HooksTableHeader />
          <TableBody>
            <HookList filterString={filterString} schema={schema} />
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
