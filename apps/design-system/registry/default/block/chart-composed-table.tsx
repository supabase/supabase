'use client'

import { format } from 'date-fns'
import { BarChart2, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import {
  Chart,
  ChartActions,
  ChartBar,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartFooter,
  ChartHeader,
  ChartLoadingState,
  ChartTitle,
} from 'ui-patterns/Chart'

export default function ChartComposedTable() {
  const [isLoading, setIsLoading] = useState(true)

  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Opening in Logs Explorer...')
      },
      icon: <ExternalLink size={12} />,
    },
  ]

  const data = Array.from({ length: 46 }, (_, i) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - i * 5) // Each point 5 minutes apart

    return {
      timestamp: date.toISOString(),
      standard_score: Math.floor(Math.random() * 100),
    }
  }).reverse()

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="flex flex-col gap-6 w-8/12">
      <Chart isLoading={isLoading}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">Standard Bar Chart</ChartTitle>
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent
            isEmpty={data.length === 0}
            emptyState={
              <ChartEmptyState
                icon={<BarChart2 size={16} />}
                title="No data to show"
                description="It may take up to 24 hours for data to refresh"
              />
            }
            loadingState={<ChartLoadingState />}
          >
            <div className="h-40">
              <ChartBar
                data={data}
                dataKey="standard_score"
                showGrid={false}
                showYAxis={true}
                YAxisProps={{
                  tickFormatter: (value) => `${value}k`,
                  width: 80,
                }}
                isFullHeight={true}
              />
            </div>
          </ChartContent>
          <ChartFooter>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Standard Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 3).map((item) => (
                  <TableRow key={item.timestamp}>
                    <TableCell className="text-foreground-light">
                      {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.standard_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ChartFooter>
        </ChartCard>
      </Chart>
    </div>
  )
}
