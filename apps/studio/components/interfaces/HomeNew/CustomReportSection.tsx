import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SnippetDropdown } from 'components/interfaces/HomeNew/SnippetDropdown'
import { ReportBlock } from 'components/interfaces/Reports/ReportBlock/ReportBlock'
import type { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { DEFAULT_CHART_CONFIG } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentInfiniteQuery } from 'data/content/content-infinite-query'
import { Content } from 'data/content/content-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import type { Dashboards } from 'types'
import { Button } from 'ui'
import { Row } from 'ui-patterns'

export function CustomReportSection() {
  const startDate = dayjs().subtract(7, 'day').toISOString()
  const endDate = dayjs().toISOString()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: reportsData } = useContentInfiniteQuery(
    { projectRef: ref, type: 'report', name: 'Home', limit: 1 },
    { keepPreviousData: true }
  )
  const homeReport = reportsData?.pages?.[0]?.content?.[0] as Content | undefined
  const reportContent = homeReport?.content as Dashboards.Content | undefined
  const [editableReport, setEditableReport] = useState<Dashboards.Content | undefined>(
    reportContent
  )

  useEffect(() => {
    if (reportContent) setEditableReport(reportContent)
  }, [reportContent])

  const { can: canUpdateReport } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: homeReport?.visibility,
        owner_id: homeReport?.owner_id,
      },
      subject: { id: profile?.id },
    }
  )

  const { can: canCreateReport } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    { resource: { type: 'report', owner_id: profile?.id }, subject: { id: profile?.id } }
  )

  const { mutate: upsertContent } = useContentUpsertMutation()

  const persistReport = useCallback(
    (updated: Dashboards.Content) => {
      if (!ref || !homeReport) return
      upsertContent({ projectRef: ref, payload: { ...homeReport, content: updated } })
    },
    [homeReport, ref, upsertContent]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = () => {}

  const recomputeSimpleGrid = useCallback(
    (layout: Dashboards.Chart[]) =>
      layout.map(
        (block, idx): Dashboards.Chart => ({
          ...block,
          x: idx % 2,
          y: Math.floor(idx / 2),
          w: 1,
          h: 1,
        })
      ),
    []
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!editableReport || !active || !over || active.id === over.id) return
      const items = editableReport.layout.map((x) => String(x.id))
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

  const findNextPlacement = useCallback((current: Dashboards.Chart[]) => {
    const occupied = new Set(current.map((c) => `${c.y}-${c.x}`))
    let y = 0
    for (; ; y++) {
      const left = occupied.has(`${y}-0`)
      const right = occupied.has(`${y}-1`)
      if (!left || !right) {
        const x = left ? 1 : 0
        return { x, y }
      }
    }
  }, [])

  const createSnippetChartBlock = useCallback(
    (
      snippet: { id: string; name: string },
      position: { x: number; y: number }
    ): Dashboards.Chart => ({
      x: position.x,
      y: position.y,
      w: 1,
      h: 1,
      id: snippet.id,
      label: snippet.name,
      attribute: `snippet_${snippet.id}` as unknown as Dashboards.Chart['attribute'],
      provider: 'daily-stats',
      chart_type: 'bar',
      chartConfig: DEFAULT_CHART_CONFIG,
    }),
    []
  )

  const addSnippetToReport = (snippet: { id: string; name: string }) => {
    if (
      editableReport?.layout?.some(
        (x) =>
          String(x.id) === String(snippet.id) || String(x.attribute) === `snippet_${snippet.id}`
      )
    ) {
      toast('This block is already in your report')
      return
    }
    // If the Home report doesn't exist yet, create it with the new block
    if (!editableReport || !homeReport) {
      if (!ref || !profile) return

      // Initial placement for first block
      const initialBlock = createSnippetChartBlock(snippet, { x: 0, y: 0 })

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

      if (ref && organization?.slug) {
        sendEvent({
          action: 'home_custom_report_block_added',
          properties: {
            block_id: snippet.id,
            position: 0,
          },
          groups: {
            project: ref,
            organization: organization.slug,
          },
        })
      }
      return
    }
    const current = [...editableReport.layout]
    const { x, y } = findNextPlacement(current)
    current.push(createSnippetChartBlock(snippet, { x, y }))
    const updated = { ...editableReport, layout: current }
    setEditableReport(updated)
    persistReport(updated)

    if (ref && organization?.slug) {
      sendEvent({
        action: 'home_custom_report_block_added',
        properties: {
          block_id: snippet.id,
          position: current.length - 1,
        },
        groups: {
          project: ref,
          organization: organization.slug,
        },
      })
    }
  }

  const handleRemoveChart = ({ metric }: { metric: { key: string } }) => {
    if (!editableReport) return
    const removedChart = editableReport.layout.find(
      (x) => x.attribute === (metric.key as unknown as Dashboards.Chart['attribute'])
    )
    const nextLayout = editableReport.layout.filter(
      (x) => x.attribute !== (metric.key as unknown as Dashboards.Chart['attribute'])
    )
    const updated = { ...editableReport, layout: nextLayout }
    setEditableReport(updated)
    persistReport(updated)

    if (ref && organization?.slug && removedChart) {
      sendEvent({
        action: 'home_custom_report_block_removed',
        properties: {
          block_id: String(removedChart.id),
        },
        groups: {
          project: ref,
          organization: organization.slug,
        },
      })
    }
  }

  const handleUpdateChart = (
    id: string,
    {
      chart,
      chartConfig,
    }: { chart?: Partial<Dashboards.Chart>; chartConfig?: Partial<ChartConfig> }
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
                items={(editableReport?.layout ?? []).map((x) => String(x.id))}
                strategy={rectSortingStrategy}
              >
                <Row columns={[3, 2, 1]}>
                  {layout.map((item) => (
                    <SortableReportBlock key={item.id} id={String(item.id)}>
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
                          onUpdateChart={(config) => handleUpdateChart(item.id, config)}
                        />
                      </div>
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

function SortableReportBlock({ id, children }: { id: string; children: ReactNode }) {
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
      {...attributes}
      {...(listeners ?? {})}
    >
      {children}
    </div>
  )
}
