import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { X, Settings2, ArrowUpDown, GripVertical, GripHorizontal } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import { useParams } from 'common'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import Results from '../SQLEditor/UtilityPanel/Results'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  Label_Shadcn_,
  Checkbox_Shadcn_,
} from 'ui'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCallback } from 'react'
import BarChart from 'components/ui/Charts/BarChart'
import dayjs from 'dayjs'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import ReportGridItem from './ReportGridItem'

const ReactGridLayout = WidthProvider(Responsive)

interface GridResizeProps {
  startDate: string
  endDate: string
  interval: string
  editableReport: any
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  setEditableReport: (payload: any) => void
}

// Add chart config type
const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
}

// Update layout item type
interface LayoutItem {
  id: string
  label: string
  sql?: string
  isSnippet?: boolean
  results?: any
  isChart?: boolean
  chartConfig?: ChartConfig
  // ... other existing fields ...
}

const GridResize = ({
  startDate,
  endDate,
  interval,
  editableReport,
  disableUpdate,
  onRemoveChart,
  setEditableReport,
}: GridResizeProps) => {
  function onLayoutChange(layout: any) {
    let updatedLayout = [...editableReport.layout]
    layout.map((item: any) => {
      const index = updatedLayout.findIndex((x: any) => x.id === item.i)
      updatedLayout[index].w = layout[index].w
      updatedLayout[index].h = layout[index].h
      updatedLayout[index].x = layout[index].x
      updatedLayout[index].y = layout[index].y
    })
    setEditableReport({
      ...editableReport,
      layout: updatedLayout,
    })
  }

  if (!editableReport) return null

  return (
    <ReactGridLayout
      autoSize={true}
      layout={editableReport}
      onLayoutChange={(layout) => onLayoutChange(layout)}
      rowHeight={60}
      cols={{ lg: LAYOUT_COLUMN_COUNT, md: 2, sm: 1 }}
      containerPadding={[0, 0]}
      compactType="vertical"
      resizeHandles={['sw', 'se']}
      isDraggable={true}
      isResizable={true}
      draggableHandle=".grid-item-drag-handle"
    >
      {editableReport.layout.map((x: LayoutItem) => (
        <div
          key={x.id}
          data-grid={{
            ...x,
            minH: 4,
            minW: 1,
            maxH: 12,
            maxW: LAYOUT_COLUMN_COUNT,
          }}
          className="react-grid-layout__report-item bg-surface-100 border-overlay group relative rounded border shadow-sm hover:border-green-900"
        >
          <div className="grid-item-drag-handle absolute left-1 top-1 z-20 cursor-move opacity-0 transition-opacity group-hover:opacity-100">
            <GripHorizontal size={14} strokeWidth={1.5} />
          </div>
          <ReportGridItem
            item={x}
            disableUpdate={disableUpdate}
            onRemoveChart={onRemoveChart}
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            editableReport={editableReport}
            setEditableReport={setEditableReport}
          />
        </div>
      ))}
    </ReactGridLayout>
  )
}

export default GridResize
