'use client'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from 'recharts'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from 'ui'
import { ChartConfig, ChartContainer } from 'ui'
import CodeWindow from '~/components/CodeWindow'

export const description = 'A bar chart with a custom label'

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
  process.env.NEXT_PUBLIC_SURVEY_RESULTS_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SURVEY_RESULTS_SUPABASE_ANON_KEY!
)

// Custom hook to fetch filter options from Supabase
function useFilterOptions() {
  const [filters, setFilters] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching filter options from Supabase')

        // Get distinct values for each filter column
        const filterColumns = ['headquarters', 'funding_stage', 'person_age']
        const filterOptions = {}

        for (const column of filterColumns) {
          const { data, error: fetchError } = await externalSupabase
            .from('responses')
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
                value: 'all',
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
  }, [])

  return { filters, isLoading, error }
}

// Inline dropdown component for SQL
function InlineFilterDropdown({ filterKey, filterConfig, selectedValue, setFilterValue }) {
  const displayText = selectedValue === 'all' ? 'Filter' : `${selectedValue}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="text"
          size="tiny"
          className={`inline-flex items-center gap-1 px-2 py-0 h-auto text-sm font-mono bg-background border border-border hover:bg-surface-100 ${
            displayText === 'Filter' ? 'text-foreground-lighter' : ''
          }`}
          iconRight={<ChevronDown className="w-3 h-3" />}
        >
          {displayText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => setFilterValue(filterKey, 'all')}
          className={selectedValue === 'all' ? 'text-brand-600' : ''}
        >
          Unset
        </DropdownMenuItem>
        {filterConfig.options
          .filter((opt) => opt.value !== 'all')
          .map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setFilterValue(filterKey, option.value)}
              className={selectedValue === option.value ? 'text-brand-600' : ''}
            >
              = '{option.value}'
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Generate SQL query string based on active filters
function generateSQLQuery(activeFilters) {
  // Build WHERE clauses only for active filters
  const whereClauses = []

  if (activeFilters.headquarters !== 'all') {
    whereClauses.push(`headquarters = '${activeFilters.headquarters}'`)
  }

  if (activeFilters.funding_stage !== 'all') {
    whereClauses.push(`funding_stage = '${activeFilters.funding_stage}'`)
  }

  if (activeFilters.person_age !== 'all') {
    whereClauses.push(`person_age = '${activeFilters.person_age}'`)
  }

  // Build the WHERE clause string
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join('\n  AND ')}` : ''

  return `SELECT
  team_count,
  COUNT(*) AS total
FROM responses${whereClause ? '\n' + whereClause : ''}
GROUP BY team_count
ORDER BY 
  CASE team_count
    WHEN '1-10' THEN 1
    WHEN '11-50' THEN 2
    WHEN '51-100' THEN 3
    WHEN '101-250' THEN 4
    WHEN '250+' THEN 5
  END;`
}

// Custom hook to fetch survey data using SQL query via RPC
function useSurveyData(activeFilters) {
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching survey data with filters:', activeFilters)

        // Generate the SQL query
        const sqlQuery = generateSQLQuery(activeFilters)
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
          label: row.team_count === '250+' ? '250+' : row.team_count,
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
  }, [activeFilters])

  return { chartData, isLoading, error }
}

export function ChartWithQuery() {
  // Get dynamic filter options
  const { filters, isLoading: filtersLoading, error: filtersError } = useFilterOptions()

  // Start with all filters unset (showing "all")
  const [activeFilters, setActiveFilters] = useState({
    headquarters: 'all',
    funding_stage: 'all',
    person_age: 'all',
  })

  // Use the custom hook to fetch data
  const { chartData, isLoading: dataLoading, error: dataError } = useSurveyData(activeFilters)

  const setFilterValue = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
  }

  // Generate the SQL query string
  const sqlQuery = generateSQLQuery(activeFilters)

  const isLoading = filtersLoading || dataLoading
  const error = filtersError || dataError

  return (
    <div className="w-full flex flex-row gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>How many full-time employees does your startup have?</CardTitle>
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
        <CardFooter>
          <div className="flex flex-wrap gap-4 mt-2">
            {Object.entries(filters).map(([filterKey, filterConfig]) => (
              <div key={filterKey} className="flex items-center gap-2">
                <span className="text-sm font-medium">{filterConfig.label}:</span>
                <InlineFilterDropdown
                  filterKey={filterKey}
                  filterConfig={filterConfig}
                  selectedValue={activeFilters[filterKey]}
                  setFilterValue={setFilterValue}
                />
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>
      <CodeWindow code={sqlQuery} lang="sql" className="w-full" />
    </div>
  )
}
