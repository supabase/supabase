'use client'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { cn } from 'ui'

type EChartsOption = echarts.EChartsOption
type EChartsType = echarts.ECharts

// allows for any type of data as long as label, start and duration exists in the object.
export type WaterfallDataItem = {
  label: string
  start: number
  duration: number
  [key: string]: any
}

export const HorizontalWaterfallChart = ({
  data,
  title,
  subtitle,
  hasAnimation = true,
  tooltipFormatter,
}: {
  data: WaterfallDataItem[]
  title?: string
  subtitle?: string
  hasAnimation?: boolean
  tooltipFormatter?: (params: any) => string
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<EChartsType | null>(null)

  let transparent: number[] = []
  let positive: number[] = []

  data.forEach((item) => {
    transparent.push(item.start)
    positive.push(item.duration)
  })

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current)

      const option: EChartsOption = {
        backgroundColor: 'rgba(0,0,0,0)',
        title: {
          text: title,
          subtext: subtitle,
          textStyle: {
            fontFamily: 'Source Code Pro, Office Code Pro, Menlo, monospace',
          },
          subtextStyle: {
            fontFamily: 'Source Code Pro, Office Code Pro, Menlo, monospace',
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: tooltipFormatter,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: data.map((item) => item.label),
          axisLabel: {
            fontSize: '10px',
            fontFamily: 'Source Code Pro, Office Code Pro, Menlo, monospace',
          },
        },
        yAxis: {
          type: 'value',
          splitLine: { show: false },
          axisLabel: {
            fontSize: '12px',
            fontFamily: 'Source Code Pro, Office Code Pro, Menlo, monospace',
          },
        },
        series: [
          {
            type: 'bar',
            stack: 'all',
            data: transparent,
            itemStyle: {
              color: 'rgba(0,0,0,0)',
            },
            barCategoryGap: '15%',
          },
          {
            type: 'bar',
            stack: 'all',
            data: positive,
            itemStyle: {
              color: '#3ecf8e',
            },
          },
        ],
        animation: hasAnimation,
      }

      chartInstance.current.setOption(option)
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
      }
    }
  }, [data])

  return <div ref={chartRef} className="w-full h-80" />
}
