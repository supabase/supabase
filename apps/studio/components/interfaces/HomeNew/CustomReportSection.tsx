import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ReportBlock } from 'components/interfaces/Reports/ReportBlock/ReportBlock'
import { DEFAULT_CHART_CONFIG } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import {
  Content,
  useContentQuery,
  useContentQuery as useReportQuery,
} from 'data/content/content-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useProfile } from 'lib/profile'
import type { Dashboards } from 'types'
import { uuidv4 } from 'lib/helpers'
import { Button } from 'ui'
import { Row } from 'ui-patterns'
import SnippetDropdown from './SnippetDropdown'

export default function CustomReportSection() {
  const startDate = dayjs().subtract(7, 'day').toISOString()
  const endDate = dayjs().toISOString()
  // Snippet search moved into SnippetDropdown
  const { ref } = useParams()
  const { profile } = useProfile()

  // Load the "Home" report
  const { data: reportsData } = useReportQuery({
    projectRef: ref,
    type: 'report',
    name: 'Home',
    limit: 1,
  })
  const homeReport = reportsData?.content?.[0] as Content | undefined
  const reportContent = homeReport?.content as Dashboards.Content | undefined
  const [editableReport, setEditableReport] = useState<Dashboards.Content | undefined>(
    reportContent
  )

  useEffect(() => {
    if (reportContent) setEditableReport(reportContent)
  }, [reportContent])

  const canUpdateReport = useCheckPermissions(PermissionAction.UPDATE, 'user_content', {
    resource: {
      type: 'report',
      visibility: (homeReport as any)?.visibility,
      owner_id: (homeReport as any)?.owner_id,
    },
    subject: { id: profile?.id },
  })

  const canCreateReport = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'report', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const { mutate: upsertContent } = useContentUpsertMutation()

  const persistReport = (updated: Dashboards.Content) => {
    if (!ref || !homeReport) return
    upsertContent({ projectRef: ref, payload: { ...homeReport, content: updated } })
  }

  // Drag and drop reordering for report blocks
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = () => {}

  const recomputeSimpleGrid = useCallback((layout: any[]) => {
    return layout.map((block: any, idx: number) => ({
      ...block,
      x: idx % 2,
      y: Math.floor(idx / 2),
      w: 1,
      h: 1,
    }))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!editableReport || !active || !over || active.id === over.id) return
      const items = editableReport.layout.map((x: any) => String(x.id))
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return

      const moved = arrayMove(editableReport.layout, oldIndex, newIndex)
      const recomputed = recomputeSimpleGrid(moved)
      const updated = { ...editableReport, layout: recomputed }
      setEditableReport(updated)
      persistReport(updated)
    },
    [editableReport, persistReport, recomputeSimpleGrid]
  )

  const findNextPlacement = useCallback((current: any[]) => {
    let x = 0
    let y: number | null = null
    const chartsByY = current.reduce((acc: Record<string, any[]>, item: any) => {
      const key = String(item.y)
      acc[key] = acc[key] ? [...acc[key], item] : [item]
      return acc
    }, {})
    const yValues = Object.keys(chartsByY)
    if (yValues.length === 0) {
      y = 0
    } else {
      for (const yValue of yValues) {
        const totalWidthTaken = chartsByY[yValue].reduce((a, b) => a + b.w, 0)
        if (2 - totalWidthTaken >= 1) {
          y = Number(yValue)
          x = totalWidthTaken
          break
        }
      }
      if (y === null) {
        y = Number(yValues[yValues.length - 1]) + 1
      }
    }
    return { x, y: y as number }
  }, [])

  const addSnippetToReport = (snippet: any) => {
    // If the Home report doesn't exist yet, create it with the new block
    if (!editableReport || !homeReport) {
      if (!ref || !profile) return

      // Initial placement for first block
      const initialBlock: Dashboards.Chart = {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        id: snippet.id,
        label: snippet.name,
        attribute: `snippet_${snippet.id}` as any,
        provider: undefined as any,
        chart_type: 'bar',
        chartConfig: DEFAULT_CHART_CONFIG,
      }

      const newReport: Dashboards.Content = {
        schema_version: 1,
        period_start: { time_period: '7d', date: '' },
        period_end: { time_period: 'today', date: '' },
        interval: '1d',
        layout: [initialBlock],
      }

      setEditableReport(newReport)
      upsertContent({
        projectRef: ref,
        payload: {
          id: uuidv4(),
          type: 'report',
          name: 'Home',
          description: '',
          visibility: 'project',
          owner_id: profile.id,
          content: newReport,
        },
      })
      return
    }
    const current = [...editableReport.layout]
    const { x, y } = findNextPlacement(current)
    current.push({
      x,
      y: y as number,
      w: 1,
      h: 1,
      id: snippet.id,
      label: snippet.name,
      attribute: `snippet_${snippet.id}` as Dashboards.ChartType,
      provider: undefined as any,
      chart_type: 'bar',
      chartConfig: DEFAULT_CHART_CONFIG,
    })
    const updated = { ...editableReport, layout: current }
    setEditableReport(updated)
    persistReport(updated)
  }

  const handleRemoveChart = ({ metric }: { metric: { key: string } }) => {
    if (!editableReport) return
    const nextLayout = editableReport.layout.filter((x) => x.attribute !== (metric.key as any))
    const updated = { ...editableReport, layout: nextLayout }
    setEditableReport(updated)
    persistReport(updated)
  }

  const handleUpdateChart = (
    id: string,
    { chart, chartConfig }: { chart?: Partial<Dashboards.Chart>; chartConfig?: Partial<any> }
  ) => {
    if (!editableReport) return
    const currentChart = editableReport.layout.find((x) => x.id === id)
    if (!currentChart) return
    const updatedChart: Dashboards.Chart = { ...currentChart, ...(chart ?? {}) }
    if (chartConfig) {
      updatedChart.chartConfig = { ...(currentChart.chartConfig ?? {}), ...chartConfig }
    }
    const updatedLayouts = editableReport.layout.map((x) => (x.id === id ? updatedChart : x))
    const updated = { ...editableReport, layout: updatedLayouts }
    setEditableReport(updated)
    persistReport(updated)
  }

  const layout = useMemo(() => editableReport?.layout ?? [], [editableReport])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="heading-section">At a glance</h3>
        {canUpdateReport || canCreateReport ? (
          <SnippetDropdown
            projectRef={ref}
            onSelect={addSnippetToReport}
            trigger={
              <Button type="default" icon={<Plus />}>
                Add block
              </Button>
            }
            side="bottom"
            align="end"
            autoFocus
          />
        ) : null}
      </div>
      <div className="relative">
        {(() => {
          if (layout.length === 0) {
            return (
              <div className="flex min-h-[270px] items-center justify-center rounded border-2 border-dashed p-16 border-default">
                {canUpdateReport || canCreateReport ? (
                  <SnippetDropdown
                    projectRef={ref}
                    onSelect={addSnippetToReport}
                    trigger={
                      <Button type="default" iconRight={<Plus size={14} />}>
                        Add your first chart
                      </Button>
                    }
                    side="bottom"
                    align="center"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-foreground-light">No charts set up yet in report</p>
                )}
              </div>
            )
          }
          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(editableReport?.layout ?? []).map((x: any) => String(x.id))}
                strategy={rectSortingStrategy}
              >
                <Row columns={[3, 2, 1]}>
                  {layout.map((item: any) => (
                    <SortableReportBlock key={item.id} id={String(item.id)}>
                      {({ attributes, listeners }: { attributes: any; listeners: any }) => (
                        <div className="h-64">
                          <ReportBlock
                            key={item.id}
                            item={item}
                            startDate={startDate}
                            endDate={endDate}
                            interval={
                              (editableReport?.interval as AnalyticsInterval) ??
                              ('1d' as AnalyticsInterval)
                            }
                            disableUpdate={false}
                            isRefreshing={false}
                            onRemoveChart={handleRemoveChart}
                            onUpdateChart={(config) => handleUpdateChart(item.id, config as any)}
                            dragAttributes={attributes}
                            dragListeners={listeners}
                          />
                        </div>
                      )}
                    </SortableReportBlock>
                  ))}
                </Row>
              </SortableContext>
            </DndContext>
          )
        })()}
      </div>
    </div>
  )
}

function SortableReportBlock({
  id,
  children,
}: {
  id: string
  children:
    | ((args: { attributes: any; listeners: any; isDragging: boolean }) => ReactNode)
    | ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-70 will-change-transform' : 'will-change-transform'}
    >
      {typeof children === 'function'
        ? (children as any)({ attributes, listeners, isDragging })
        : children}
    </div>
  )
}
