'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import { getFlameGraphColor, isValidateData } from './utils'

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

function transformDataIntoFlameGraphFormat(
  data: FlameGraphDataItem[],
  colorMode: 'width' | 'peaks'
): [number, any[]] {
  const itemsById = new Map(data.map((item) => [item.id, item]))
  const maxWidth = Math.max(...data.map((item) => item.end_value - item.start_value))

  const computeLevels = (data: any[]): Map<string, number> => {
    const levelMap = new Map<string, number>()
    const unprocessedItems = new Set(data.map((item) => item.id))

    // Process items without parents first (root items)
    data.forEach((item) => {
      if (item.parent_id === '') {
        levelMap.set(item.id, 0)
        unprocessedItems.delete(item.id)
      }
    })

    // Continue processing until all items are processed or no progress is made
    let madeProgress = true
    while (unprocessedItems.size > 0 && madeProgress) {
      madeProgress = false

      // Convert set to array to avoid modifying during iteration
      Array.from(unprocessedItems).forEach((id) => {
        const item = itemsById.get(id)
        if (!item) {
          console.warn("Item doesn't exist", id)
          unprocessedItems.delete(id)
          return
        }

        // If parent doesn't exist in our data
        if (item.parent_id !== '' && !itemsById.has(item.parent_id)) {
          console.warn("Parent doesn't exist", item.parent_id)
          levelMap.set(id, -1)
          unprocessedItems.delete(id)
          madeProgress = true
          return
        }

        // If we know the parent's level, we can compute this item's level
        if (levelMap.has(item.parent_id)) {
          const parentLevel = levelMap.get(item.parent_id) as number
          levelMap.set(id, parentLevel + 1)
          unprocessedItems.delete(id)
          madeProgress = true
        }
      })
    }

    // Handle any remaining items (could be due to circular references)
    if (unprocessedItems.size > 0) {
      console.warn(
        'Circular reference or invalid hierarchy detected for items:',
        Array.from(unprocessedItems)
      )

      // Mark remaining items with -1 to indicate they couldn't be processed
      unprocessedItems.forEach((id) => {
        levelMap.set(id, -1)
      })
    }

    return levelMap
  }

  const levelMap: Map<string, number> = computeLevels(data)
  const maxLevel = Math.max(...levelMap.values())

  const transFormedData = data
    .filter((item) => [...levelMap.keys()].includes(item.parent_id) || item.parent_id === '')
    .map((item) => ({
      name: item.id,
      value: [levelMap.get(item.id), item.start_value, item.end_value, item.name],
      itemStyle: {
        color: getFlameGraphColor(item, colorMode, levelMap.get(item.id) || 0, maxLevel, maxWidth),
      },
    }))

  return [maxLevel, transFormedData]
}

type FlameGraphProps = {
  data: any[]
  title?: string
  tooltipFormatter?: (params: any) => string
  /**
   * Set the colorMode for the FlameGraph.
   * If set to 'width', the color will be based on the width of the item. (longer items results in brighter color)
   * If set to 'peaks', the color will be based on the level of the item. (Higher level results in brighter color)
   */
  colorMode?: 'width' | 'peaks'
}

export const FlameGraph = ({
  data,
  title,
  tooltipFormatter,
  colorMode = 'peaks',
}: FlameGraphProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<EChartsType | null>(null)
  const [valid, error] = isValidateData(data)
  if (!valid) {
    console.error(error)
  }

  const [flameGraphHeight, flameGraphData] = useMemo(
    () => transformDataIntoFlameGraphFormat(data, colorMode),
    [data, colorMode]
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
