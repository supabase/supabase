'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, Button } from 'ui'
import { FilterDropdown } from './FilterDropdown'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
function useFilterOptions(filterColumns: string[]) {
  const [filters, setFilters] = useState<Filters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
  }, [filterColumns])

  return { filters, isLoading, error }
}

// Custom hook to fetch survey data using SQL query via RPC
function useSurveyData(sqlQuery: string) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
  }, [sqlQuery])

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
  // Get dynamic filter options
  const {
    filters,
    isLoading: filtersLoading,
    error: filtersError,
  } = useFilterOptions(filterColumns)

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
  const { chartData, isLoading: dataLoading, error: dataError } = useSurveyData(sqlQuery)

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
  const FIXED_HEIGHT = 320 // px (includes space for potential expand button)

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${FIXED_HEIGHT}px`, overflow: 'hidden' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-foreground-lighter">Loading data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full justify-between gap-[1px]">
              {/* Each bar as a vertical stack: label above, bar below */}
              <div
                className="flex flex-col gap-10"
                style={{ height: isExpanded ? 'auto' : '280px', overflow: 'hidden' }}
              >
                {chartData.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    {/* Label above the bar */}
                    <div className="mb-2">
                      <span className="text-sm font-mono uppercase tracking-widest">
                        {item.label}
                      </span>
                    </div>

                    {/* Bar and percentage row */}
                    <div className="flex items-center gap-3">
                      {/* Bar container with flex layout */}
                      <div
                        className="flex-1 h-[48px] relative flex items-center"
                        style={
                          {
                            '--reference': maxValue,
                            '--bar-value': item.rawValue || item.value, // Use rawValue for scaling
                            '--index': index,
                          } as React.CSSProperties
                        }
                      >
                        {/* Animated Bar */}
                        <div
                          className={`h-full ${item.value === maxValue ? 'bg-brand' : 'bg-selection'} rounded-sm transition-all duration-1000 delay-[calc(var(--index)*100ms)]`}
                          style={{
                            width: `calc(max(0.5%, (var(--bar-value) / var(--reference)) * 100%))`,
                          }}
                        />

                        {/* Percentage positioned after the bar */}
                        <div className="tabular-nums text-fluid-14-20 font-medium min-w-[60px] ml-3">
                          {item.value < 1 ? '<1%' : `${item.value}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expand/Collapse button - always rendered to maintain consistent height */}
        <div className="flex justify-center mt-4" style={{ height: '40px' }}>
          {!isLoading && !error && chartData.length > 3 ? (
            <Button
              type="text"
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-foreground-lighter hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show {chartData.length - 3} more
                </>
              )}
            </Button>
          ) : (
            <div style={{ height: '32px' }}></div> // Invisible spacer to maintain height
          )}
        </div>
      </CardContent>

      {/* Filters */}
      <div className="flex flex-col">
        {filters && activeFilters && setFilterValue && (
          <div className="flex flex-wrap gap-4 p-4 border-b border-border">
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
      </div>
    </Card>
  )
}
