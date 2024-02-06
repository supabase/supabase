import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import React from 'react'
import { cn } from 'ui'

type Props = {
  sql: string
  colSpan: number
  children: React.ReactNode
}

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

const ReportQueryPerformanceTableRow = ({ sql, colSpan, children }: Props) => {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <>
      <Table.tr onClick={() => setExpanded(!expanded)}>{children}</Table.tr>
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
          <td colSpan={colSpan} className="!p-0 max-w-xl relative">
            <div className="absolute right-2 top-2">
              <QueryActions sql={sql} className="mb-2" />
            </div>
            <div className="overflow-auto p-3 px-6 max-h-[400px] bg-background-alternative-200">
              <pre>{sql}</pre>
            </div>
          </td>
        )}
      </tr>
    </>
  )
}

export default ReportQueryPerformanceTableRow
