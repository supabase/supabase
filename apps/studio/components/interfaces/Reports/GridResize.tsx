import RGL, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DEFAULT_CHART_CONFIG } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from 'data/content/content-upsert-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useProfile } from 'lib/profile'
import uuidv4 from 'lib/uuid'
import { Dashboards } from 'types'
import { createSqlSnippetSkeletonV2 } from '../SQLEditor/SQLEditor.utils'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import { ReportBlock } from './ReportBlock/ReportBlock'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'

const ReactGridLayout = WidthProvider(RGL)

interface GridResizeProps {
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  editableReport: Dashboards.Content
  disableUpdate: boolean
  isRefreshing: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: (
    id: string,
    {
      chart,
      chartConfig,
    }: { chart?: Partial<Dashboards.Chart>; chartConfig?: Partial<ChartConfig> }
  ) => void
  setEditableReport: (payload: any) => void
}

export const GridResize = ({
  startDate,
  endDate,
  interval,
  editableReport,
  disableUpdate,
  isRefreshing,
  onRemoveChart,
  onUpdateChart,
  setEditableReport,
}: GridResizeProps) => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const { project } = useProjectContext()

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: upsertContent } = useContentUpsertMutation()

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

  const onDropBlock = async (layout: RGL.Layout[], layoutItem: RGL.Layout, e: any) => {
    if (!ref) return console.error('Project ref is required')
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')

    const data = e.dataTransfer.getData('application/json')
    if (!data) return

    const queryData = JSON.parse(data)
    const { label, sql, config } = queryData
    if (!label || !sql) return console.error('SQL and Label required')

    const toastId = toast.loading(`Creating new query: ${label}`)

    const id = uuidv4()
    const updatedLayout = layout.map((x) => {
      const existingBlock = editableReport.layout.find((y) => x.i === y.id)
      if (existingBlock) {
        return { ...existingBlock, x: x.x, y: x.y }
      } else {
        return {
          id,
          attribute: `new_snippet_${id}`,
          chartConfig: { ...DEFAULT_CHART_CONFIG, ...(config ?? {}) },
          label,
          chart_type: 'bar',
          h: layoutItem.h,
          w: layoutItem.w,
          x: layoutItem.x,
          y: layoutItem.y,
        }
      }
    })
    setEditableReport({ ...editableReport, layout: updatedLayout })

    const payload = createSqlSnippetSkeletonV2({
      id,
      name: label,
      sql,
      owner_id: profile?.id,
      project_id: project?.id,
    }) as UpsertContentPayload

    upsertContent(
      { projectRef: ref, payload },
      {
        onSuccess: () => {
          toast.success(`Successfully created new query: ${label}`, { id: toastId })
          const finalLayout = updatedLayout.map((x) => {
            if (x.id === id) {
              return { ...x, attribute: `snippet_${id}` }
            } else return x
          })
          setEditableReport({ ...editableReport, layout: finalLayout })
        },
      }
    )
    sendEvent({ action: 'custom_report_assistant_sql_block_added' })
  }

  if (!editableReport) return null

  return (
    <ReactGridLayout
      autoSize
      isDraggable
      isDroppable
      isResizable
      rowHeight={270}
      cols={LAYOUT_COLUMN_COUNT}
      containerPadding={[0, 0]}
      resizeHandles={['sw', 'se']}
      compactType="vertical"
      onDrop={onDropBlock}
      onDragStop={onUpdateLayout}
      onResizeStop={onUpdateLayout}
      draggableHandle=".grid-item-drag-handle"
    >
      {editableReport.layout.map((item) => {
        return (
          <div
            key={item.id}
            data-grid={{ ...item, h: 1, minH: 1, maxH: 1, minW: 1, maxW: LAYOUT_COLUMN_COUNT }}
          >
            <ReportBlock
              key={item.id}
              item={item}
              startDate={startDate}
              endDate={endDate}
              interval={interval}
              disableUpdate={disableUpdate}
              isRefreshing={isRefreshing}
              onRemoveChart={onRemoveChart}
              onUpdateChart={(config) => onUpdateChart(item.id, config)}
            />
          </div>
        )
      })}
    </ReactGridLayout>
  )
}
