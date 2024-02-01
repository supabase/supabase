import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import React from 'react'
import { cn } from 'ui'

const QueryActions = ({ sql, className }: { sql: string; className: string }) => {
  if (sql.includes('insufficient privilege')) return null

  return (
    <div className={[className, 'flex justify-end items-center'].join(' ')}>
      <CopyButton
        onClick={(e) => {
          e.stopPropagation()
        }}
        copyLabel="Copy query"
        type="default"
        text={sql}
      />
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
      <Table.tr onClick={() => setExpanded(!expanded)}>
        <Table.td>{item.rolname}</Table.td>
        <Table.td className="overflow-hidden max-w-xs">
          <p className="font-mono line-clamp-2 text-xs">{item.query}</p>
        </Table.td>
        <Table.td className="text-right">{item.calls}</Table.td>
        <Table.td className="text-right">{item.prop_total_time}</Table.td>
        <Table.td className="text-right">{item.total_time.toFixed(2)}ms</Table.td>
        <Table.td>
          <QueryActions sql={item.query} className="" />
        </Table.td>
      </Table.tr>
      <tr
        className={cn(
          {
            'h-0 opacity-0': !expanded,
            'h-4 opacity-100': expanded,
          },
          'transition-all'
        )}
      >
        {expanded && (
          <td colSpan={6} className="!p-0">
            <div className="overflow-auto p-3 max-h-[400px] bg-background-alternative-200">
              <pre className="">{item.query}</pre>
            </div>
          </td>
        )}
      </tr>
    </>
  )
}

export default ReportQueryPerformanceTableRow
