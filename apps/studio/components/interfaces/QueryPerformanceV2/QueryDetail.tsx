import { CodeBlock, cn } from 'ui'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryDetailProps {
  reportType: QUERY_PERFORMANCE_REPORT_TYPES
  selectedRow: any
}

export const QueryDetail = ({ reportType, selectedRow }: QueryDetailProps) => {
  const report = QUERY_PERFORMANCE_REPORTS[reportType]

  return (
    <div className="h-full overflow-auto pt-2 flex flex-col gap-y-8 divide-y">
      <div className="px-4 flex flex-col gap-y-2">
        <p className="text-sm">Query pattern</p>
        <CodeBlock
          value={selectedRow['query']}
          language="sql"
          className={cn(
            'max-h-[310px]',
            '!py-3 !px-3.5 prose dark:prose-dark transition',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
          )}
          hideLineNumbers
        />
      </div>
      <div className="py-4 px-4 flex flex-col gap-y-1">
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
