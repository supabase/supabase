'use client'

import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { motion } from 'framer-motion'
import { ChevronsUpDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { useAccent } from './accent-context'
import { useSurveyDataCache, type ChartDataItem } from './survey-data-context'
import TwoOptionToggle from './TwoOptionToggle'
import { rpcNameForYear, useYear, type SurveyYear } from './year-context'

// Sentinel for “no filter”
const NO_FILTER = 'unset'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  label: string
  options: FilterOption[]
}

interface Filters {
  [key: string]: FilterConfig
}

interface FilterColumnConfig {
  label: string
  options: string[]
}

// Sometimes the label doesn't match the value, so we need to map them
// Also, our options aren't always in a predicatable order, so we need to map them too
const FILTER_COLUMN_CONFIGS: Record<string, FilterColumnConfig> = {
  team_size: {
    label: 'Team Size',
    options: ['1–10', '11–50', '51–100', '101–250', '250+'],
  },
  money_raised: {
    label: 'Money Raised',
    options: ['USD $0–10M', 'USD $11–50M', 'USD $51–100M', 'USD $100M+'],
  },
  person_age: {
    label: 'Age',
    options: ['18–21', '22–29', '30–39', '40–49', '50–59', '60+'],
  },
  location: {
    label: 'Location',
    options: [
      'Africa',
      'Asia',
      'Europe',
      'Middle East',
      'North America',
      'South America',
      'Remote',
    ],
  },
}

function useFilterOptions(filterColumns: string[]) {
  // Build filters synchronously since everything is predefined
  const filters: Filters = {}

  for (const column of filterColumns) {
    const config = FILTER_COLUMN_CONFIGS[column]

    if (!config) {
      console.warn(`No configuration found for filter column: ${column}`)
      continue
    }

    filters[column] = {
      label: config.label,
      options: config.options.map((option) => ({ value: option, label: option })),
    }
  }

  return { filters }
}

interface SurveyChartProps {
  title: string
  targetColumn: string
  filterColumns: string[]
  generateSQLQuery?: (activeFilters: Record<string, string>) => string
  /**
   * Base RPC name without a year suffix (e.g. `get_role_stats`). The chart
   * appends `_<year>` based on the active year context.
   */
  functionName: string
  /**
   * Year in which this question was first asked. When the user views an
   * earlier year, the chart shows a "new question" empty state instead of
   * fetching.
   */
  newInYear?: SurveyYear
}

export function SurveyChart({
  title,
  targetColumn, // Used for SQL query generation when generateSQLQuery is provided
  filterColumns,
  generateSQLQuery,
  functionName,
  newInYear,
}: SurveyChartProps) {
  const { year } = useYear()
  const isAvailableForYear = !newInYear || year >= newInYear
  const resolvedFunctionName = rpcNameForYear(functionName, year)
  const { get, fetchAndCache } = useSurveyDataCache()
  const accent = useAccent()
  const accentBg = 'hsl(var(--brand-300))'
  const accentBarFg = 'bg-brand'
  const accentBarText = 'text-brand-link dark:text-brand'

  // Each chart uses a subset of available filters, defined below
  const { filters } = useFilterOptions(filterColumns)

  // Start with all filters unset (showing "all")
  const [activeFilters, setActiveFilters] = useState(
    filterColumns.reduce(
      (acc: Record<string, string>, col: string) => ({ ...acc, [col]: NO_FILTER }),
      {}
    )
  )

  // Build function parameters based on filterColumns
  const buildFunctionParams = useCallback((filterValues: Record<string, string>) => {
    const params: Record<string, any> = {}
    if (filterValues.person_age && filterValues.person_age !== NO_FILTER) {
      params.person_age_filter = [filterValues.person_age]
    }
    if (filterValues.location && filterValues.location !== NO_FILTER) {
      params.location_filter = [filterValues.location]
    }
    if (filterValues.money_raised && filterValues.money_raised !== NO_FILTER) {
      params.money_raised_filter = [filterValues.money_raised]
    }
    if (filterValues.team_size && filterValues.team_size !== NO_FILTER) {
      params.team_size_filter = [filterValues.team_size]
    }
    return params
  }, [])

  const params = useMemo(
    () => buildFunctionParams(activeFilters),
    [activeFilters, buildFunctionParams]
  )

  const cached = isAvailableForYear ? get(resolvedFunctionName, params) : undefined
  const [chartData, setChartData] = useState<ChartDataItem[]>(cached ?? [])
  const [isLoading, setIsLoading] = useState<boolean>(!cached && isAvailableForYear)
  const [dataError, setDataError] = useState<string | null>(null)

  // Sync data with cache + on-demand fetch when year/filters change
  useEffect(() => {
    if (!isAvailableForYear) {
      setChartData([])
      setIsLoading(false)
      setDataError(null)
      return
    }

    const next = get(resolvedFunctionName, params)
    if (next) {
      setChartData(next)
      setIsLoading(false)
      setDataError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setDataError(null)
    fetchAndCache(resolvedFunctionName, params)
      .then((data) => {
        if (cancelled) return
        setChartData(data)
        setIsLoading(false)
      })
      .catch((err: any) => {
        if (cancelled) return
        setDataError(err?.message ?? 'Error fetching data')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [resolvedFunctionName, params, isAvailableForYear, get, fetchAndCache])

  const [view, setView] = useState<'chart' | 'sql'>('chart')

  // Handle both view change and expansion via a wrapper function
  const handleViewChange = (newView: 'chart' | 'sql') => {
    setView(newView)
    setIsExpanded(true)
  }

  const setFilterValue = (filterKey: string, value: string) => {
    setActiveFilters((prev: Record<string, string>) => ({
      ...prev,
      [filterKey]: value,
    }))
  }

  // Find the maximum value for scaling the bars
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((item) => item.value)) : 0

  // State for expand/collapse button
  const [isExpanded, setIsExpanded] = useState(false)

  // Fixed height for all states (loading, error, loaded collapsed)
  const FIXED_HEIGHT = 300 // px
  const BUTTON_AREA_HEIGHT = 40 // px
  const CHART_HEIGHT = FIXED_HEIGHT - BUTTON_AREA_HEIGHT // px

  return (
    <div
      className="w-full bg-200 border-t border-muted"
      style={{
        background: `radial-gradient(circle at center -150%, ${accentBg}, transparent 80%), radial-gradient(ellipse at center 230%, hsl(var(--background-surface-200)), transparent 75%)`,
      }}
    >
      <header className="px-8 py-8">
        <p className="text-foreground/30 text-sm font-mono uppercase tracking-widest">Q&A</p>
        <h3 className="text-foreground text-xl tracking-tight text-balance">{title}</h3>
      </header>

      <div>
        {/* Filters and toggle */}
        <div className="flex flex-row flex-wrap gap-6 px-8 pb-4 justify-between">
          {filters && activeFilters && setFilterValue && (
            <div className="flex flex-wrap gap-3">
              {Object.entries(filters).map(([filterKey, filterConfig]) => (
                <SurveyFilter
                  key={filterKey}
                  filterKey={filterKey}
                  filterConfig={filterConfig}
                  selectedValue={activeFilters[filterKey]}
                  setFilterValue={setFilterValue}
                />
              ))}
            </div>
          )}
          <div className="hidden xs:block">
            <TwoOptionToggle
              options={['SQL', 'chart']}
              activeOption={view}
              onClickOption={handleViewChange}
              borderOverride="border-overlay"
            />
          </div>
        </div>
        <motion.div
          key={view} // Force a re-render when view changes
          className="overflow-hidden relative"
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : `${FIXED_HEIGHT}px`,
          }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
          }}
        >
          {!isAvailableForYear ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 px-8 text-center">
              <p className="text-foreground-light text-balance">
                This question was added to the {newInYear} survey.
              </p>
              <p className="text-foreground-lighter text-sm text-balance">
                Switch the year to {newInYear} to view results.
              </p>
            </div>
          ) : dataError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-danger">Error: {dataError}</p>
            </div>
          ) : view === 'chart' ? (
            <div
              className={`flex flex-col h-full w-full justify-between px-8 pt-4 pb-12 min-h-[300px] transition-opacity ${
                isLoading && chartData.length === 0 ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {chartData.length > 0 ? (
                <div
                  className="flex flex-col gap-10"
                  style={{ height: isExpanded ? 'auto' : `${CHART_HEIGHT}px` }}
                >
                  {chartData.map((item, index) => (
                    <div
                      key={`${resolvedFunctionName}-${index}-${item.label}`}
                      className="flex flex-col"
                    >
                      {/* Text above the bar */}
                      <div
                        className={`mb-2 flex flex-row justify-between text-sm font-mono uppercase tracking-widest tabular-nums transition-colors duration-300 ${
                          item.value === maxValue ? accentBarText : 'text-foreground'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span>{item.value < 1 ? '<1%' : `${item.value}%`}</span>
                      </div>

                      {/* Progress bar */}
                      <div
                        className="h-4 relative overflow-hidden"
                        style={
                          {
                            '--bar-value': item.value,
                            '--reference': maxValue,
                          } as React.CSSProperties
                        }
                      >
                        {/* Background pattern for the entire bar */}
                        <div
                          className="absolute inset-0 pointer-events-none bg-foreground-muted/60"
                          style={{
                            maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
                            maskSize: '4px',
                            maskRepeat: 'repeat',
                            maskPosition: 'center',
                          }}
                        />

                        {/* Filled portion of the bar */}
                        <div
                          className="h-full relative bg-surface-100"
                          style={{
                            width: `calc(max(0.5%, (var(--bar-value) / 100) * 100%))`,
                          }}
                        >
                          {/* Foreground pattern for the filled portion */}
                          <div
                            className={`absolute inset-0 pointer-events-none ${item.value === maxValue ? accentBarFg : 'bg-foreground-light'}`}
                            style={{
                              maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
                              maskSize: '4px',
                              maskRepeat: 'repeat',
                              maskPosition: 'top left',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 pt-8 flex flex-col items-center justify-center gap-4">
                  <p className="text-foreground-lighter text-balance text-center">
                    No responses match those filters. Maybe next year?
                  </p>
                  <Button
                    variant="primary"
                    size="tiny"
                    onClick={() =>
                      setActiveFilters(
                        filterColumns.reduce(
                          (acc: Record<string, string>, col: string) => ({
                            ...acc,
                            [col]: NO_FILTER,
                          }),
                          {}
                        )
                      )
                    }
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-8 pt-4 pb-8">
              {generateSQLQuery ? (
                <CodeBlock lang="sql">{generateSQLQuery(activeFilters)}</CodeBlock>
              ) : (
                <CodeBlock lang="ts">
                  {`// Function call: ${resolvedFunctionName}(${JSON.stringify(buildFunctionParams(activeFilters), null, 2)})`}
                </CodeBlock>
              )}
            </div>
          )}

          {/* Expand button overlay - only show for chart view */}
          {view === 'chart' && !isExpanded && !dataError && chartData.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-linear-to-b from-transparent to-background">
              <Button
                variant="default"
                size="tiny"
                onClick={() => setIsExpanded(true)}
                className="shadow-xs"
              >
                Show more
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Helper to build SQL WHERE clauses from active filters
// Accepts optional initialClauses for charts that need extra constraints
// (e.g., "column IS NOT NULL")
// Note: This function is used by chart components that generate SQL queries
export function buildWhereClause(
  activeFilters: Record<string, string>,
  initialClauses: string[] = []
) {
  const whereClauses: string[] = [...initialClauses]

  for (const [column, value] of Object.entries(activeFilters)) {
    if (value && value !== NO_FILTER) {
      whereClauses.push(`${column} = '${value}'`)
    }
  }

  return whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''
}

// Dropdown filter component
function SurveyFilter({
  filterKey,
  filterConfig,
  selectedValue,
  setFilterValue,
}: {
  filterKey: string
  filterConfig: {
    label: string
    options: { value: string; label: string }[]
  }
  selectedValue: string
  setFilterValue: (filterKey: string, value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="tiny"
          iconRight={<ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />}
        >
          <div className="w-full flex gap-1">
            <p className="text-foreground-lighter">{filterConfig.label}</p>
            {selectedValue !== NO_FILTER && <p className="text-foreground">{selectedValue}</p>}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {filterConfig.options
          .filter((opt) => opt.value !== NO_FILTER)
          .map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setFilterValue(filterKey, option.value)}
              className={selectedValue === option.value ? 'text-brand-600' : ''}
            >
              {option.label}
            </DropdownMenuItem>
          ))}

        {selectedValue !== NO_FILTER && (
          <div className="border-t border-border mt-1 pt-1">
            <DropdownMenuItem
              onClick={() => setFilterValue(filterKey, NO_FILTER)}
              className="text-foreground-lighter"
            >
              Clear
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
