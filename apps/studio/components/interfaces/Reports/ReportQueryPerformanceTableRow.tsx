import Table from 'components/to-be-cleaned/Table'
import React from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  cn,
} from 'ui'
import { Editor } from '@monaco-editor/react'
import { isIndexSuggestionNeeded } from './Reports.utils'
import { Sparkle, Sparkles } from 'lucide-react'

type Props = {
  sql: string
  colSpan: number
  children: React.ReactNode
}

const ReportQueryPerformanceTableRow = ({ sql, colSpan, children }: Props) => {
  const [expanded, setExpanded] = React.useState(false)
  console.log({ sql })
  const suggestIndex = isIndexSuggestionNeeded(sql)
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

              {suggestIndex && (
                <div className="p-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="text" className="bg-yellow-50">
                        <span className="flex items-center gap-2 px-3">
                          <Sparkles strokeWidth={1} size={15} /> View index suggestions
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={cn('sm:max-w-5xl p-0')}>
                      <DialogHeader className="pb-0">
                        <DialogTitle>View suggestions</DialogTitle>
                        <DialogDescription>Speed up your queries with indexes</DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </td>
        )}
      </tr>
    </>
  )
}

export default ReportQueryPerformanceTableRow
