import { CodeBlock, cn } from 'ui'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'
import { format } from 'sql-formatter'
import { useEffect, useState } from 'react'

interface QueryDetailProps {
  reportType: QUERY_PERFORMANCE_REPORT_TYPES
  selectedRow: any
}

export const QueryDetail = ({ reportType, selectedRow }: QueryDetailProps) => {
  const report = QUERY_PERFORMANCE_REPORTS[reportType]
  const [query, setQuery] = useState(selectedRow?.['query'])

  useEffect(() => {
    if (selectedRow !== undefined) {
      try {
        const formattedQuery = format(selectedRow['query'], {
          language: 'postgresql',
          keywordCase: 'lower',
        })
        setQuery(formattedQuery)
      } catch (err) {
        setQuery(selectedRow['query'])
      }
    }
  }, [selectedRow])

  return (
    <div className="flex flex-col gap-y-8 divide-y">
      <div className="px-5 flex flex-col gap-y-2">
        <p className="text-sm">Query pattern</p>
        <CodeBlock
          hideLineNumbers
          value={query}
          language="sql"
          className={cn(
            'max-w-full max-h-[310px]',
            '!py-3 !px-3.5 prose dark:prose-dark transition',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
          )}
        />
      </div>
      <div className="py-4 px-5 flex flex-col gap-y-1">
        {report
          .filter((x) => x.id !== 'query')
          .map((x) => {
            const isTime = x.name.includes('time')
            const formattedValue = isTime
              ? `${selectedRow[x.id].toFixed(2)}ms`
              : String(selectedRow[x.id])
            return (
              <div key={x.id} className="flex gap-x-2">
                <p className="text-foreground-lighter text-sm w-32">{x.name}</p>
                <p className="text-sm w-32">{formattedValue}</p>
              </div>
            )
          })}
      </div>
    </div>
  )
}
