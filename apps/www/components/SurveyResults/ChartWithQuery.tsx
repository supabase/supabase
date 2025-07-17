'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
// import { ChartContainer } from 'ui'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from 'ui'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

export const description = 'A bar chart with a custom label'

// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ]

const chartData = [
  { label: '1–10', value: 91.1 },
  { label: '11–50', value: 6.3 },
  { label: '51–100', value: 1.2 },
  { label: '101–250', value: 0.8 },
  { label: '250+', value: 0.6 },
]

const regions = [
  { value: 'all', label: 'All Regions' },
  { value: 'North America', label: 'North America' },
  { value: 'South America', label: 'South America' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Oceania', label: 'Oceania' },
  { value: 'Remote', label: 'Remote' },
]

const chartConfig = {
  value: {
    label: 'Value',
    color: 'hsl(var(--brand-default))',
  },
  label: {
    color: '#ff0000',
  },
} satisfies ChartConfig

// Define all possible filters
const filters = {
  region: {
    label: 'Region',
    options: [
      { value: 'all', label: 'All Regions' },
      { value: 'North America', label: 'North America' },
      { value: 'South America', label: 'South America' },
      { value: 'Asia', label: 'Asia' },
      { value: 'Europe', label: 'Europe' },
      { value: 'Africa', label: 'Africa' },
      { value: 'Oceania', label: 'Oceania' },
      { value: 'Remote', label: 'Remote' },
    ],
  },
  funding_stage: {
    label: 'Funding Stage',
    options: [
      { value: 'all', label: 'All Stages' },
      { value: 'Bootstrapped', label: 'Bootstrapped' },
      { value: 'Seed', label: 'Seed' },
      { value: 'Series A', label: 'Series A' },
      { value: 'Series B+', label: 'Series B+' },
    ],
  },
  age_group: {
    label: 'Age Group',
    options: [
      { value: 'all', label: 'All Ages' },
      { value: '18-24', label: '18-24' },
      { value: '25-34', label: '25-34' },
      { value: '35-44', label: '35-44' },
      { value: '45+', label: '45+' },
    ],
  },
}

// Inline dropdown component for SQL
function InlineFilterDropdown({ filterKey, filterConfig, selectedValue, setFilterValue }) {
  const displayText = selectedValue === 'all' ? 'Filter' : `= '${selectedValue}'` // IS NOT NULL

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
          IS NOT NULL (All)
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

// Create a separate Supabase client for your external project
const externalSupabase = createClient(
  process.env.NEXT_PUBLIC_SURVEY_RESULTS_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SURVEY_RESULTS_SUPABASE_ANON_KEY!
)

// Custom hook to fetch survey data from external Supabase
function useSurveyData(activeFilters) {
  console.log('useSurveyData hook called with filters:', activeFilters)
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching survey data with filters:', activeFilters)

        // Build the query based on active filters
        let query = externalSupabase.from('dummy_survey_responses').select('team_size')

        // Apply filters
        Object.entries(activeFilters).forEach(([key, value]) => {
          if (value !== 'all') {
            query = query.eq(key, value)
          }
        })

        const { data, error: fetchError } = await query

        if (fetchError) {
          console.error('Error fetching data:', fetchError)
          setError(fetchError.message)
          return
        }

        console.log('Raw data from external Supabase:', data)

        // Process the data to count team sizes
        const teamSizeCounts = {}
        data.forEach((row) => {
          teamSizeCounts[row.team_size] = (teamSizeCounts[row.team_size] || 0) + 1
        })

        console.log('Team size counts:', teamSizeCounts)

        // Calculate percentages
        const total = data.length
        const processedData = [
          {
            label: '1–10',
            value: total > 0 ? (((teamSizeCounts['1-10'] || 0) / total) * 100).toFixed(1) : 0,
          },
          {
            label: '11–50',
            value: total > 0 ? (((teamSizeCounts['11-50'] || 0) / total) * 100).toFixed(1) : 0,
          },
          {
            label: '51–100',
            value: total > 0 ? (((teamSizeCounts['51-100'] || 0) / total) * 100).toFixed(1) : 0,
          },
          {
            label: '101–250',
            value: total > 0 ? (((teamSizeCounts['101-250'] || 0) / total) * 100).toFixed(1) : 0,
          },
          {
            label: '250+',
            value: total > 0 ? (((teamSizeCounts['250+'] || 0) / total) * 100).toFixed(1) : 0,
          },
        ].map((item) => ({
          ...item,
          value: parseFloat(item.value),
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
  // Start with all filters unset (showing "all")
  const [activeFilters, setActiveFilters] = useState({
    region: 'all',
    funding_stage: 'all',
    age_group: 'all',
  })

  // Use the custom hook to fetch data
  const { chartData, isLoading, error } = useSurveyData(activeFilters)

  const setFilterValue = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }))
  }

  // Generate WHERE clause
  const generateWhereClause = () => {
    const conditions = []

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== 'all') {
        conditions.push(`${key} = '${value}'`)
      }
    })

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1'
  }

  const whereClause = generateWhereClause()

  return (
    <div className="w-full flex flex-row gap-4">
      <Card className="w-full">
        <CardContent className="p-4">
          <pre className="text-sm">
            <code>
              {`SELECT
  team_size,
  COUNT(*) AS total
FROM dummy_survey_responses
WHERE region `}
              <InlineFilterDropdown
                filterKey="region"
                filterConfig={filters.region}
                selectedValue={activeFilters.region}
                setFilterValue={setFilterValue}
              />
              {`
  AND funding_stage `}
              <InlineFilterDropdown
                filterKey="funding_stage"
                filterConfig={filters.funding_stage}
                selectedValue={activeFilters.funding_stage}
                setFilterValue={setFilterValue}
              />
              {`
  AND age_group `}
              <InlineFilterDropdown
                filterKey="age_group"
                filterConfig={filters.age_group}
                selectedValue={activeFilters.age_group}
                setFilterValue={setFilterValue}
              />
              {`
GROUP BY team_size
ORDER BY 
  CASE team_size
    WHEN '1-10' THEN 1
    WHEN '11-50' THEN 2
    WHEN '51-100' THEN 3
    WHEN '101-250' THEN 4
    WHEN '250+' THEN 5
  END;`}
            </code>
          </pre>
        </CardContent>
      </Card>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? 'hsl(var(--brand-default))' : 'hsl(var(--brand-300))'}
                    />
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
    </div>
  )
}
