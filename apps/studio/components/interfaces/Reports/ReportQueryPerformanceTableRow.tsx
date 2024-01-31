import { CollapsibleContent, CollapsibleTrigger } from '@ui/components/shadcn/ui/collapsible'
import Table from 'components/to-be-cleaned/Table'
import CodeEditor from 'components/ui/CodeEditor'
import CopyButton from 'components/ui/CopyButton'
import SqlEditor from 'components/ui/SqlEditor'
import React from 'react'
import { Collapsible } from 'ui'

const QueryActions = ({ sql, className }: { sql: string; className: string }) => {
  if (sql.includes('insufficient privilege')) return null

  return (
    <div className={[className, 'flex justify-end items-center'].join(' ')}>
      <CopyButton type="default" text={sql} />
    </div>
  )
}

type Props = {
  item: {
    rolname: string
    prop_total_time: number
    calls: number
    total_time: number
    query: string
  }
}

const ReportQueryPerformanceTableRow = ({ item }: Props) => {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <>
      <Collapsible asChild open={expanded} onOpenChange={setExpanded}>
        <>
          <Table.tr
            onClick={() => setExpanded(!expanded)}
            className="relative *:table-cell *:whitespace-nowrap *:h-12"
          >
            <CollapsibleTrigger asChild>
              <Table.td className="table-cell  whitespace-nowrap w-36">{item.rolname}</Table.td>
            </CollapsibleTrigger>
            <Table.td>{item.prop_total_time}</Table.td>
            <Table.td>{item.calls}</Table.td>
            <Table.td>{item.total_time.toFixed(2)}ms</Table.td>
            <Table.td className="relative w-36">
              <p className="w-96 block truncate font-mono">{item.query}</p>
            </Table.td>
            <Table.td className="">
              <QueryActions sql={item.query} className="" />
            </Table.td>
          </Table.tr>

          <CollapsibleContent asChild>
            <tr className="">
              <td colSpan={6} className="!p-0">
                <pre className="max-h-80 w-full overflow-auto bg-background-alternative-200 text-foreground text-sm break-words py-4 px-3">
                  {item.query}
                </pre>
              </td>
            </tr>
          </CollapsibleContent>
        </>
      </Collapsible>
    </>
  )
}

export default ReportQueryPerformanceTableRow
