import RGL, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import { Dashboards } from 'types'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import { ReportChartBlock } from './ReportChartBlock'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'

const ReactGridLayout = WidthProvider(RGL)

interface GridResizeProps {
  startDate: string
  endDate: string
  interval: string
  editableReport: Dashboards.Content
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: (id: string, config: Partial<ChartConfig>) => void
  setEditableReport: (payload: any) => void
}

export const GridResize = ({
  startDate,
  endDate,
  interval,
  editableReport,
  disableUpdate,
  onRemoveChart,
  onUpdateChart,
  setEditableReport,
}: GridResizeProps) => {
  const onUpdateLayout = (layout: RGL.Layout[]) => {
    const updatedLayout = [...editableReport.layout]

    layout.forEach((chart) => {
      const chartIdx = updatedLayout.findIndex((y) => chart.i === y.id)
      if (chartIdx !== undefined && chartIdx >= 0) {
        updatedLayout[chartIdx] = {
          ...updatedLayout[chartIdx],
          w: chart.w,
          h: chart.h,
          x: chart.x,
          y: chart.y,
        }
      }
    })

    setEditableReport({ ...editableReport, layout: updatedLayout })
  }

  if (!editableReport) return null

  return (
    <ReactGridLayout
      autoSize
      isDraggable
      isResizable
      rowHeight={270}
      cols={LAYOUT_COLUMN_COUNT}
      containerPadding={[0, 0]}
      resizeHandles={['sw', 'se']}
      compactType="vertical"
      onDragStop={onUpdateLayout}
      onResizeStop={onUpdateLayout}
    >
      {editableReport.layout.map((item) => {
        return (
          <div
            key={item.id}
            data-grid={{ ...item, minH: 1, maxH: 1, minW: 1, maxW: LAYOUT_COLUMN_COUNT }}
          >
            <ReportChartBlock
              key={item.id}
              item={item}
              startDate={startDate}
              endDate={endDate}
              interval={interval}
              disableUpdate={disableUpdate}
              onRemoveChart={onRemoveChart}
              onUpdateChart={(config) => onUpdateChart(item.id, config)}
            />
          </div>
        )
      })}
    </ReactGridLayout>
  )
}
