import RGL, { WidthProvider } from 'react-grid-layout'

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
  function onLayoutChange(layout: RGL.Layout[]) {
    let updatedLayout = editableReport.layout
    layout.map((item: any) => {
      const index = updatedLayout.findIndex((x: any) => x.id === item.i)
      updatedLayout[index].w = layout[index].w
      updatedLayout[index].h = layout[index].h
      updatedLayout[index].x = layout[index].x
      updatedLayout[index].y = layout[index].y
    })
    const payload = {
      ...editableReport,
      layout: updatedLayout,
    }
    setEditableReport(payload)
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
      compactType="horizontal"
      onLayoutChange={(layout) => onLayoutChange(layout)}
    >
      {editableReport.layout.map((item) => {
        return (
          <div key={item.id} data-grid={{ ...item, minH: 4, maxH: 4, minW: 8 }}>
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
