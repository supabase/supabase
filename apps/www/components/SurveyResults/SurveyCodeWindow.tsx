import React from 'react'
import { cn } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import type { LANG } from '~/components/CodeBlock/CodeBlock'
import { FilterDropdown } from './FilterDropdown'

interface Props {
  code: any
  lang?: LANG
  className?: string
  style?: React.CSSProperties
  showLineNumbers?: boolean
  filters?: Record<string, any>
  activeFilters?: Record<string, string>
  setFilterValue?: (filterKey: string, value: string) => void
}

export const SurveyCodeWindow = ({
  code,
  lang,
  style,
  className,
  showLineNumbers,
  filters,
  activeFilters,
  setFilterValue,
}: Props) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl shadow-lg p-2 pt-0 w-full h-full bg-alternative-200 border flex flex-col',
        className
      )}
      style={style}
    >
      <div className="w-full px-2 py-3 relative flex items-center gap-1.5 lg:gap-2">
        <div className="w-2 h-2 bg-border rounded-full" />
        <div className="w-2 h-2 bg-border rounded-full" />
        <div className="w-2 h-2 bg-border rounded-full" />
      </div>
      <div className="h-full w-full rounded-lg flex flex-col">
        {filters && activeFilters && setFilterValue && (
          <div className="flex flex-wrap gap-4 p-4 border-b border-border">
            {Object.entries(filters).map(([filterKey, filterConfig]) => (
              <div key={filterKey} className="flex items-center gap-2">
                <span className="text-sm font-medium">{filterConfig.label}:</span>
                <FilterDropdown
                  filterKey={filterKey}
                  filterConfig={filterConfig}
                  selectedValue={activeFilters[filterKey]}
                  setFilterValue={setFilterValue}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 p-4">
          <CodeBlock lang={lang ?? 'js'} size="small" showLineNumbers={showLineNumbers}>
            {code}
          </CodeBlock>
        </div>
      </div>
    </div>
  )
}
