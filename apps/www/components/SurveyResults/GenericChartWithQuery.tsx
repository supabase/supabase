'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

import {
  Bar,
  BarChart,
  PieChart,
  Pie,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { ChartConfig, ChartContainer } from 'ui'
import { SurveyCodeWindow } from './SurveyCodeWindow'

const chartConfig = {
  value: {
    label: 'Value',
    color: 'hsl(var(--brand-default))',
  },
  label: {
    color: '#ff0000',
  },
} satisfies ChartConfig

// Create a separate Supabase client for your external project
const externalSupabase = createClient(
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SURVEY_SUPABASE_ANON_KEY
)

// Custom hook to fetch filter options from Supabase
function useFilterOptions(filterColumns: string[]) {
  const [filters, setFilters] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching filter options from Supabase for columns:', filterColumns)

        const filterOptions = {}

        for (const column of filterColumns) {
          const { data, error: fetchError } = await externalSupabase
            .from('responses_2025')
            .select(column)
            .not(column, 'is', null)
          // Remove this line for boolean columns - it excludes false values
          // .not(column, 'eq', '')

          if (fetchError) {
            console.error(`Error fetching ${column} options:`, fetchError)
            continue
          }

          console.log(`Raw data for ${column}:`, data)

          // Extract all individual values from PostgreSQL arrays
          const allValues = data.flatMap((row) => {
            const value = row[column]
            console.log(
              `Processing value for ${column}:`,
              value,
              typeof value,
              Array.isArray(value)
            )

            if (Array.isArray(value)) {
              // Handle PostgreSQL arrays
              return value.filter((item) => item && item.length > 0)
            } else if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
              // Handle PostgreSQL array format like {Firebase,MongoDB,MySQL}
              const innerContent = value.slice(1, -1) // Remove { and }
              if (innerContent.trim() === '') {
                return []
              }
              return innerContent
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
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
      } catch (err) {
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
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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
        const total = data.reduce((sum, row) => sum + parseInt(row.total), 0)

        // Transform the data to match chart format
        const processedData = data.map((row) => ({
          label: row.label || row.value || row[Object.keys(row)[0]], // Get the first column as label
          value: total > 0 ? parseFloat(((parseInt(row.total) / total) * 100).toFixed(1)) : 0,
        }))

        console.log('Processed chart data:', processedData)
        setChartData(processedData)
      } catch (err) {
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

export function GenericChartWithQuery({
  title,
  targetColumn,
  filterColumns,
  generateSQLQuery,
  chartType = 'bar', // TODO: Could be 'bar', 'pie', etc.
}) {
  // Get dynamic filter options
  const {
    filters,
    isLoading: filtersLoading,
    error: filtersError,
  } = useFilterOptions(filterColumns)

  // Start with all filters unset (showing "all")
  const [activeFilters, setActiveFilters] = useState(
    filterColumns.reduce((acc, col) => ({ ...acc, [col]: 'unset' }), {})
  )

  // Generate the SQL query string
  const sqlQuery = generateSQLQuery(activeFilters)

  // Use the custom hook to fetch data
  const { chartData, isLoading: dataLoading, error: dataError } = useSurveyData(sqlQuery)

  const setFilterValue = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
  }

  const isLoading = filtersLoading || dataLoading
  const error = filtersError || dataError

  // Two different color arrays
  // One for gradation (e.g. "Yes", "Maybe", "No")
  const COLORS = [
    'hsl(var(--brand-default))',
    'hsl(var(--brand-500))',
    'hsl(var(--foreground-light))',
  ]
  // One for a clear binary answer (e.g. "Yes", "No")
  const COLORS_BINARY = ['hsl(var(--brand-default))', 'hsl(var(--foreground-light))']

  return (
    <div className="w-full flex flex-row gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-foreground-lighter">Loading data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : (
            <ChartContainer config={chartConfig}>
              {chartType === 'bar' && (
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  layout="vertical"
                  margin={{
                    right: 0,
                  }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    tickMargin={64}
                    axisLine={false}
                    hide={false}
                    width={64}
                    tick={{
                      className: 'text-foreground-lighter',
                      fontSize: 12,
                      textAnchor: 'start',
                      dx: 0,
                    }}
                  />
                  <XAxis dataKey="value" type="number" hide />
                  <Bar dataKey="value" layout="vertical" radius={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--brand-default))" />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                      formatter={(value: number) => `${value}%`}
                    />
                  </Bar>
                </BarChart>
              )}
              {chartType === 'pie' && (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={100}
                    // startAngle={15}
                    paddingAngle={2}
                    // label={renderCustomizedLabel}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          chartData.length === 2
                            ? COLORS_BINARY[index % COLORS_BINARY.length]
                            : COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      <SurveyCodeWindow
        code={sqlQuery}
        lang="sql"
        className="w-full"
        filters={filters}
        activeFilters={activeFilters}
        setFilterValue={setFilterValue}
      />
    </div>
  )
}
