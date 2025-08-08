'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, Button } from 'ui'
import { FilterDropdown } from './FilterDropdown'
import { ChevronDown, UnfoldVertical } from 'lucide-react'
import TwoOptionToggle from '../../../studio/components/ui/TwoOptionToggle'
import { SurveyCodeWindow } from './SurveyCodeWindow'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

// Create a separate Supabase client for your external project
const externalSupabase = createClient(
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_ANON_KEY!
)

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

// Custom hook to fetch filter options from Supabase
function useFilterOptions(filterColumns: string[], shouldFetch: boolean) {
  const [filters, setFilters] = useState<Filters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldFetch) return

    async function fetchFilterOptions() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching filter options from Supabase for columns:', filterColumns)

        const filterOptions: Filters = {}

        for (const column of filterColumns) {
          const { data, error: fetchError } = await externalSupabase
            .from('responses_2025')
            .select(column)
            .not(column, 'is', null)

          if (fetchError) {
            console.error(`Error fetching ${column} options:`, fetchError)
            continue
          }

          console.log(`Raw data for ${column}:`, data)

          // Extract all individual values from PostgreSQL arrays
          const allValues = data.flatMap((row: any) => {
            const value = row[column]
            console.log(
              `Processing value for ${column}:`,
              value,
              typeof value,
              Array.isArray(value)
            )

            if (Array.isArray(value)) {
              // Handle PostgreSQL arrays
              return value.filter((item: any) => item && item.length > 0)
            } else if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
              // Handle PostgreSQL array format like {Firebase,MongoDB,MySQL}
              const innerContent = value.slice(1, -1) // Remove { and }
              if (innerContent.trim() === '') {
                return []
              }
              return innerContent
                .split(',')
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
            }
            return [value]
          })

          console.log(`All values for ${column}:`, allValues)

          // Get unique values and sort them
          const uniqueValues = [...new Set(allValues)].sort()

          console.log(`Unique values for ${column}:`, uniqueValues)

          filterOptions[column] = {
            label: column.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            options: [
              {
                value: 'unset',
                label: `All ${column.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}s`,
              },
              ...uniqueValues.map((value) => ({
                value: String(value), // Convert to string for React
                label: String(value), // Convert to string for display
              })),
            ],
          }
        }

        console.log('Final filter options:', filterOptions)
        setFilters(filterOptions)
      } catch (err: any) {
        console.error('Error fetching filter options:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilterOptions()
  }, [filterColumns, shouldFetch])

  return { filters, isLoading, error }
}

// Custom hook to fetch survey data using SQL query via RPC
function useSurveyData(sqlQuery: string, shouldFetch: boolean) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldFetch) return

    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Executing SQL query:', sqlQuery)

        // Execute the SQL query using Supabase RPC
        const { data, error: fetchError } = await externalSupabase.rpc('execute_sql', {
          query: sqlQuery,
        })

        if (fetchError) {
          console.error('Error executing SQL query:', fetchError)
          setError(fetchError.message)
          return
        }

        console.log('Raw data from SQL query:', data)

        // Calculate total for percentage calculation
        const total = data.reduce((sum: number, row: any) => sum + parseInt(row.total), 0)

        // Transform the data to match chart format
        const processedData = data.map((row: any) => {
          const rawPercentage = total > 0 ? (parseInt(row.total) / total) * 100 : 0
          const roundedPercentage = Math.round(rawPercentage)

          return {
            label: row.label || row.value || row[Object.keys(row)[0]], // Get the first column as label
            value: roundedPercentage,
            rawValue: rawPercentage, // Keep the raw value for bar scaling
          }
        })

        console.log('Processed chart data:', processedData)
        setChartData(processedData)
      } catch (err: any) {
        console.error('Error in fetchData:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sqlQuery, shouldFetch])

  return { chartData, isLoading, error }
}

interface GenericChartWithQueryProps {
  title: string
  targetColumn: string
  filterColumns: string[]
  generateSQLQuery: (activeFilters: Record<string, string>) => string
}

export function GenericChartWithQuery({
  title,
  targetColumn,
  filterColumns,
  generateSQLQuery,
}: GenericChartWithQueryProps) {
  const [isInView, setIsInView] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const [shouldAnimateBars, setShouldAnimateBars] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Intersection observer to trigger data loading
  useEffect(() => {
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

    if (chartRef.current) {
      observer.observe(chartRef.current)
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current)
      }
    }
  }, [hasLoadedOnce])

  // Get dynamic filter options
  const {
    filters,
    isLoading: filtersLoading,
    error: filtersError,
  } = useFilterOptions(filterColumns, isInView)

  // Start with all filters unset (showing "all")
  const [activeFilters, setActiveFilters] = useState(
    filterColumns.reduce(
      (acc: Record<string, string>, col: string) => ({ ...acc, [col]: 'unset' }),
      {}
    )
  )

  // Generate the SQL query string
  const sqlQuery = generateSQLQuery(activeFilters)

  // Use the custom hook to fetch data
  const { chartData, isLoading: dataLoading, error: dataError } = useSurveyData(sqlQuery, isInView)

  // Reset animation state when filters change
  useEffect(() => {
    setShouldAnimateBars(false)
  }, [activeFilters])

  // Trigger bar animation when data loads
  useEffect(() => {
    if (!dataLoading && !filtersLoading && chartData.length > 0 && !shouldAnimateBars) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShouldAnimateBars(true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [dataLoading, filtersLoading, chartData.length, shouldAnimateBars])

  const [view, setView] = useState<'chart' | 'sql'>('chart')

  const setFilterValue = (filterKey: string, value: string) => {
    setActiveFilters((prev: Record<string, string>) => ({
      ...prev,
      [filterKey]: value,
    }))
  }

  const isLoading = filtersLoading || dataLoading
  const error = filtersError || dataError

  // Find the maximum value for scaling
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((item) => item.value)) : 0

  // State for expand/collapse
  const [isExpanded, setIsExpanded] = useState(false)

  // Fixed height for all states (loading, error, loaded collapsed)
  const FIXED_HEIGHT = 300 // px
  const BUTTON_AREA_HEIGHT = 40 // px
  const CHART_HEIGHT = FIXED_HEIGHT - BUTTON_AREA_HEIGHT // px (FIXED_HEIGHT - 40px for button area)

  const skeletonData = [
    { label: 'Loading', value: 0, rawValue: 0 },
    { label: 'Loading', value: 0, rawValue: 0 },
    { label: 'Loading', value: 0, rawValue: 0 },
  ]

  const displayData = isLoading ? skeletonData : chartData || []

  return (
    <div ref={chartRef} className="w-full bg-surface-100 border-y">
      <header className="px-6 py-5">
        <h3 className="text-foreground-light text-lg">{title}</h3>
      </header>
      <div
        className={`${view === 'chart' ? 'bg-surface-100' : 'bg-surface-75'} border-b last:border-none`}
      >
        <div
          className="overflow-hidden relative"
          style={{
            height: isExpanded ? 'auto' : `${FIXED_HEIGHT}px`,
          }}
        >
          {error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-danger">Error: {error}</p>
            </div>
          ) : view === 'chart' ? (
            <div className="flex flex-col h-full w-full justify-between px-6 pt-4 pb-10">
              {/* Each bar as a vertical stack: label above, bar below */}
              <div
                className="flex flex-col gap-10"
                style={{ height: isExpanded ? 'auto' : `${CHART_HEIGHT}px` }}
              >
                {displayData.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    {/*  Text above the bar */}
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

                    {/* Entire bar (including background) */}
                    <div
                      className="h-[16px] flex items-center"
                      style={
                        {
                          background: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 4px,
                            color-mix(in srgb, hsl(var(--foreground-muted)) 30%, transparent) 4px,
                            color-mix(in srgb, hsl(var(--foreground-muted)) 30%, transparent) 6px
                          )`,
                          '--reference': maxValue,
                          '--bar-value': item.rawValue || item.value,
                          '--index': index,
                        } as React.CSSProperties
                      }
                    >
                      {/* Filled portion of the bar */}
                      <div
                        className={`h-full ${item.value === maxValue ? 'bg-brand' : 'bg-foreground-muted'}`}
                        style={{
                          width: `calc(max(0.5%, (var(--bar-value) / var(--reference)) * 100%))`,
                          transform: shouldAnimateBars ? 'scaleX(1)' : 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: `transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <CodeBlock lang="sql" showLineNumbers={true} className="rounded-none border-none">
              {sqlQuery}
            </CodeBlock>
          )}

          {/* Expand button overlay */}
          {!isExpanded && !isLoading && !error && chartData.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-gradient-to-b from-transparent to-background">
              <Button
                type="default"
                size="tiny"
                // iconRight={<UnfoldVertical />}
                onClick={() => setIsExpanded(true)}
                className="shadow-sm"
              >
                {/* Show {chartData.length - 3} more */}
                Show more
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters and toggle */}
      <div className="flex flex-row flex-wrap gap-4 p-4 justify-between">
        {filters && activeFilters && setFilterValue && (
          <div className="flex flex-wrap gap-4">
            {Object.entries(filters).map(([filterKey, filterConfig]) => (
              <FilterDropdown
                key={filterKey}
                filterKey={filterKey}
                filterConfig={filterConfig}
                selectedValue={activeFilters[filterKey]}
                setFilterValue={setFilterValue}
              />
            ))}
          </div>
        )}
        <TwoOptionToggle
          options={['SQL', 'chart']}
          activeOption={view}
          onClickOption={setView}
          borderOverride="border-overlay"
        />
      </div>
    </div>
  )
}
