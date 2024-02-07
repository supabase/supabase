import Table from 'components/to-be-cleaned/Table'
import React from 'react'
import { cn } from 'ui'
import { Editor } from '@monaco-editor/react'

type Props = {
  sql: string
  colSpan: number
  children: React.ReactNode
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
            <div className="overflow-auto max-h-[400px] bg-background-alternative-200">
              <Editor
                className={cn('monaco-editor h-80')}
                theme={'supabase'}
                defaultLanguage="pgsql"
                value={sql}
                options={{
                  readOnly: true,
                  tabSize: 2,
                  fontSize: 13,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                }}
              />
            </div>
          </td>
        )}
      </tr>
    </>
  )
}

export default ReportQueryPerformanceTableRow
