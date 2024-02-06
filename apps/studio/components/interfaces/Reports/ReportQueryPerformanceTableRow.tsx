import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import React from 'react'
import { cn } from 'ui'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import sqlTheme from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import { useTheme } from 'next-themes'
import { monokaiCustomTheme } from '@ui/components/CodeBlock/CodeBlock.utils'
import { Editor } from '@monaco-editor/react'

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
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  SyntaxHighlighter.registerLanguage('sql', sqlTheme)
  const monokaiTheme = monokaiCustomTheme(isDarkTheme)

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
