'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'

type EChartsOption = echarts.EChartsOption
type EChartsType = echarts.ECharts

export type FlameGraphDataItem = {
  id: string
  name: string
  start_value: number
  end_value: number
  parent_id: string
  color?: string
  [key: string]: any
}

function transformDataIntoFlameGraphFormat(data: FlameGraphDataItem[]): [number, any[]] {
  const itemsById = new Map<string, FlameGraphDataItem>()
  const levelMap = new Map<string, number>()
  for (const item of data) {
    itemsById.set(item.id, item)
  }

  // Function to compute level for a specific item
  const computeLevel = (id: string): number => {
    const item = itemsById.get(id)
    if (!item) {
      // If the item doesn't exist, return -1
      console.warn("Item doesn't exist", id)
      return -1
    }

    if (item.parent_id === '') {
      levelMap.set(id, 0)
      return 0
    }

    if (![...itemsById.keys()].includes(item.parent_id)) {
      // If the item doesn't exist, return -1
      console.warn("Item doesn't exist", id)
      return -1
    }

    const parentLevel = computeLevel(item.parent_id)
    levelMap.set(id, parentLevel + 1)
    return parentLevel + 1
  }

  for (const item of data) {
    computeLevel(item.id)
  }

  const transFormedData = data
    .filter((item) => [...levelMap.keys()].includes(item.parent_id) || item.parent_id === '')
    .map((item) => ({
      name: item.id,
      value: [levelMap.get(item.id), item.start_value, item.end_value, item.name],
      itemStyle: {
        color: item.color || '#3ecf8e',
      },
    }))

  return [Math.max(...levelMap.values()), transFormedData]
}

function isValidateData(data: FlameGraphDataItem[]): [boolean, string] {
  // there should only be 1 FlameGraphDataItem with no parent_id
  const rootItems = data.filter((item) => item.parent_id === '')

  if (rootItems.length === 0) {
    return [false, 'There is no root item in the data. Add at least one item with no parent_id.']
  }

  if (rootItems.length > 1) {
    return [
      false,
      'There are more than 1 root item with no parent_id. Please wrap all these data in a single item with no parent_id.',
    ]
  }

  return [true, '']
}

export const FlameGraph = ({
  data,
  title,
  tooltipFormatter,
}: {
  data: any[]
  title?: string
  hasAnimation?: boolean
  tooltipFormatter?: (params: any) => string
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<EChartsType | null>(null)
  const [valid, error] = isValidateData(data)
  if (!valid) {
    console.error(error)
  }

  const [flameGraphHeight, flameGraphData] = useMemo(
    () => transformDataIntoFlameGraphFormat(data),
    data
  )

  useEffect(() => {
    if (chartRef.current && valid) {
      chartInstance.current = echarts.init(chartRef.current)

      const option: EChartsOption = {
        backgroundColor: 'rgba(0,0,0,0)',
        tooltip: {
          formatter: tooltipFormatter,
        },
        title: [
          {
            text: title,
            left: 'center',
            top: -5,
            textStyle: {
              fontFamily: 'Source Code Pro, Office Code Pro, Menlo, monospace',
              fontWeight: 'normal',
            },
          },
        ],
        xAxis: {
          show: false,
        },
        yAxis: {
          show: false,
          max: flameGraphHeight,
        },
        series: [
          {
            type: 'custom',
            renderItem: renderFlameChartBar,
            encode: {
              x: [0, 1, 2],
              y: 0,
            },
            data: flameGraphData,
          },
        ],
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

  return (
    <>
      {valid ? (
        <div ref={chartRef} className="w-full h-80" />
      ) : (
        <div className="w-full h-80 flex items-center justify-center">{error}</div>
      )}
    </>
  )
}

/**
 * Function to generate each bar in the flame graph
 * @param api the data provided in options.series
 */
const renderFlameChartBar: echarts.CustomSeriesRenderItem = (
  _params: echarts.CustomSeriesRenderItemParams,
  api: echarts.CustomSeriesRenderItemAPI
) => {
  const level = api.value(0)
  const start = api.coord([api.value(1), level])
  const end = api.coord([api.value(2), level])
  const height = (((api.size && api.size([0, 1])) || [0, 20]) as number[])[1]
  const width = end[0] - start[0]

  return {
    type: 'rect',
    transition: ['shape'],
    shape: {
      x: start[0],
      y: start[1] - height / 2,
      width: width - 2,
      height: height - 2,
      r: 4,
    },
    style: {
      fill: api.visual('color'),
    },
    textConfig: {
      position: 'insideLeft',
    },
    textContent: {
      style: {
        text: api.value(3),
        fontFamily: 'Source Code Pro, Office Code Pro, Menlo, monospace',
        fill: '#000',
        width: width - 4,
        overflow: 'truncate',
        ellipsis: '..',
        truncateMinChar: 1,
      },
    },
  } as echarts.CustomSeriesRenderItemReturn
}
