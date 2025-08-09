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
    <CodeBlock lang={lang ?? 'js'} showLineNumbers={showLineNumbers}>
      {code}
    </CodeBlock>
  )
}
