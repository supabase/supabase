'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { ChevronsUpDown } from 'lucide-react'
import TwoOptionToggle from '../../../studio/components/ui/TwoOptionToggle'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

// Separate Supabase client for survey project
const externalSupabase = createClient(
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_ANON_KEY!
)

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

interface ChartDataItem {
  label: string
  value: number
  rawValue: number
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

// Fetch survey data using secure database functions
function useSurveyData(
  shouldFetch: boolean,
  functionName: string,
  functionParams: (activeFilters: Record<string, string>) => Record<string, any>,
  activeFilters: Record<string, string>
) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldFetch) return

    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        let data, fetchError

        const functionParamsData = functionParams(activeFilters)
        const { data: functionData, error: functionError } = await externalSupabase.rpc(
          functionName,
          functionParamsData
        )
        data = functionData
        fetchError = functionError

        if (fetchError) {
          console.error('Error executing SQL query:', fetchError)
          setError(fetchError.message)
          return
        }

        // Calculate total for percentage calculation
        const total = data.reduce(
          (sum: number, row: any) => sum + parseInt(row.count || row.total),
          0
        )

        // Transform the data to match chart format
        const processedData = data.map((row: any) => {
          const count = parseInt(row.count || row.total)
          const rawPercentage = total > 0 ? (count / total) * 100 : 0
          const roundedPercentage = Math.round(rawPercentage)

          return {
            label: row.label || row.value || row[Object.keys(row)[0]], // Get the first column as label
            value: roundedPercentage,
            rawValue: rawPercentage, // Keep the raw value for bar scaling
          }
        })

        setChartData(processedData)
      } catch (err: any) {
        console.error('Error in fetchData:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [shouldFetch, functionName, functionParams, activeFilters])

  return { chartData, isLoading, error }
}

interface SurveyChartProps {
  title: string
  targetColumn: string
  filterColumns: string[]
  generateSQLQuery?: (activeFilters: Record<string, string>) => string
  functionName: string
}

export function SurveyChart({
  title,
  targetColumn, // Used for SQL query generation when generateSQLQuery is provided
  filterColumns,
  generateSQLQuery,
  functionName,
}: SurveyChartProps) {
  const [isInView, setIsInView] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const [shouldAnimateBars, setShouldAnimateBars] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Intersection observer to trigger chart data loading via database function
  useEffect(() => {
    const chartRefCurrent = chartRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoadedOnce) {
            setIsInView(true)
            setHasLoadedOnce(true)
            observer.disconnect() // Only trigger once
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '128px', // Start loading before the component comes into view
      }
    )

    if (chartRefCurrent) {
      observer.observe(chartRefCurrent)
    }

    return () => {
      if (chartRefCurrent) {
        observer.unobserve(chartRefCurrent)
      }
    }
  }, [hasLoadedOnce])

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
  const buildFunctionParams = useCallback((activeFilters: Record<string, string>) => {
    const params: Record<string, any> = {}

    // Convert single values to arrays for the function parameters
    if (activeFilters.person_age && activeFilters.person_age !== 'unset') {
      params.person_age_filter = [activeFilters.person_age]
    }
    if (activeFilters.location && activeFilters.location !== 'unset') {
      params.location_filter = [activeFilters.location]
    }
    if (activeFilters.money_raised && activeFilters.money_raised !== 'unset') {
      params.money_raised_filter = [activeFilters.money_raised]
    }
    if (activeFilters.team_size && activeFilters.team_size !== 'unset') {
      params.team_size_filter = [activeFilters.team_size]
    }

    return params
  }, [])

  // Use the custom hook to fetch data
  const {
    chartData,
    isLoading: dataLoading,
    error: dataError,
  } = useSurveyData(isInView, functionName, buildFunctionParams, activeFilters)

  // Reset animation state when filters change
  useEffect(() => {
    setShouldAnimateBars(false)
  }, [activeFilters])

  // Trigger bar animation when data loads
  useEffect(() => {
    if (!dataLoading && chartData.length > 0 && !shouldAnimateBars) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShouldAnimateBars(true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [dataLoading, chartData.length, shouldAnimateBars])

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

  const skeletonData = [
    { label: 'Loading', value: 0, rawValue: 0 },
    { label: 'Loading', value: 0, rawValue: 0 },
    { label: 'Loading', value: 0, rawValue: 0 },
  ]

  const displayData = dataLoading ? skeletonData : chartData || []

  return (
    <div
      ref={chartRef}
      className="w-full bg-200 border-t border-muted"
      style={{
        background: `radial-gradient(circle at center -150%, hsl(var(--brand-300)), transparent 80%), radial-gradient(ellipse at center 230%, hsl(var(--background-surface-200)), transparent 75%)`,
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
          {dataError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-danger">Error: {dataError}</p>
            </div>
          ) : view === 'chart' ? (
            <div className="flex flex-col h-full w-full justify-between px-8 pt-4 pb-12 min-h-[300px]">
              {chartData.length > 0 ? (
                <div
                  className="flex flex-col gap-10"
                  style={{ height: isExpanded ? 'auto' : `${CHART_HEIGHT}px` }}
                >
                  {displayData.map((item, index) => (
                    <div key={index} className="flex flex-col">
                      {/* Text above the bar */}
                      <div
                        className={`mb-2 flex flex-row justify-between text-sm font-mono uppercase tracking-widest tabular-nums transition-colors duration-300 ${
                          shouldAnimateBars
                            ? item.value === maxValue
                              ? 'text-brand-link dark:text-brand'
                              : 'text-foreground'
                            : 'text-foreground-muted'
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
                          className={`h-full relative bg-surface-100`}
                          style={{
                            width: `calc(max(0.5%, (var(--bar-value) / 100) * 100%))`,
                            clipPath: shouldAnimateBars ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                            transition: `clip-path 0.5s steps(${Math.max(2, Math.floor((item.value / 100) * 12))}, end) ${index * 0.05}s`,
                          }}
                        >
                          {/* Foreground pattern for the filled portion */}
                          <div
                            className={`absolute inset-0 pointer-events-none ${item.value === maxValue ? 'bg-brand' : 'bg-foreground-light'}`}
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
                    type="primary"
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
                  {`// Function call: ${functionName}(${JSON.stringify(buildFunctionParams(activeFilters), null, 2)})`}
                </CodeBlock>
              )}
            </div>
          )}

          {/* Expand button overlay - only show for chart view */}
          {view === 'chart' &&
            !isExpanded &&
            !dataLoading &&
            !dataError &&
            chartData.length > 3 && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-gradient-to-b from-transparent to-background">
                <Button
                  type="default"
                  size="tiny"
                  onClick={() => setIsExpanded(true)}
                  className="shadow-sm"
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
          type="default"
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
