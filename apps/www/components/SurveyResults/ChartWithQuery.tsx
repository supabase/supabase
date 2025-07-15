'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

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

export function ChartWithQuery() {
  // Start with all filters unset (showing "all")
  const [activeFilters, setActiveFilters] = useState({
    region: 'all',
    funding_stage: 'all',
    age_group: 'all',
  })

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
        </CardContent>
      </Card>
    </div>
  )
}
