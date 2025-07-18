'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from 'recharts'

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
  process.env.NEXT_PUBLIC_SURVEY_RESULTS_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SURVEY_RESULTS_SUPABASE_ANON_KEY
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
            .from('responses_2025_e')
            .select(column)
            .not(column, 'is', null)
            .not(column, 'eq', '')

          if (fetchError) {
            console.error(`Error fetching ${column} options:`, fetchError)
            continue
          }

          // Get unique values and sort them
          const uniqueValues = [...new Set(data.map((row) => row[column]))].sort()

          filterOptions[column] = {
            label: column.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            options: [
              {
                value: 'unset',
                label: `All ${column.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}s`,
              },
              ...uniqueValues.map((value) => ({ value, label: value })),
            ],
          }
        }

        console.log('Filter options:', filterOptions)
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
