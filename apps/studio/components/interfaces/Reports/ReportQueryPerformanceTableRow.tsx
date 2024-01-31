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
      <Table.tr
        onClick={() => setExpanded(!expanded)}
        className="expandable-tr *:flex *:items-center *:text-ellipsis *:overflow-hidden"
      >
        <Table.td className="whitespace-nowrap">{item.rolname}</Table.td>
        <Table.td>{item.prop_total_time}</Table.td>
        <Table.td>{item.calls}</Table.td>
        <Table.td>{item.total_time.toFixed(2)}ms</Table.td>
        <Table.td className="relative w-full">
          <p className="w-96 block truncate font-mono">{item.query}</p>
          <QueryActions sql={item.query} className="" />
        </Table.td>
      </Table.tr>

      <Table.td
        className={`${
          expanded ? 'h-auto opacity-100' : 'h-0 opacity-0'
        } expanded-row-content border-l border-r bg-alternative !pt-0 !pb-0 transition-all`}
        colSpan={5}
      >
        {expanded && <pre className="overflow-auto">{item.query}</pre>}
      </Table.td>
    </>
  )
}

export default ReportQueryPerformanceTableRow
